import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchABTest } from '@/services/api'
import { Card, CardTitle, Spinner, ErrorMsg, WeightSlider } from '@/components/ui'

interface Config {
  click: number; cart: number; order: number; cf_alpha: number
}

const PRESETS: { label: string; a: Config; b: Config }[] = [
  {
    label: 'Engagement vs Revenue',
    a: { click: 70, cart: 20, order: 10, cf_alpha: 0 },
    b: { click: 10, cart: 20, order: 70, cf_alpha: 0 },
  },
  {
    label: 'Model vs Hybrid CF',
    a: { click: 33, cart: 33, order: 34, cf_alpha: 0 },
    b: { click: 33, cart: 33, order: 34, cf_alpha: 50 },
  },
  {
    label: 'Cart-first vs Balanced',
    a: { click: 10, cart: 70, order: 20, cf_alpha: 0 },
    b: { click: 33, cart: 33, order: 34, cf_alpha: 25 },
  },
]

function ConfigPanel({
  label, color, config, onChange,
}: { label: string; color: string; config: Config; onChange: (c: Config) => void }) {
  const set = (key: keyof Config, val: number) => onChange({ ...config, [key]: val })
  return (
    <Card style={{ borderTop: `2px solid ${color}` }}>
      <CardTitle>{label}</CardTitle>
      <WeightSlider label="Click weight"  value={config.click}    onChange={v => set('click',    v)} color={color} />
      <WeightSlider label="Cart weight"   value={config.cart}     onChange={v => set('cart',     v)} color={color} />
      <WeightSlider label="Order weight"  value={config.order}    onChange={v => set('order',    v)} color={color} />
      <WeightSlider label="CF alpha %"    value={config.cf_alpha} onChange={v => set('cf_alpha', v)} color="var(--purple)" />
      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: 'var(--bg3)', fontSize: 11, color: 'var(--text2)' }}>
        Blend: {config.click}% click · {config.cart}% cart · {config.order}% order · {config.cf_alpha}% CF
      </div>
    </Card>
  )
}

function MetricDiff({ label, a, b, unit = '' }: { label: string; a: number; b: number; unit?: string }) {
  const diff  = b - a
  const isPos = diff > 0
  const color = isPos ? 'var(--teal-light)' : diff < 0 ? '#F09595' : 'var(--text3)'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{a.toFixed(2)}{unit}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>→</span>
        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{b.toFixed(2)}{unit}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {isPos ? '↑' : diff < 0 ? '↓' : ''} {Math.abs(diff).toFixed(2)}{unit}
        </span>
      </div>
    </div>
  )
}

