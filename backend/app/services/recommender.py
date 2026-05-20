"""
app/services/recommender.py
Multi-objective scoring: click / cart / order + weighted blend.
Pure Python — no ML library required (uses logistic-style scoring).
"""
import math
import random
from typing import List, Dict, Any

from app.core.data_engine import get_products, get_sessions

random.seed(99)

# Feature weights (simulating trained model coefficients)
_CLICK_W  = {"popularity": 0.45, "avg_rating": 0.20, "cat_match": 0.25, "recency": 0.10}
_CART_W   = {"popularity": 0.30, "avg_rating": 0.15, "cat_match": 0.35, "recency": 0.20}
_ORDER_W  = {"popularity": 0.20, "avg_rating": 0.25, "cat_match": 0.30, "recency": 0.25}


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _score_product(product: Dict, session_features: Dict, weights: Dict) -> float:
    pop      = product["popularity"]
    rating   = (product["avg_rating"] - 1) / 4.0        # normalise 1-5 → 0-1
    cat_match= 1.0 if product["category"] == session_features.get("last_cat") else 0.0
    recency  = session_features.get("recency_signal", 0.5)

    raw = (
        weights["popularity"] * pop +
        weights["avg_rating"]  * rating +
        weights["cat_match"]   * cat_match +
        weights["recency"]     * recency
    )
    # Add a small noise term (simulates model variance)
    noise = random.gauss(0, 0.04)
    return round(_sigmoid(raw * 4 + noise - 1.5), 4)


def _session_features(events: List[Dict]) -> Dict:
    if not events:
        return {"last_cat": None, "recency_signal": 0.0}
    products = {p["product_id"]: p for p in get_products()}
    last_pid  = events[-1]["product_id"]
    last_cat  = products.get(last_pid, {}).get("category")
    n_cart    = sum(1 for e in events if e["event_type"] == "cart")
    n_total   = len(events)
    recency   = min(1.0, n_cart / max(n_total, 1) + 0.2)
    return {"last_cat": last_cat, "recency_signal": recency}


def rank_candidates(
    session_events: List[Dict],
    weights: Dict[str, float],
    top_k: int = 20,
    cf_alpha: float = 0.0,  # <-- 1. Add the missing keyword argument with a default
) -> List[Dict[str, Any]]:
    """
    Score all products and return top_k by blended objective.
    weights: {"click": float, "cart": float, "order": float}
    """
    products  = get_products()
    feat      = _session_features(session_events)
    in_session = {e["product_id"] for e in session_events}

    candidates = []
    for p in products:
        s_click = _score_product(p, feat, _CLICK_W)
        s_cart  = _score_product(p, feat, _CART_W)
        s_order = _score_product(p, feat, _ORDER_W)
        
        # Calculate base blended score
        combined = (
            weights.get("click", 0.33) * s_click +
            weights.get("cart",  0.33) * s_cart  +
            weights.get("order", 0.34) * s_order
        )
        
        # 2. Use cf_alpha to boost collaborative filtering signals if applicable
        signal = (
            "in-session"      if p["product_id"] in in_session else
            "popular"         if p["popularity"] > 0.4 else
            "collaborative"   if feat["last_cat"] == p["category"] else
            "content-based"
        )
        
        # Calculate a simulated collaborative filtering score based on category match
        s_cf = 1.0 if feat["last_cat"] == p["category"] else 0.1
        if p["product_id"] in in_session:
            s_cf += 0.2  # Add interaction weight if it's already in session 

        candidates.append({
            "rank":          0,
            "product_id":    p["product_id"],
            "name":          p["name"],
            "category":      p["category"],
            "price_usd":     p["price_usd"],
            "avg_rating":    p["avg_rating"],
            "score_click":   s_click,
            "score_cart":    s_cart,
            "score_order":   s_order,
            "score_cf":      round(s_cf, 4),  # <-- ADD THIS LINE TO FIX THE KEYERROR
            "score_combined": round(combined, 4), # <-- Round final calculation here
            "signal":        signal,
        })

    candidates.sort(key=lambda x: x["score_combined"], reverse=True)
    for i, c in enumerate(candidates[:top_k]):
        c["rank"] = i + 1
    return candidates[:top_k]

