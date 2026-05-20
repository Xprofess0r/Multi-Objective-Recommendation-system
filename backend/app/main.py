"""main.py — FastAPI entry point (v2: adds ab_test + cf routes)"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import overview, sessions, recommendations, model

app = FastAPI(
    title="Multi-Objective Recommender API",
    description="E-commerce click, cart & order prediction — v2 with CF + A/B testing",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router,        prefix="/api/overview",        tags=["Overview"])
app.include_router(sessions.router,        prefix="/api/sessions",        tags=["Sessions"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(model.router,           prefix="/api/model",           tags=["Model"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "recommender-api", "version": "2.0.0"}