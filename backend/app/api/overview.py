"""app/api/overview.py — KPI + event distribution + hourly volume"""
from fastapi import APIRouter
from app.core.data_engine import get_sessions, get_products
import random

router = APIRouter()
random.seed(7)


@router.get("/kpis")
def kpis():
    sessions = get_sessions()
    all_events = [e for s in sessions for e in s["events"]]
    total_events  = len(all_events)
    n_clicks = sum(1 for e in all_events if e["event_type"] == "click")
    n_carts  = sum(1 for e in all_events if e["event_type"] == "cart")
    n_orders = sum(1 for e in all_events if e["event_type"] == "order")
    sessions_with_cart  = sum(1 for s in sessions if s["n_carts"] > 0)
    sessions_with_order = sum(1 for s in sessions if s["n_orders"] > 0)

    # Calculate real funnel conversion: (Total Orders / Total Carts) * 100
    cart_to_order_rate = round(n_orders / max(n_carts, 1) * 100, 1)
    
    # Calculate difference against a baseline value (e.g., 39.2%)
    baseline = 39.2
    order_conversion_lift = round(cart_to_order_rate - baseline, 1)

    return {
        "total_sessions":    len(sessions),
        "total_products":    len(get_products()),
        "click_rate":        round(n_clicks / total_events * 100, 1),
        "cart_conversion":   round(sessions_with_cart / len(sessions) * 100, 1),
        "order_conversion":  round(sessions_with_order / len(sessions) * 100, 1),
        
        # Add these two dynamic metrics to feed the frontend layout
        "cart_to_order_rate":    cart_to_order_rate,
        "order_conversion_lift": order_conversion_lift,
        
        "total_events":      total_events,
        "n_clicks":          n_clicks,
        "n_carts":           n_carts,
        "n_orders":          n_orders,
    }


@router.get("/event-distribution")
def event_distribution():
    sessions = get_sessions()
    all_events = [e for s in sessions for e in s["events"]]
    n_clicks = sum(1 for e in all_events if e["event_type"] == "click")
    n_carts  = sum(1 for e in all_events if e["event_type"] == "cart")
    n_orders = sum(1 for e in all_events if e["event_type"] == "order")
    total = len(all_events) or 1
    return [
        {"event": "click", "count": n_clicks, "pct": round(n_clicks / total * 100, 1)},
        {"event": "cart",  "count": n_carts,  "pct": round(n_carts  / total * 100, 1)},
        {"event": "order", "count": n_orders, "pct": round(n_orders / total * 100, 1)},
    ]


@router.get("/hourly-volume")
def hourly_volume():
    sessions = get_sessions()
    hourly = {h: {"click": 0, "cart": 0, "order": 0} for h in range(24)}
    for s in sessions:
        for e in s["events"]:
            hour = (e["timestamp"] // 3600) % 24
            hourly[hour][e["event_type"]] += 1
    return [
        {"hour": h, **hourly[h]}
        for h in range(24)
    ]


@router.get("/category-breakdown")
def category_breakdown():
    sessions = get_sessions()
    products = {p["product_id"]: p for p in get_products()}
    cat_counts: dict = {}
    for s in sessions:
        for e in s["events"]:
            cat = products.get(e["product_id"], {}).get("category", "Unknown")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
    total = sum(cat_counts.values()) or 1
    return sorted(
        [{"category": k, "count": v, "pct": round(v / total * 100, 1)}
         for k, v in cat_counts.items()],
        key=lambda x: x["count"], reverse=True,
    )


@router.get("/funnel")
def funnel():
    sessions = get_sessions()
    total    = len(sessions)
    w_click  = sum(1 for s in sessions if s["n_clicks"]  > 0)
    w_cart   = sum(1 for s in sessions if s["n_carts"]   > 0)
    w_order  = sum(1 for s in sessions if s["n_orders"]  > 0)
    return [
        {"stage": "Clicked",        "sessions": w_click,  "pct": round(w_click  / total * 100, 1)},
        {"stage": "Added to cart",  "sessions": w_cart,   "pct": round(w_cart   / total * 100, 1)},
        {"stage": "Ordered",        "sessions": w_order,  "pct": round(w_order  / total * 100, 1)},
    ]
