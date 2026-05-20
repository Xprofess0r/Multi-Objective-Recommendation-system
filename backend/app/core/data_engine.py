import random
import math
from functools import lru_cache
from typing import List, Dict, Any, Tuple

# Fixed seed for reproducibility
random.seed(42)

CATEGORIES = [
    "Electronics", "Clothing", "Home & Garden", "Books",
    "Sports", "Beauty", "Toys", "Automotive", "Food", "Music",
]
CAT_WEIGHTS = [0.20, 0.18, 0.13, 0.10, 0.10, 0.08, 0.07, 0.06, 0.05, 0.03]

PRODUCT_NAMES = {
    "Electronics":   ["Laptop Pro 15\"", "Wireless Headphones", "Bluetooth Speaker",
                      "Smartwatch Gen3", "Tablet Ultra", "USB-C Hub", "Webcam 4K", "Gaming Mouse"],
    "Clothing":      ["Jeans Slim Fit", "T-Shirt Organic", "Winter Jacket",
                      "Running Shorts", "Casual Hoodie", "Wool Sweater"],
    "Home & Garden": ["Coffee Maker", "Air Fryer XL", "Desk Lamp LED",
                      "Robot Vacuum", "Plant Pot Set", "Blender Pro"],
    "Books":         ["Python Cookbook", "Novel: The Dawn", "Data Science Guide",
                      "Design Patterns", "ML from Scratch", "System Design"],
    "Sports":        ["Running Shoes M", "Yoga Mat Premium", "Football Official",
                      "Gym Gloves", "Water Bottle Pro", "Resistance Bands"],
    "Beauty":        ["Skincare Set", "Perfume Luxe", "Lip Gloss Kit", "Serum Vitamin C"],
    "Toys":          ["LEGO City Set", "RC Car Pro", "Board Game Classic", "Puzzle 1000pc"],
    "Automotive":    ["Car Phone Mount", "Dash Cam HD", "Seat Covers Set"],
    "Food":          ["Vitamin C 1000mg", "Protein Powder", "Green Tea 100pk"],
    "Music":         ["Guitar Acoustic", "Piano Keyboard", "Drum Pad MIDI"],
}


def _weighted_choice(items, weights):
    r = random.random()
    cumulative = 0.0
    for item, w in zip(items, weights):
        cumulative += w
        if r < cumulative:
            return item
    return items[-1]


def _lognormal(mean=3.5, sigma=1.2, lo=1, hi=5000):
    val = math.exp(random.gauss(mean, sigma))
    return round(max(lo, min(hi, val)), 2)


@lru_cache(maxsize=1)
def get_products(n: int = 300) -> List[Dict[str, Any]]:
    """
    Returns product catalogue.  n=300 gives denser interactions.
    Each product has: product_id, name, category, price_usd,
                      popularity, avg_rating, num_reviews.
    """
    rng = random.Random(42)
    products = []
    for i in range(n):
        cat = _weighted_choice(CATEGORIES, CAT_WEIGHTS)
        names = PRODUCT_NAMES.get(cat, ["Product X"])
        products.append({
            "product_id":  i,
            "name":        rng.choice(names) + f" #{i}",
            "category":    cat,
            "price_usd":   _lognormal(),
            "popularity":  round(rng.betavariate(0.8, 3), 4),   # less skewed → more orders
            "avg_rating":  round(rng.uniform(2.5, 5.0), 1),
            "num_reviews": rng.randint(0, 50000),
        })
    return products


