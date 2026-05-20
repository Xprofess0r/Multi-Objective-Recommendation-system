import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, ScatterChart, Scatter, ZAxis,
} from 'recharts'

const COLORS = { click: '#378ADD', cart: '#1D9E75', order: '#EF9F27' }

const TIP = {
  contentStyle: { background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, color: 'var(--text)' },
  itemStyle:    { color: 'var(--text)' },
  labelStyle:   { color: 'var(--text2)', marginBottom: 4 },
}

/* ── Event doughnut ───────────────────────────────────────────────────────────── */
export function EventPieChart({ data }: { data: { event: string; count: number; pct: number }[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="event" cx="50%" cy="50%"
            innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
            {data.map(d => <Cell key={d.event} fill={COLORS[d.event as keyof typeof COLORS] ?? '#888'} />)}
          </Pie>
          <Tooltip {...TIP} formatter={(v: number, name: string) => [v.toLocaleString(), name]} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
        {data.map(d => (
          <div key={d.event} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[d.event as keyof typeof COLORS] ?? '#888', flexShrink: 0 }} />
            <span style={{ color: 'var(--text2)' }}>{d.event}</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Hourly line ──────────────────────────────────────────────────────────────── */
export function HourlyLineChart({ data }: { data: { hour: number; click: number; cart: number; order: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="hour" tickFormatter={h => `${h}h`} interval={3} tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <Tooltip {...TIP} labelFormatter={h => `Hour ${h}:00`} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
        <Line type="monotone" dataKey="click" stroke={COLORS.click} strokeWidth={2}   dot={false} />
        <Line type="monotone" dataKey="cart"  stroke={COLORS.cart}  strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
        <Line type="monotone" dataKey="order" stroke={COLORS.order} strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ── Session length bar ───────────────────────────────────────────────────────── */
export function SessionLengthChart({ data }: { data: { bucket: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <Tooltip {...TIP} />
        <Bar dataKey="count" fill="#378ADD" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Category horizontal bar ─────────────────────────────────────────────────── */
export function CategoryBarChart({ data }: { data: { category: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 34 + 20, 200)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 11, fill: 'var(--text2)' }} />
        <Tooltip {...TIP} />
        <Bar dataKey="count" fill="#533AB7" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Funnel bars ──────────────────────────────────────────────────────────────── */
export function FunnelViz({ data }: { data: { stage: string; sessions: number; pct: number }[] }) {
  const max = data[0]?.sessions || 1
  return (
    <div style={{ padding: '8px 0' }}>
      {data.map((d, i) => (
        <div key={d.stage} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>{d.stage}</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>
              {d.sessions.toLocaleString()} <span style={{ color: 'var(--text3)' }}>({d.pct}%)</span>
            </span>
          </div>
          <div style={{ height: 22, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${(d.sessions / max) * 100}%`, height: '100%',
              background: [COLORS.click, COLORS.cart, COLORS.order][i] ?? 'var(--blue)',
              borderRadius: 4, transition: 'width .5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Recall@20 grouped bar ───────────────────────────────────────────────────── */
export function RecallChart({ data }: { data: { objective: string; k: number; model: number; baseline: number }[] }) {
  const at20 = data.filter(d => d.k === 20)
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={at20} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="objective" tick={{ fontSize: 12, fill: 'var(--text2)' }} />
        <YAxis domain={[0, 0.7]} tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <Tooltip {...TIP} formatter={(v: number) => v.toFixed(3)} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
        <Bar dataKey="model"    name="Model"    fill="#378ADD" radius={[3, 3, 0, 0]} />
        <Bar dataKey="baseline" name="Baseline" fill="#5F5E5A" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Hybrid lift bar (model vs hybrid) ───────────────────────────────────────── */
export function HybridLiftChart({ data }: { data: { objective: string; model: number; hybrid: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="objective" tick={{ fontSize: 12, fill: 'var(--text2)' }} />
        <YAxis domain={[0, 0.65]} tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <Tooltip {...TIP} formatter={(v: number) => v.toFixed(3)} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
        <Bar dataKey="model"  name="Model only"       fill="#378ADD" radius={[3, 3, 0, 0]} />
        <Bar dataKey="hybrid" name="Hybrid (+ CF)"    fill="#7F77DD" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Score grouped bar for top-10 recs ───────────────────────────────────────── */
export function ScoreGroupedChart({ data }: { data: any[] }) {
  const slim = data.slice(0, 10).map(r => ({
    name:  r.name?.split(' ').slice(0, 2).join(' ') ?? `#${r.product_id}`,
    click: r.score_click,
    cart:  r.score_cart,
    order: r.score_order,
    cf:    r.score_cf ?? 0,
  }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={slim} margin={{ top: 4, right: 8, bottom: 36, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text3)' }} angle={-30} textAnchor="end" interval={0} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <Tooltip {...TIP} formatter={(v: number) => v.toFixed(3)} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
        <Bar dataKey="click" name="Click" fill={COLORS.click} radius={[2, 2, 0, 0]} />
        <Bar dataKey="cart"  name="Cart"  fill={COLORS.cart}  radius={[2, 2, 0, 0]} />
        <Bar dataKey="order" name="Order" fill={COLORS.order} radius={[2, 2, 0, 0]} />
        <Bar dataKey="cf"    name="CF"    fill="#7F77DD"       radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Pareto scatter ───────────────────────────────────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  'Electronics': '#378ADD', 'Clothing': '#1D9E75', 'Home & Garden': '#EF9F27',
  'Books': '#7F77DD', 'Sports': '#D85A30', 'Beauty': '#D4537E',
  'Toys': '#5DCAA5', 'Automotive': '#FAC775', 'Food': '#85B7EB', 'Music': '#AFA9EC',
}

export function ParetoScatter({ data }: { data: any[] }) {
  const byCategory = data.reduce<Record<string, any[]>>((acc, d) => {
    const cat = d.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ x: d.score_cart, y: d.score_order, name: d.name })
    return acc
  }, {})
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" dataKey="x" name="Cart" domain={[0, 1]}
          label={{ value: 'Cart score', position: 'insideBottom', offset: -10, fontSize: 10, fill: 'var(--text3)' }}
          tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <YAxis type="number" dataKey="y" name="Order" domain={[0, 1]}
          label={{ value: 'Order', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: 'var(--text3)' }}
          tick={{ fontSize: 10, fill: 'var(--text3)' }} />
        <ZAxis range={[35, 35]} />
        <Tooltip {...TIP} content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const d = payload[0]?.payload
          return (
            <div style={{ ...TIP.contentStyle, padding: '8px 12px' }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{d?.name}</div>
              <div style={{ color: 'var(--text2)' }}>Cart: {d?.x?.toFixed(3)} · Order: {d?.y?.toFixed(3)}</div>
            </div>
          )
        }} />
        {Object.entries(byCategory).slice(0, 6).map(([cat, pts]) => (
          <Scatter key={cat} name={cat} data={pts} fill={CAT_COLORS[cat] ?? '#888'} fillOpacity={0.8} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/* ── Co-occurrence heatmap ────────────────────────────────────────────────────── */
export function CooccurrenceHeatmap({ labels, matrix }: { labels: string[]; matrix: number[][] }) {
  const n = labels.length
  const cellSize = Math.min(Math.floor(380 / (n + 1)), 52)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: cellSize }} />
            {labels.map(l => (
              <th key={l} style={{ width: cellSize, fontSize: 10, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', padding: '0 2px 6px' }}>
                {l.split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 6, textAlign: 'right' }}>
                {labels[i]?.split(' ')[0]}
              </td>
              {row.map((val, j) => {
                const isDiag = i === j
                const alpha  = isDiag ? 0.08 : val * 0.75
                return (
                  <td key={j} title={`${labels[i]} × ${labels[j]}: ${val}`} style={{
                    width: cellSize, height: cellSize, borderRadius: 4,
                    background: isDiag ? 'var(--bg3)' : `rgba(55,138,221,${alpha.toFixed(2)})`,
                    textAlign: 'center', fontSize: 10,
                    color: val > 0.5 ? '#E6F1FB' : 'var(--text3)',
                  }}>
                    {isDiag ? '—' : val.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}