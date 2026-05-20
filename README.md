# Multi-Objective Recommender — Full Stack App

## Stack
- **Backend**: FastAPI + Uvicorn (Python 3.11)
- **Frontend**: React 18 + TypeScript + Vite + Recharts + Zustand + TanStack Query

## Folder structure

```
recommender-app/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py                   ← FastAPI entry, CORS, router registration
│       ├── core/
│       │   └── data_engine.py        ← Cached synthetic session + product data
│       ├── services/
│       │   └── recommender.py        ← Multi-objective scorer (click/cart/order)
│       └── api/
│           ├── overview.py           ← KPIs, event dist, hourly, funnel
│           ├── sessions.py           ← List, detail, length dist, co-occurrence
│           ├── recommendations.py    ← POST /rank, GET /pareto
│           └── model.py              ← Recall/NDCG/MRR, feature importance, arch
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts                ← /api proxy → localhost:8000
    ├── tsconfig.json
    └── src/
        ├── main.tsx                  ← Bootstrap: React + QueryClient
        ├── App.tsx                   ← Routes: Overview / Sessions / Model / Recs
        ├── index.css                 ← Dark theme CSS vars + global resets
        ├── services/api.ts           ← All axios calls (typed)
        ├── store/useAppStore.ts      ← Zustand global state
        ├── components/
        │   ├── layout/Layout.tsx     ← Sidebar + header shell
        │   ├── ui/index.tsx          ← KpiCard, Badge, Card, HBar, WeightSlider…
        │   └── charts/index.tsx      ← All Recharts components
        └── pages/
            ├── Overview.tsx          ← KPIs + event dist + hourly + funnel
            ├── Sessions.tsx          ← Table + timeline + heatmap + length dist
            ├── Model.tsx             ← Metrics + feature importance + arch
            └── Recommendations.tsx   ← Filters + weight sliders + ranked table + Pareto
```

## Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/overview/kpis | KPI summary |
| GET | /api/overview/event-distribution | Click/cart/order counts |
| GET | /api/overview/hourly-volume | Hourly event breakdown |
| GET | /api/overview/category-breakdown | Events per category |
| GET | /api/overview/funnel | Conversion funnel |
| GET | /api/sessions/ | Paginated session list |
| GET | /api/sessions/{id} | Session detail + events |
| GET | /api/sessions/length-distribution | Session length histogram |
| GET | /api/sessions/cooccurrence/matrix | Product co-occurrence matrix |
| POST | /api/recommendations/rank | Ranked product list with weights |
| GET | /api/recommendations/pareto | Pareto frontier data |
| GET | /api/model/metrics | Recall, NDCG, MRR at K |
| GET | /api/model/feature-importance | Feature importance scores |
| GET | /api/model/architecture | Model layer architecture |
