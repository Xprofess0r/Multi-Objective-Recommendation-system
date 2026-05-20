import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Brain, Star, FlaskConical } from 'lucide-react'

const NAV = [
  { to: '/overview',        icon: LayoutDashboard, label: 'Overview' },
  { to: '/sessions',        icon: Users,           label: 'Sessions' },
  { to: '/model',           icon: Brain,           label: 'Model' },
  { to: '/recommendations', icon: Star,            label: 'Recommendations' },
  { to: '/ab-test',         icon: FlaskConical,    label: 'A/B Test' },
]

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
            }}>R</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>Recommender</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.2 }}>Multi-Objective v2</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all .15s',
              background: isActive ? 'var(--blue-dim)' : 'transparent',
              color: isActive ? 'var(--blue-light)' : 'var(--text2)',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Bengal E-Commerce Dataset</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>CF + LightGBM Hybrid</div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 'var(--header-h)', flexShrink: 0,
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            Multi-Objective Recommender System
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              padding: '3px 10px', borderRadius: 99,
              background: 'var(--teal-dim)', color: 'var(--teal-light)',
              fontSize: 11, fontWeight: 500,
            }}>Live</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>v2.0.0</span>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}