import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchSessions, fetchSessionDetail,
  fetchSessionLengthDist, fetchCooccurrence,
} from '@/services/api'
import {
  Card, CardTitle, Spinner, ErrorMsg, Badge, SectionHeader,
} from '@/components/ui'
import { SessionLengthChart, CooccurrenceHeatmap } from '@/components/charts'

const ET_COLORS: Record<string, string> = {
  click: 'var(--blue)',
  cart:  'var(--teal)',
  order: 'var(--amber)',
}
const ET_BADGE: Record<string, 'blue'|'teal'|'amber'> = {
  click: 'blue', cart: 'teal', order: 'amber',
}

function SessionTimeline({ events }: { events: any[] }) {
  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {events.map((e, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '8px 0', borderBottom: '1px solid var(--border)',
        }}>
          {/* Icon */}
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: ET_COLORS[e.event_type] ?? 'var(--bg3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 1,
          }}>
            {e.event_type[0].toUpperCase()}
          </div>
          {/* Body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.product_name ?? `Product #${e.product_id}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              {e.category} · {e.event_type}
              {e.price_usd ? ` · $${Number(e.price_usd).toFixed(0)}` : ''}
            </div>
          </div>
          <Badge variant={ET_BADGE[e.event_type] ?? 'gray'}>{e.event_type}</Badge>
        </div>
      ))}
    </div>
  )
}

function SessionRow({ s, isActive, onClick }: { s: any; isActive: boolean; onClick: () => void }) {
  return (
    <tr onClick={onClick} style={{
      cursor: 'pointer', transition: 'background .1s',
      background: isActive ? 'rgba(55,138,221,.08)' : 'transparent',
    }}>
      <td style={{ padding: '9px 12px', fontSize: 12, color: isActive ? 'var(--blue-light)' : 'var(--text)', fontWeight: isActive ? 600 : 400 }}>
        #{s.session_id}
      </td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)' }}>{s.user_id}</td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text)' }}>{s.n_events}</td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--blue-light)' }}>{s.n_clicks}</td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--teal-light)' }}>{s.n_carts}</td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--amber-light)' }}>{s.n_orders}</td>
      <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--text3)' }}>
        {Math.round(s.duration_sec)}s
      </td>
    </tr>
  )
}

export default function SessionsPage() {
  const [selectedId, setSelectedId] = useState<number>(0)

  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => fetchSessions(50, 0) })
  const detail   = useQuery({ queryKey: ['session', selectedId], queryFn: () => fetchSessionDetail(selectedId) })
  const lenDist  = useQuery({ queryKey: ['lenDist'],  queryFn: fetchSessionLengthDist })
  const coocc    = useQuery({ queryKey: ['coocc'],    queryFn: () => fetchCooccurrence(6) })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Sessions</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Browse sessions · inspect event timelines · explore co-occurrence patterns
        </p>
      </div>

      {/* Top row: table + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Session table */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <CardTitle>Session list</CardTitle>
          </div>
          {sessions.isLoading ? <div style={{ padding: 20 }}><Spinner /></div> :
           sessions.error ? <div style={{ padding: 20 }}><ErrorMsg msg="Failed to load sessions" /></div> : (
            <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1 }}>
                  <tr>
                    {['Session', 'User', 'Events', 'Clicks', 'Carts', 'Orders', 'Duration'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left', fontSize: 11,
                        color: 'var(--text3)', fontWeight: 500, borderBottom: '1px solid var(--border)',
                        textTransform: 'uppercase', letterSpacing: '.04em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.data.items.map((s: any) => (
                    <SessionRow
                      key={s.session_id} s={s}
                      isActive={s.session_id === selectedId}
                      onClick={() => setSelectedId(s.session_id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Session detail / timeline */}
        <Card>
          <CardTitle>Session #{selectedId} — event timeline</CardTitle>
          {detail.isLoading ? <Spinner /> :
           detail.error   ? <ErrorMsg msg="Failed to load session detail" /> : (
            <>
              {/* Mini stats */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {[
                  { label: 'Events', val: detail.data.events.length, color: 'var(--text)' },
                  { label: 'Clicks', val: detail.data.n_clicks, color: 'var(--blue-light)' },
                  { label: 'Carts',  val: detail.data.n_carts,  color: 'var(--teal-light)' },
                  { label: 'Orders', val: detail.data.n_orders, color: 'var(--amber-light)' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, background: 'var(--bg3)', borderRadius: 8,
                    padding: '8px 10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <SessionTimeline events={detail.data.events} />
            </>
          )}
        </Card>
      </div>

      {/* Bottom row: length dist + cooccurrence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
        <Card>
          <CardTitle>Session length distribution</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Events per session</p>
          {lenDist.isLoading ? <Spinner /> :
           lenDist.error   ? <ErrorMsg msg="Failed" /> :
           <SessionLengthChart data={lenDist.data} />}
        </Card>

        <Card>
          <CardTitle>Product co-occurrence heatmap</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
            How often top-6 products appear in the same session (normalised)
          </p>
          {coocc.isLoading ? <Spinner /> :
           coocc.error   ? <ErrorMsg msg="Failed" /> :
           <CooccurrenceHeatmap labels={coocc.data.labels} matrix={coocc.data.matrix} />}
        </Card>
      </div>
    </div>
  )
}
