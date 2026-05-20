"""app/api/recommendations.py — ranked recommendations + A/B test + CF"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.recommender import rank_candidates, compare_configs
from app.core.data_engine import get_sessions, get_otto_sample

router = APIRouter()


class WeightPayload(BaseModel):
    session_id:   Optional[int] = 0
    click_weight: float = 0.33
    cart_weight:  float = 0.33
    order_weight: float = 0.34
    top_k:        int   = 20
    objective:    str   = "all"
    cf_alpha:     float = 0.25


class ABPayload(BaseModel):
    session_id: Optional[int] = 0
    top_k:      int = 20
    config_a: dict = {"click": 0.33, "cart": 0.33, "order": 0.34, "cf_alpha": 0.0}
    config_b: dict = {"click": 0.10, "cart": 0.30, "order": 0.60, "cf_alpha": 0.35}


def _normalise_weights(click, cart, order):
    total = click + cart + order
    total = total or 1.0
    return {"click": click / total, "cart": cart / total, "order": order / total}


@router.post("/rank")
def rank(payload: WeightPayload):
    sessions = get_sessions()
    sid      = payload.session_id % len(sessions)
    events   = sessions[sid]["events"]

    if payload.objective == "click":
        w = {"click": 1.0, "cart": 0.0, "order": 0.0}
    elif payload.objective == "cart":
        w = {"click": 0.0, "cart": 1.0, "order": 0.0}
    elif payload.objective == "order":
        w = {"click": 0.0, "cart": 0.0, "order": 1.0}
    else:
        w = _normalise_weights(payload.click_weight, payload.cart_weight, payload.order_weight)

    recs = rank_candidates(events, w, top_k=payload.top_k, cf_alpha=payload.cf_alpha)
    return {"session_id": sid, "weights": w, "cf_alpha": payload.cf_alpha, "recommendations": recs}


@router.get("/pareto")
def pareto(session_id: int = 0, top_k: int = 60):
    sessions = get_sessions()
    sid      = session_id % len(sessions)
    events   = sessions[sid]["events"]
    w        = {"click": 0.33, "cart": 0.33, "order": 0.34}
    recs     = rank_candidates(events, w, top_k=top_k, cf_alpha=0.25)
    return [
        {
            "product_id":  r["product_id"],
            "name":        r["name"],
            "score_cart":  r["score_cart"],
            "score_order": r["score_order"],
            "score_click": r["score_click"],
            "score_cf":    r["score_cf"],
            "category":    r["category"],
        }
        for r in recs
    ]


@router.post("/ab-test")
def ab_test(payload: ABPayload):
    sessions = get_sessions()
    sid      = payload.session_id % len(sessions)
    events   = sessions[sid]["events"]
    result   = compare_configs(events, payload.config_a, payload.config_b, payload.top_k)
    return result


@router.get("/otto-sample")
def otto_sample(limit: int = 200):
    """Returns events in OTTO Kaggle dataset format for schema demonstration."""
    data = get_otto_sample()
    return {
        "schema": {"session": "int", "aid": "int", "ts": "int (ms)", "type": "0=click,1=cart,2=order"},
        "total":  len(data),
        "sample": data[:limit],
    }