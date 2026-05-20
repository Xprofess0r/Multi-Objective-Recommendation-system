// frontend/src/components/layout/Layout.tsx
// REPLACE the entire file with this version for full mobile/tablet responsiveness.

import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Brain, Star, FlaskConical, Menu, X } from 'lucide-react'

const NAV = [
  { to: '/overview',        icon: LayoutDashboard, label: 'Overview' },
  { to: '/sessions',        icon: Users,           label: 'Sessions' },
  { to: '/model',           icon: Brain,           label: 'Model' },
  { to: '/recommendations', icon: Star,            label: 'Recommendations' },
  { to: '/ab-test',         icon: FlaskConical,    label: 'A/B Test' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Close sidebar on route change (mobile)
  const closeSidebar = () => setSidebarOpen(false)

  // Close sidebar when viewport becomes desktop-sized
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* ── Mobile backdrop overlay ── */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}
        style={{
          width: 'var(--sidebar-w)', flexShrink: 0,
          background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          // Mobile: hidden off-screen until toggled
        }}
      >
        {/* Logo + close button (mobile only) */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>R</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>Recommender</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.2 }}>Multi-Objective v2</div>
            </div>
          </div>
          {/* Close button — visible only on mobile */}
          <button
            onClick={closeSidebar}
            className="sidebar-close-btn"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text2)', padding: 4, display: 'none',
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                transition: 'all .15s',
                background: isActive ? 'var(--blue-dim)' : 'transparent',
                color: isActive ? 'var(--blue-light)' : 'var(--text2)',
              })}
            >
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

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          height: 'var(--header-h)', flexShrink: 0,
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 16px',
          justifyContent: 'space-between', gap: 12,
        }}>
          {/* Hamburger — visible only on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text2)', padding: 4, display: 'none', flexShrink: 0,
            }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Multi-Objective Recommender System
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 99,
              background: 'var(--teal-dim)', color: 'var(--teal-light)',
              fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
            }}>Live</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>v2.0.0</span>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }} className="main-content">
          <Outlet />
        </main>
      </div>

      {/* ── Responsive styles (injected as a style tag) ── */}
      <style>{`
        /* Mobile: hide sidebar off-screen, show hamburger & overlay */
        @media (max-width: 767px) {
          .sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            width: min(var(--sidebar-w), 80vw) !important;
            box-shadow: 4px 0 24px rgba(0,0,0,0.4);
          }
          .sidebar--open {
            transform: translateX(0);
          }
          .sidebar--open ~ * .hamburger-btn,
          .hamburger-btn {
            display: flex !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .sidebar-close-btn {
            display: flex !important;
          }
          .main-content {
            padding: 16px !important;
          }
        }

        /* Tablet: narrow sidebar, no overlay needed */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root { --sidebar-w: 180px; }
          .main-content {
            padding: 16px !important;
          }
        }

        /* Desktop: full sidebar width */
        @media (min-width: 1024px) {
          :root { --sidebar-w: 220px; }
        }

        /* Prevent horizontal scroll on narrow screens */
        .main-content > * {
          min-width: 0;
        }
      `}</style>
    </div>
  )
}
