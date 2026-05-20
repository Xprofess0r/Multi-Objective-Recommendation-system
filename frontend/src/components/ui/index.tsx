import { ReactNode } from 'react'

/* ── KPI Card ───────────────────────────────────────────────────────────────── */
export function KpiCard({ label, value, sub, trend, accent = 'var(--blue)' }: {
  label: string; value: string | number; sub?: string
  trend?: 'up' | 'down' | 'neutral'; accent?: string
}) {
  const trendColor = trend === 'up' ? 'var(--teal)' : trend === 'down' ? 'var(--coral)' : 'var(--text3)'
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', borderTop: `2px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: trendColor, marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────────────────────────── */
type BadgeVariant = 'blue' | 'teal' | 'amber' | 'purple' | 'coral' | 'gray'
const BADGE: Record<BadgeVariant, { bg: string; color: string }> = {
  blue:   { bg: 'var(--blue-dim)',          color: 'var(--blue-light)'   },
  teal:   { bg: 'var(--teal-dim)',          color: 'var(--teal-light)'   },
  amber:  { bg: 'var(--amber-dim)',         color: 'var(--amber-light)'  },
  purple: { bg: 'var(--purple-dim)',        color: 'var(--purple-light)' },
  coral:  { bg: 'rgba(216,90,48,.12)',      color: '#F0997B'             },
  gray:   { bg: 'rgba(255,255,255,.06)',    color: 'var(--text2)'        },
}
export function Badge({ children, variant = 'blue' }: { children: ReactNode; variant?: BadgeVariant }) {
  const s = BADGE[variant]
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color }}>{children}</span>
}

const SIGNAL_MAP: Record<string, BadgeVariant> = {
  'in-session':    'teal',
  'popular':       'blue',
  'collaborative': 'purple',
  'content-based': 'amber',
  'trending':      'coral',
}
export function SignalBadge({ signal }: { signal: string }) {
  return <Badge variant={SIGNAL_MAP[signal] ?? 'gray'}>{signal}</Badge>
}

/* ── Spinner ─────────────────────────────────────────────────────────────────── */
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border2)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
export function ErrorMsg({ msg }: { msg: string }) {
  return <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.25)', color: '#F09595', fontSize: 13 }}>{msg}</div>
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', ...style }}>{children}</div>
}
export function CardTitle({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{children}</div>
}

/* ── HBar ────────────────────────────────────────────────────────────────────── */
export function HBar({ label, value, max = 100, color = 'var(--blue)' }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 148, fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 5, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .4s ease' }} />
      </div>
      <div style={{ width: 32, fontSize: 11, fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>{value}</div>
    </div>
  )
}

/* ── ScoreBar ────────────────────────────────────────────────────────────────── */
export function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: Math.round(value * 52), height: 4, background: color, borderRadius: 99, minWidth: 2 }} />
      <span style={{ fontSize: 11, color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(2)}</span>
    </div>
  )
}

/* ── Objective chips ─────────────────────────────────────────────────────────── */
type ObjFilter = 'all' | 'click' | 'cart' | 'order'
export function ObjectiveChips({ value, onChange }: { value: ObjFilter; onChange: (v: ObjFilter) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {(['all', 'click', 'cart', 'order'] as ObjFilter[]).map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s',
          border: '1px solid', borderColor: value === o ? 'var(--blue)' : 'var(--border2)',
          background: value === o ? 'var(--blue-dim)' : 'transparent',
          color:      value === o ? 'var(--blue-light)' : 'var(--text2)',
        }}>
          {o === 'all' ? 'All objectives' : `Max ${o}s`}
        </button>
      ))}
    </div>
  )
}

/* ── WeightSlider ────────────────────────────────────────────────────────────── */
export function WeightSlider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 44px', gap: 10, alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <input type="range" min={0} max={100} step={1} value={value} onChange={e => onChange(+e.target.value)} style={{ accentColor: color }} aria-label={label} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

/* ── SectionHeader ───────────────────────────────────────────────────────────── */
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}