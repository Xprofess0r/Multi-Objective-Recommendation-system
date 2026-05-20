import axios from 'axios'

// frontend/src/services/api.ts
const BASE_URL = (import.meta as any).env.VITE_API_URL ?? '';

const api = axios.create({ baseURL: `${BASE_URL}/api` })

// ── Overview ──────────────────────────────────────────────────────────────────
export const fetchKPIs              = () => api.get('/overview/kpis').then(r => r.data)
export const fetchEventDist         = () => api.get('/overview/event-distribution').then(r => r.data)
export const fetchHourlyVolume      = () => api.get('/overview/hourly-volume').then(r => r.data)
export const fetchCategoryBreakdown = () => api.get('/overview/category-breakdown').then(r => r.data)
export const fetchFunnel            = () => api.get('/overview/funnel').then(r => r.data)

// ── Sessions ──────────────────────────────────────────────────────────────────
export const fetchSessions          = (limit = 50, offset = 0) =>
  api.get(`/sessions/?limit=${limit}&offset=${offset}`).then(r => r.data)
export const fetchSessionDetail     = (id: number) =>
  api.get(`/sessions/${id}`).then(r => r.data)
export const fetchSessionLengthDist = () =>
  api.get('/sessions/length-distribution').then(r => r.data)
export const fetchCooccurrence      = (topN = 6) =>
  api.get(`/sessions/cooccurrence/matrix?top_n=${topN}`).then(r => r.data)

// ── Recommendations ───────────────────────────────────────────────────────────
export const fetchRanked = (payload: {
  session_id?:   number
  click_weight?: number
  cart_weight?:  number
  order_weight?: number
  top_k?:        number
  objective?:    string
  cf_alpha?:     number
}) => api.post('/recommendations/rank', payload).then(r => r.data)

export const fetchPareto     = (sessionId = 0) =>
  api.get(`/recommendations/pareto?session_id=${sessionId}`).then(r => r.data)

export const fetchABTest     = (payload: {
  session_id?: number
  top_k?:      number
  config_a:    Record<string, number>
  config_b:    Record<string, number>
}) => api.post('/recommendations/ab-test', payload).then(r => r.data)

export const fetchOttoSample = (limit = 100) =>
  api.get(`/recommendations/otto-sample?limit=${limit}`).then(r => r.data)

// ── Model ─────────────────────────────────────────────────────────────────────
export const fetchModelMetrics      = () => api.get('/model/metrics').then(r => r.data)
export const fetchFeatureImportance = () => api.get('/model/feature-importance').then(r => r.data)
export const fetchArchitecture      = () => api.get('/model/architecture').then(r => r.data)
export const fetchCFStats           = () => api.get('/model/cf-stats').then(r => r.data)