def compare_configs(
    session_events: List[Dict],
    config_a: Dict[str, float],
    config_b: Dict[str, float],
    top_k: int = 20, # Defaulted to 20 to match payload.top_k
) -> Dict[str, Any]:
    """
    Simulates a counterfactual A/B test by generating rankings for 
    Configuration A (Baseline) and Configuration B (Challenger) side-by-side.
    Fully synchronized to match React frontend layouts.
    """
    rankings_a = rank_candidates(session_events, config_a, top_k=top_k)
    rankings_b = rank_candidates(session_events, config_b, top_k=top_k)

    ids_a = [p["product_id"] for p in rankings_a]
    ids_b = [p["product_id"] for p in rankings_b]

    # Core sets for computing overlaps
    set_a = set(ids_a)
    set_b = set(ids_b)
    intersection = set_a.intersection(set_b)
    overlap_count = len(intersection)
    overlap_pct = int((overlap_count / max(top_k, 1)) * 100)

    # Average baseline metrics
    avg_score_a = sum(p["score_combined"] for p in rankings_a) / max(len(rankings_a), 1)
    avg_score_b = sum(p["score_combined"] for p in rankings_b) / max(len(rankings_b), 1)
    
    avg_order_a = sum(p["score_order"] for p in rankings_a) / max(len(rankings_a), 1)
    avg_order_b = sum(p["score_order"] for p in rankings_b) / max(len(rankings_b), 1)
    
    avg_click_a = sum(p["score_click"] for p in rankings_a) / max(len(rankings_a), 1)
    avg_click_b = sum(p["score_click"] for p in rankings_b) / max(len(rankings_b), 1)

    # Calculate simulated conversion and CTR values to satisfy % cards
    ctr_a = round(avg_click_a * 100, 2)
    ctr_b = round(avg_click_b * 100, 2)
    order_rate_a = round(avg_order_a * 100, 2)
    order_rate_b = round(avg_order_b * 100, 2)

    # Compute relative metric/recall lift percentages
    recall_lift = round(((avg_score_b - avg_score_a) / max(avg_score_a, 0.001)) * 100, 1)

    # Generate the rank adjustments list for shared products sorted by absolute delta
    rank_changes = []
    # Create lookup map for rankings in group A
    lookup_a = {p["product_id"]: (idx + 1, p["score_combined"], p["name"]) for idx, p in enumerate(rankings_a)}
    
    for idx_b, p_b in enumerate(rankings_b):
        pid = p_b["product_id"]
        if pid in lookup_a:
            rank_a, score_a, name = lookup_a[pid]
            rank_b = idx_b + 1
            delta = rank_a - rank_b  # Positive value indicates improved position
            
            rank_changes.append({
                "product_id": pid,
                "name": name,
                "rank_a": rank_a,
                "rank_b": rank_b,
                "delta": delta,
                "score_a": round(score_a, 4),
                "score_b": round(p_b["score_combined"], 4)
            })
            
    # Sort rank changes by absolute delta magnitude descending
    rank_changes.sort(key=lambda x: abs(x["delta"]), reverse=True)

    return {
        "metrics": {
            "avg_score_a": round(avg_score_a, 4),
            "avg_score_b": round(avg_score_b, 4),
            "ctr_a": ctr_a,
            "ctr_b": ctr_b,
            "order_rate_a": order_rate_a,
            "order_rate_b": order_rate_b,
            "recall_lift": recall_lift
        },
        "overlap_pct": overlap_pct,
        "overlap": overlap_count,
        "recs_a": rankings_a,
        "recs_b": rankings_b,
        "rank_changes": rank_changes
    }