function RankDeltaTable({ changes }: { changes: any[] }) {
  return (
    <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1 }}>
          <tr>
            {['Product', 'Rank A', 'Rank B', 'Δ Rank', 'Score A', 'Score B'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {changes.map((c: any) => {
            const improved = c.delta > 0
            const downgraded = c.delta < 0
            return (
              <tr key={c.product_id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 10px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>#{c.rank_a}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>#{c.rank_b}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: improved ? 'var(--teal-dim)' : downgraded ? 'rgba(216,90,48,.12)' : 'var(--bg3)',
                    color: improved ? 'var(--teal-light)' : downgraded ? '#F0997B' : 'var(--text3)',
                  }}>
                    {c.delta > 0 ? `↑ +${c.delta}` : c.delta < 0 ? `↓ ${c.delta}` : '—'}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{c.score_a.toFixed(3)}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{c.score_b.toFixed(3)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OverlapBar({ pct }: { pct: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--text2)' }}>Top-20 list overlap</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)', borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
        {pct > 80 ? 'High similarity — configs produce near-identical lists' :
         pct > 50 ? 'Moderate divergence — meaningful ranking differences' :
                    'High divergence — very different recommendation strategies'}
      </div>
    </div>
  )
}

function SideBySideList({ recs_a, recs_b }: { recs_a: any[]; recs_b: any[] }) {
  const ids_b = new Set(recs_b.map((r: any) => r.product_id))
  const ids_a = new Set(recs_a.map((r: any) => r.product_id))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[
        { label: 'Config A', recs: recs_a, otherIds: ids_b, color: 'var(--blue)' },
        { label: 'Config B', recs: recs_b, otherIds: ids_a, color: 'var(--amber)' },
      ].map(({ label, recs, otherIds, color }) => (
        <div key={label}>
          <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 8 }}>{label}</div>
          {recs.slice(0, 10).map((r: any) => {
            const isUnique = !otherIds.has(r.product_id)
            return (
              <div key={r.product_id} style={{
                display: 'flex', gap: 8, alignItems: 'center', padding: '5px 8px',
                borderRadius: 6, marginBottom: 3,
                background: isUnique ? 'rgba(55,138,221,.07)' : 'transparent',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', width: 20, flexShrink: 0 }}>#{r.rank}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: color }}>{r.score_combined.toFixed(3)}</span>
                {isUnique && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: 'var(--blue-dim)', color: 'var(--blue-light)', flexShrink: 0 }}>unique</span>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function ABTestPage() {
  const [sessionId] = useState(0)
  const [configA, setConfigA] = useState<Config>({ click: 70, cart: 20, order: 10, cf_alpha: 0 })
  const [configB, setConfigB] = useState<Config>({ click: 10, cart: 20, order: 70, cf_alpha: 35 })

  const payload = {
    session_id: sessionId,
    top_k: 20,
    config_a: { click: configA.click / 100, cart: configA.cart / 100, order: configA.order / 100, cf_alpha: configA.cf_alpha / 100 },
    config_b: { click: configB.click / 100, cart: configB.cart / 100, order: configB.order / 100, cf_alpha: configB.cf_alpha / 100 },
  }

  const result = useQuery({ queryKey: ['abtest', payload], queryFn: () => fetchABTest(payload) })
  const m = result.data?.metrics

  const applyPreset = (p: typeof PRESETS[0]) => {
    setConfigA({ ...p.a, cf_alpha: Math.round(p.a.cf_alpha) })
    setConfigB({ ...p.b, cf_alpha: Math.round(p.b.cf_alpha) })
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>A/B Test Simulator</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Compare two ranking configurations side-by-side · rank deltas · simulated metric lift
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Presets:</span>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)} style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
            border: '1px solid var(--border2)', background: 'var(--bg2)',
            color: 'var(--text2)', transition: 'all .15s',
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--blue)'; (e.target as HTMLElement).style.color = 'var(--blue-light)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border2)'; (e.target as HTMLElement).style.color = 'var(--text2)' }}
          >{p.label}</button>
        ))}
      </div>

      {/* Config panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ConfigPanel label="Config A" color="var(--blue)"  config={configA} onChange={setConfigA} />
        <ConfigPanel label="Config B" color="var(--amber)" config={configB} onChange={setConfigB} />
      </div>

      {result.isLoading ? <Spinner /> : result.error ? <ErrorMsg msg="Failed to run A/B test" /> : result.data && (
        <>
          {/* Metric lift summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <CardTitle>Simulated metric lift (A → B)</CardTitle>
              <MetricDiff label="Avg combined score" a={m.avg_score_a}  b={m.avg_score_b} />
              <MetricDiff label="CTR estimate"        a={m.ctr_a}        b={m.ctr_b}        unit="%" />
              <MetricDiff label="Order rate estimate" a={m.order_rate_a} b={m.order_rate_b} unit="%" />
              <div style={{ marginTop: 14 }}>
                <OverlapBar pct={result.data.overlap_pct} />
              </div>
            </Card>

            <Card>
              <CardTitle>Recall lift % (A → B)</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '80%', gap: 0 }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color: m.recall_lift >= 0 ? 'var(--teal-light)' : '#F09595' }}>
                    {m.recall_lift >= 0 ? '+' : ''}{m.recall_lift}%
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>combined recall lift</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 16 }}>
                    {m.recall_lift > 5 ? '🎯 Config B performs significantly better' :
                     m.recall_lift > 0 ? '↑ Config B shows marginal improvement' :
                     m.recall_lift < 0 ? '↓ Config A performs better' :
                     '= Configs perform equivalently'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Side by side top-10 */}
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Top-10 lists — side by side</CardTitle>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
              Items highlighted in blue appear only in that config's top-10.
            </p>
            <SideBySideList recs_a={result.data.recs_a} recs_b={result.data.recs_b} />
          </Card>

          {/* Rank delta table */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Rank changes A → B (sorted by |Δ|)</CardTitle>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                {result.data.overlap} of 20 items shared
              </span>
            </div>
            <RankDeltaTable changes={result.data.rank_changes} />
          </Card>
        </>
      )}
    </div>
  )
}