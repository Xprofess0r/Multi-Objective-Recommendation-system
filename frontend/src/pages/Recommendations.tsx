import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRanked, fetchPareto } from '@/services/api'
import {
  Card, CardTitle, Spinner, ErrorMsg,
  ObjectiveChips, WeightSlider, ScoreBar, SignalBadge,
} from '@/components/ui'
import { ScoreGroupedChart, ParetoScatter } from '@/components/charts'

type ObjFilter = 'all' | 'click' | 'cart' | 'order'

export default function RecommendationsPage() {
  const [objective, setObjective] = useState<ObjFilter>('all')
  const [sessionId]               = useState(0)
  const [weights, setWeights]     = useState({ click: 33, cart: 33, order: 34 })
  const [cfAlpha, setCfAlpha]     = useState(25)   // 0-100, div by 100 for API

  const payload = {
    session_id:   sessionId,
    click_weight: weights.click / 100,
    cart_weight:  weights.cart  / 100,
    order_weight: weights.order / 100,
    top_k:        20,
    objective,
    cf_alpha:     cfAlpha / 100,
  }

  const ranked = useQuery({ queryKey: ['ranked', payload], queryFn: () => fetchRanked(payload) })
  const pareto  = useQuery({ queryKey: ['pareto', sessionId], queryFn: () => fetchPareto(sessionId) })
  const recs: any[] = ranked.data?.recommendations ?? []
  const setWeight = (key: 'click' | 'cart' | 'order', val: number) =>
    setWeights(w => ({ ...w, [key]: val }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          Recommendations
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Tune objective weights · collaborative filtering blend · inspect top-20
        </p>
      </div>

      {/* Controls: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardTitle>Objective filter</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            Re-rank by a single objective or use the blended score.
          </p>
          <ObjectiveChips value={objective} onChange={setObjective} />
        </Card>

        <Card>
          <CardTitle>Objective blend weights</CardTitle>
          <WeightSlider label="Click"  value={weights.click}  onChange={v => setWeight('click', v)}  color="var(--blue)" />
          <WeightSlider label="Cart"   value={weights.cart}   onChange={v => setWeight('cart',  v)}  color="var(--teal)" />
          <WeightSlider label="Order"  value={weights.order}  onChange={v => setWeight('order', v)}  color="var(--amber)" />
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            Norm:&nbsp;
            {Math.round(weights.click / (weights.click + weights.cart + weights.order) * 100)}% ·&nbsp;
            {Math.round(weights.cart  / (weights.click + weights.cart + weights.order) * 100)}% ·&nbsp;
            {Math.round(weights.order / (weights.click + weights.cart + weights.order) * 100)}%
          </p>
        </Card>

        <Card>
          <CardTitle>Collaborative filtering blend</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
            Mix user-user CF scores into the final ranking.
          </p>
          <WeightSlider label="CF alpha" value={cfAlpha} onChange={setCfAlpha} color="var(--purple)" />
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', fontSize: 11 }}>
            <span style={{ color: 'var(--text3)' }}>Score = </span>
            <span style={{ color: 'var(--blue-light)' }}>{100 - cfAlpha}% model</span>
            <span style={{ color: 'var(--text3)' }}> + </span>
            <span style={{ color: 'var(--purple-light)' }}>{cfAlpha}% CF</span>
          </div>
          {cfAlpha > 0 && (
            <p style={{ fontSize: 11, color: 'var(--teal-light)', marginTop: 8 }}>
              ✓ Collaborative filtering active
            </p>
          )}
        </Card>
      </div>

      {/* Ranked table */}
      <Card style={{ marginBottom: 16, padding: 0 }}>
        <div style={{
          padding: '14px 20px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <CardTitle>Top-20 recommendations — session #{sessionId}</CardTitle>
          {ranked.isFetching && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Updating…</span>}
        </div>

        {ranked.isLoading ? <div style={{ padding: 24 }}><Spinner /></div> :
         ranked.error    ? <div style={{ padding: 24 }}><ErrorMsg msg="Failed to load recommendations" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Product', 'Category', 'Click', 'Cart', 'Order', 'CF', 'Combined', 'Signal'].map(h => (
                    <th key={h} style={{
                      padding: '8px 10px', textAlign: 'left', fontSize: 10,
                      color: 'var(--text3)', fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recs.map((r: any) => (
                  <tr key={r.product_id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text3)' }}>{r.rank}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: 'var(--blue-dim)', color: 'var(--blue-light)' }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}><ScoreBar value={r.score_click}  color="var(--blue)"   /></td>
                    <td style={{ padding: '8px 10px' }}><ScoreBar value={r.score_cart}   color="var(--teal)"   /></td>
                    <td style={{ padding: '8px 10px' }}><ScoreBar value={r.score_order}  color="var(--amber)"  /></td>
                    <td style={{ padding: '8px 10px' }}><ScoreBar value={r.score_cf ?? 0} color="var(--purple)" /></td>
                    <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {r.score_combined.toFixed(3)}
                    </td>
                    <td style={{ padding: '8px 10px' }}><SignalBadge signal={r.signal} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Bottom charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>Score distribution — top 10 items</CardTitle>
          {ranked.isLoading ? <Spinner /> : ranked.error ? <ErrorMsg msg="Failed" /> : <ScoreGroupedChart data={recs} />}
        </Card>
        <Card>
          <CardTitle>Pareto frontier — cart vs order score</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
            Upper-right items maximise both objectives simultaneously.
          </p>
          {pareto.isLoading ? <Spinner /> : pareto.error ? <ErrorMsg msg="Failed" /> : <ParetoScatter data={pareto.data} />}
        </Card>
      </div>
    </div>
  )
}