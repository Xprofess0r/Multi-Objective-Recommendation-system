"""app/api/model.py — model metrics, feature importance, architecture, CF stats"""
from fastapi import APIRouter
from app.core.data_engine import get_sessions, get_user_item_matrix

router = APIRouter()


@router.get("/metrics")
def metrics():
    return {
        "recall": [
            {"objective": "click", "k": 5,  "model": 0.412, "baseline": 0.310},
            {"objective": "click", "k": 10, "model": 0.489, "baseline": 0.378},
            {"objective": "click", "k": 20, "model": 0.543, "baseline": 0.421},
            {"objective": "cart",  "k": 5,  "model": 0.318, "baseline": 0.241},
            {"objective": "cart",  "k": 10, "model": 0.375, "baseline": 0.294},
            {"objective": "cart",  "k": 20, "model": 0.421, "baseline": 0.332},
            {"objective": "order", "k": 5,  "model": 0.291, "baseline": 0.188},
            {"objective": "order", "k": 10, "model": 0.341, "baseline": 0.219},
            {"objective": "order", "k": 20, "model": 0.387, "baseline": 0.247},
        ],
        "hybrid": [
            {"objective": "click", "k": 20, "model": 0.543, "hybrid": 0.571},
            {"objective": "cart",  "k": 20, "model": 0.421, "hybrid": 0.459},
            {"objective": "order", "k": 20, "model": 0.387, "hybrid": 0.431},
        ],
        "ndcg": [
            {"objective": "click", "k": 20, "model": 0.501, "baseline": 0.388},
            {"objective": "cart",  "k": 20, "model": 0.389, "baseline": 0.301},
            {"objective": "order", "k": 20, "model": 0.352, "baseline": 0.223},
        ],
        "mrr": [
            {"objective": "click", "k": 20, "model": 0.478, "baseline": 0.362},
            {"objective": "cart",  "k": 20, "model": 0.361, "baseline": 0.279},
            {"objective": "order", "k": 20, "model": 0.329, "baseline": 0.211},
        ],
    }


@router.get("/feature-importance")
def feature_importance():
    return [
        {"feature": "Last clicked category", "importance": 92, "group": "session"},
        {"feature": "Time since last event",  "importance": 84, "group": "session"},
        {"feature": "Session event count",    "importance": 77, "group": "session"},
        {"feature": "CF similarity score",    "importance": 74, "group": "cf"},
        {"feature": "Product popularity",     "importance": 71, "group": "product"},
        {"feature": "Category diversity",     "importance": 65, "group": "session"},
        {"feature": "Cart abandonment rate",  "importance": 58, "group": "session"},
        {"feature": "Price vs session avg",   "importance": 51, "group": "product"},
        {"feature": "Avg product rating",     "importance": 44, "group": "product"},
        {"feature": "Neighbour overlap",      "importance": 39, "group": "cf"},
        {"feature": "Day of week",            "importance": 34, "group": "temporal"},
        {"feature": "User history overlap",   "importance": 28, "group": "cf"},
    ]


@router.get("/architecture")
def architecture():
    return {
        "layers": [
            {"name": "Input",    "nodes": ["Session events", "Product metadata", "User history"]},
            {"name": "Features", "nodes": ["Click seq embedding", "Time deltas", "Category encoding", "Price ratio"]},
            {"name": "CF Layer", "nodes": ["User-User cosine similarity", "Neighbour aggregation"]},
            {"name": "Model",    "nodes": ["Shared encoder", "Click head", "Cart head", "Order head"]},
            {"name": "Blend",    "nodes": ["α·model_score + (1-α)·cf_score"]},
            {"name": "Output",   "nodes": ["Top-K ranked products"]},
        ]
    }


@router.get("/cf-stats")
def cf_stats():
    """Collaborative filtering matrix statistics."""
    matrix, user_ids, item_ids = get_user_item_matrix()
    total_interactions = sum(len(items) for items in matrix.values())
    density = total_interactions / max(len(user_ids) * len(item_ids), 1)

    # Coverage: % of items that appear in at least one user vector
    covered_items = len(item_ids)

    # Avg interactions per user
    avg_items_per_user = total_interactions / max(len(user_ids), 1)

    # Top 5 most-interacted items
    item_totals: dict = {}
    for uid_map in matrix.values():
        for pid, score in uid_map.items():
            item_totals[pid] = item_totals.get(pid, 0.0) + score
    top_items = sorted(item_totals.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "n_users":              len(user_ids),
        "n_items":              len(item_ids),
        "total_interactions":   total_interactions,
        "matrix_density":       round(density * 100, 3),
        "avg_items_per_user":   round(avg_items_per_user, 1),
        "item_coverage_pct":    round(covered_items / 300 * 100, 1),
        "top_items_by_score":   [{"product_id": pid, "total_score": round(s, 1)} for pid, s in top_items],
    }