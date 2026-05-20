"""app/api/sessions.py — session list, detail, timeline, session length dist"""
from fastapi import APIRouter, HTTPException
from app.core.data_engine import get_sessions, get_products

router = APIRouter()


@router.get("/")
def list_sessions(limit: int = 50, offset: int = 0):
    sessions = get_sessions()
    items = sessions[offset: offset + limit]
    return {
        "total":   len(sessions),
        "limit":   limit,
        "offset":  offset,
        "items": [
            {
                "session_id":   s["session_id"],
                "user_id":      s["user_id"],
                "n_events":     len(s["events"]),
                "n_clicks":     s["n_clicks"],
                "n_carts":      s["n_carts"],
                "n_orders":     s["n_orders"],
                "duration_sec": s["duration_sec"],
            }
            for s in items
        ],
    }


@router.get("/length-distribution")
def length_distribution():
    sessions = get_sessions()
    bins = {"1": 0, "2": 0, "3": 0, "4-6": 0, "7-10": 0, "11+": 0}
    for s in sessions:
        n = len(s["events"])
        if   n == 1:  bins["1"]    += 1
        elif n == 2:  bins["2"]    += 1
        elif n == 3:  bins["3"]    += 1
        elif n <= 6:  bins["4-6"]  += 1
        elif n <= 10: bins["7-10"] += 1
        else:         bins["11+"]  += 1
    return [{"bucket": k, "count": v} for k, v in bins.items()]


@router.get("/{session_id}")
def session_detail(session_id: int):
    sessions = get_sessions()
    if session_id < 0 or session_id >= len(sessions):
        raise HTTPException(status_code=404, detail="Session not found")
    s = sessions[session_id]
    products = {p["product_id"]: p for p in get_products()}
    enriched_events = []
    for e in s["events"]:
        prod = products.get(e["product_id"], {})
        enriched_events.append({
            **e,
            "product_name": prod.get("name", "Unknown"),
            "category":     prod.get("category", "Unknown"),
            "price_usd":    prod.get("price_usd", 0),
        })
    return {**s, "events": enriched_events}


@router.get("/cooccurrence/matrix")
def cooccurrence_matrix(top_n: int = 6):
    sessions = get_sessions()
    products = get_products()
    top_prods = sorted(products, key=lambda p: p["popularity"], reverse=True)[:top_n]
    top_ids   = [p["product_id"] for p in top_prods]
    top_names = [p["name"].split("#")[0].strip()[:16] for p in top_prods]

    matrix = [[0] * top_n for _ in range(top_n)]
    for s in sessions:
        pids_in_session = {e["product_id"] for e in s["events"]}
        for i, pid_i in enumerate(top_ids):
            for j, pid_j in enumerate(top_ids):
                if i != j and pid_i in pids_in_session and pid_j in pids_in_session:
                    matrix[i][j] += 1

    max_val = max(matrix[i][j] for i in range(top_n) for j in range(top_n) if i != j) or 1
    normalised = [
        [round(matrix[i][j] / max_val, 2) for j in range(top_n)]
        for i in range(top_n)
    ]
    return {"labels": top_names, "matrix": normalised}