@lru_cache(maxsize=1)
def get_sessions(n: int = 800) -> List[Dict[str, Any]]:
    """
    FIX: cart→order probability raised to 0.45 (was 0.18).
         click→cart probability raised to 0.35 (was 0.22).
         n=800 sessions for richer co-occurrence data.
    """
    rng = random.Random(42)
    products = get_products()
    pop_weights = [p["popularity"] for p in products]
    total_pop = sum(pop_weights) or 1.0
    pop_weights = [w / total_pop for w in pop_weights]

    sessions = []
    base_ts = 1704067200  # 2024-01-01 00:00:00 UTC

    for sid in range(n):
        user_id = rng.randint(0, 4999)
        # Longer sessions on average → more cart/order events
        n_events = max(2, min(int(rng.paretovariate(1.2)), 30))

        chosen_ids = rng.choices(
            range(len(products)), weights=pop_weights, k=n_events * 3
        )
        chosen_ids = list(dict.fromkeys(chosen_ids))[:n_events]

        session_start = base_ts + rng.randint(0, 7776000)
        cart_set, order_set = set(), set()
        events = []
        offset = 0

        for pid in chosen_ids:
            # 1. Start with the base interaction (Click)
            ts = session_start + offset
            events.append({
                "event_type": "click",
                "product_id": pid,
                "timestamp": ts,
            })
            offset += rng.randint(20, 180)

            # 2. Check if the user adds it to their cart (35% probability)
            if rng.random() < 0.35:
                ts = session_start + offset
                events.append({
                    "event_type": "cart",
                    "product_id": pid,
                    "timestamp": ts,
                })
                offset += rng.randint(20, 240)

                # 3. Check if they immediately checkout/order the item (45% probability)
                if rng.random() < 0.45:
                    ts = session_start + offset
                    events.append({
                        "event_type": "order",  # Cascades perfectly to the frontend schema!
                        "product_id": pid,
                        "timestamp": ts,
                    })
                    offset += rng.randint(10, 120)

            

        sessions.append({
            "session_id":   sid,
            "user_id":      user_id,
            "events":       events,
            "n_clicks":     sum(1 for e in events if e["event_type"] == "click"),
            "n_carts":      sum(1 for e in events if e["event_type"] == "cart"),
            "n_orders":     sum(1 for e in events if e["event_type"] == "order"),
            "duration_sec": offset,
            "start_ts":     session_start,
        })

    return sessions


@lru_cache(maxsize=1)
def get_otto_sample() -> List[Dict[str, Any]]:
    """
    Mirrors the OTTO Kaggle dataset schema (session_id, aid, ts, type).
    Returns a realistic sample of 2000 sessions in OTTO format.
    'aid' = article_id = our product_id
    type: 0=clicks, 1=carts, 2=orders  (OTTO convention)
    """
    TYPE_MAP = {"click": 0, "cart": 1, "order": 2}
    sessions = get_sessions()
    otto_events = []
    for s in sessions[:2000]:
        for e in s["events"]:
            otto_events.append({
                "session": s["session_id"],
                "aid":     e["product_id"],
                "ts":      e["timestamp"] * 1000,   # OTTO uses milliseconds
                "type":    TYPE_MAP.get(e["event_type"], 0),
            })
    return otto_events


@lru_cache(maxsize=1)
def get_user_item_matrix() -> Tuple[Dict[int, Dict[int, float]], List[int], List[int]]:
    """
    Builds a sparse user-item interaction matrix for collaborative filtering.
    Returns:
        matrix  — {user_id: {product_id: interaction_score}}
        user_ids — ordered list of user IDs
        item_ids — ordered list of product IDs
    Interaction score = 1*click + 3*cart + 5*order (weighted)
    """
    sessions = get_sessions()
    WEIGHTS = {"click": 1.0, "cart": 3.0, "order": 5.0}

    matrix: Dict[int, Dict[int, float]] = {}
    for s in sessions:
        uid = s["user_id"]
        if uid not in matrix:
            matrix[uid] = {}
        for e in s["events"]:
            pid = e["product_id"]
            w   = WEIGHTS.get(e["event_type"], 1.0)
            matrix[uid][pid] = matrix[uid].get(pid, 0.0) + w

    user_ids = sorted(matrix.keys())
    item_ids = sorted({pid for uid_map in matrix.values() for pid in uid_map})
    return matrix, user_ids, item_ids