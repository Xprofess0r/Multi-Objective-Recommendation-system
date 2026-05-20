import { useQuery } from '@tanstack/react-query'
import { fetchModelMetrics, fetchFeatureImportance, fetchArchitecture, fetchCFStats } from '@/services/api'
import { Card, CardTitle, Spinner, ErrorMsg, HBar } from '@/components/ui'
import { RecallChart, HybridLiftChart } from '@/components/charts'

const LAYER_COLORS: Record<string, string> = {
  Input:    'var(--blue-dim)',
  Features: 'var(--purple-dim)',
  'CF Layer':'rgba(127,119,221,.18)',
  Model:    'var(--amber-dim)',
  Blend:    'rgba(29,158,117,.15)',
  Output:   'rgba(216,90,48,.12)',
}
const LAYER_BORDERS: Record<string, string> = {
  Input:    'var(--blue)',
  Features: 'var(--purple)',
  'CF Layer':'var(--purple)',
  Model:    'var(--amber)',
  Blend:    'var(--teal)',
  Output:   'var(--coral)',
}
const GROUP_COLORS: Record<string, string> = {
  session:  'var(--blue)',
  product:  'var(--teal)',
  cf:       'var(--purple)',
  temporal: 'var(--amber)',
}

function ArchDiagram({ layers }: { layers: { name: string; nodes: string[] }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {layers.map((layer, i) => (
        <div key={layer.name}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
            {layer.name}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {layer.nodes.map(n => (
              <span key={n} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                background: LAYER_COLORS[layer.name] ?? 'var(--bg3)',
                color: 'var(--text)',
                border: `1px solid ${LAYER_BORDERS[layer.name] ?? 'var(--border2)'}`,
              }}>{n}</span>
            ))}
          </div>
          {i < layers.length - 1 && (
            <div style={{ paddingLeft: 10, marginTop: 3, fontSize: 13, color: 'var(--text3)' }}>↓</div>
          )}
        </div>
      ))}
    </div>
  )
}

function MetricsTable({ data }: { data: any[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {['Objective', 'K', 'Model', 'Baseline', 'Δ pp'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const delta = ((row.model - row.baseline) * 100).toFixed(1)
            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px', color: 'var(--text)', textTransform: 'capitalize', fontWeight: 500 }}>{row.objective}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text3)' }}>{row.k}</td>
                <td style={{ padding: '8px 12px', color: 'var(--blue-light)', fontWeight: 600 }}>{row.model.toFixed(3)}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text3)' }}>{row.baseline.toFixed(3)}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: 'var(--teal-dim)', color: 'var(--teal-light)' }}>+{delta}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CFStatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--purple-light)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function ModelPage() {
  const metrics = useQuery({ queryKey: ['metrics'],  queryFn: fetchModelMetrics })
  const feats   = useQuery({ queryKey: ['feats'],    queryFn: fetchFeatureImportance })
  const arch    = useQuery({ queryKey: ['arch'],     queryFn: fetchArchitecture })
  const cfStats = useQuery({ queryKey: ['cfStats'],  queryFn: fetchCFStats })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Model</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Architecture · CF matrix stats · feature importance · Recall@K · hybrid lift
        </p>
      </div>

      {/* Top recall cards */}
      {metrics.isLoading ? <Spinner /> : metrics.error ? <ErrorMsg msg="Failed to load metrics" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {(['click', 'cart', 'order'] as const).map((obj, i) => {
            const row     = metrics.data.recall.find((r: any) => r.objective === obj && r.k === 20)
            const hybrid  = metrics.data.hybrid?.find((r: any) => r.objective === obj)
            const colors  = ['var(--blue)', 'var(--teal)', 'var(--amber)']
            return (
              <div key={obj} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: `2px solid ${colors[i]}`, borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{obj} Recall@20</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{row?.model.toFixed(3) ?? '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4 }}>
                  +{row ? ((row.model - row.baseline) * 100).toFixed(1) : '—'} pp vs baseline
                </div>
                {hybrid && (
                  <div style={{ fontSize: 11, color: 'var(--purple-light)', marginTop: 2 }}>
                    Hybrid: {hybrid.hybrid.toFixed(3)} (+{((hybrid.hybrid - hybrid.model) * 100).toFixed(1)} pp)
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* CF stats row */}
      <div style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle>Collaborative Filtering — matrix statistics</CardTitle>
          {cfStats.isLoading ? <Spinner /> : cfStats.error ? <ErrorMsg msg="Failed" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              <CFStatCard label="Users"             value={cfStats.data.n_users}                                    sub="unique user IDs" />
              <CFStatCard label="Items"             value={cfStats.data.n_items}                                    sub="covered products" />
              <CFStatCard label="Interactions"      value={cfStats.data.total_interactions.toLocaleString()}        sub="click+cart+order" />
              <CFStatCard label="Matrix density"    value={`${cfStats.data.matrix_density}%`}                      sub="sparsity metric" />
              <CFStatCard label="Avg items/user"    value={cfStats.data.avg_items_per_user}                        sub="interactions" />
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: recall chart + hybrid lift */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardTitle>Recall@20 — model vs baseline</CardTitle>
          {metrics.isLoading ? <Spinner /> : metrics.error ? <ErrorMsg msg="Failed" /> : <RecallChart data={metrics.data.recall} />}
        </Card>
        <Card>
          <CardTitle>Hybrid lift — model vs CF hybrid</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
            Recall@20 gain from adding collaborative filtering.
          </p>
          {metrics.isLoading ? <Spinner /> : metrics.error ? <ErrorMsg msg="Failed" /> : <HybridLiftChart data={metrics.data.hybrid ?? []} />}
        </Card>
      </div>

      {/* Row 3: feature importance + arch */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardTitle>Feature importance by group</CardTitle>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(GROUP_COLORS).map(([g, c]) => (
              <span key={g} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />{g}
              </span>
            ))}
          </div>
          {feats.isLoading ? <Spinner /> : feats.error ? <ErrorMsg msg="Failed" /> : (
            feats.data.map((f: any) => (
              <HBar key={f.feature} label={f.feature} value={f.importance} max={100} color={GROUP_COLORS[f.group] ?? 'var(--blue)'} />
            ))
          )}
        </Card>
        <Card>
          <CardTitle>Model architecture</CardTitle>
          {arch.isLoading ? <Spinner /> : arch.error ? <ErrorMsg msg="Failed" /> : <ArchDiagram layers={arch.data.layers} />}
        </Card>
      </div>

      {/* Row 4: full metrics table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <CardTitle>Full Recall@K report</CardTitle>
        </div>
        {metrics.isLoading ? <div style={{ padding: 20 }}><Spinner /></div> :
         metrics.error    ? <div style={{ padding: 20 }}><ErrorMsg msg="Failed" /></div> :
         <MetricsTable data={metrics.data.recall} />}
      </Card>
    </div>
  )
}