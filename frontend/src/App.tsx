import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Overview from '@/pages/Overview'
import SessionsPage from '@/pages/Sessions'
import ModelPage from '@/pages/Model'
import RecommendationsPage from '@/pages/Recommendations'
import ABTestPage from '@/pages/ABTest'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview"        element={<Overview />} />
          <Route path="sessions"        element={<SessionsPage />} />
          <Route path="model"           element={<ModelPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="ab-test"         element={<ABTestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}