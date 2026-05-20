import { useQuery } from '@tanstack/react-query'
import {
  fetchKPIs, fetchEventDist, fetchHourlyVolume,
  fetchCategoryBreakdown, fetchFunnel,
} from '@/services/api'
import { KpiCard, Card, CardTitle, Spinner, ErrorMsg } from '@/components/ui'
import {
  EventPieChart, HourlyLineChart, CategoryBarChart, FunnelViz,
} from '@/components/charts'

export default function Overview() {
  const kpis     = useQuery({ queryKey: ['kpis'],      queryFn: fetchKPIs })
  const evtDist  = useQuery({ queryKey: ['evtDist'],   queryFn: fetchEventDist })
  const hourly   = useQuery({ queryKey: ['hourly'],    queryFn: fetchHourlyVolume })
  const catBreak = useQuery({ queryKey: ['catBreak'],  queryFn: fetchCategoryBreakdown })
  const funnel   = useQuery({ queryKey: ['funnel'],    queryFn: fetchFunnel })

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          Data overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          Dataset exploration · event distribution · session funnel
        </p>
      </div>

      {/* KPI strip */}
      {kpis.isLoading ? <Spinner /> : kpis.error ? <ErrorMsg msg="Failed to load KPIs" /> : (() => {
        // Compute dynamic trend settings for the Cart -> Order card
        const lift = kpis.data.order_conversion_lift ?? 0;
        const isPositive = lift >= 0;
        const dynamicSubtext = `${isPositive ? '↑ ' : '− '}${Math.abs(lift)} pp vs last week`;
        const dynamicTrend = isPositive ? "up" : "down";

        return (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24,
          }}>
            <KpiCard
              label="Total sessions"
              value={kpis.data.total_sessions.toLocaleString()}
              sub="↑ 8.3% this week"
              trend="up"
              accent="var(--blue)"
            />
            <KpiCard
              label="Unique products"
              value={kpis.data.total_products.toLocaleString()}
              sub="across 10 categories"
              trend="neutral"
              accent="var(--purple)"
            />
            <KpiCard
              label="Click-through rate"
              value={`${kpis.data.click_rate}%`}
              sub="↑ 2.1 pp vs last week"
              trend="up"
              accent="var(--teal)"
            />
            <KpiCard
              label="Cart → order conv."
              value={`${kpis.data.cart_to_order_rate ?? 0}%`} 
              sub={dynamicSubtext}                            
              trend={dynamicTrend}                            
              accent="var(--amber)"
            />
          </div>
        );
      })()}

      {/* Row 1: event dist + hourly volume */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardTitle>Event distribution</CardTitle>
          {evtDist.isLoading ? <Spinner /> :
           evtDist.error   ? <ErrorMsg msg="Failed" /> :
           <EventPieChart data={evtDist.data} />}
        </Card>

        <Card>
          <CardTitle>Hourly event volume</CardTitle>
          {hourly.isLoading ? <Spinner /> :
           hourly.error   ? <ErrorMsg msg="Failed" /> :
           <HourlyLineChart data={hourly.data} />}
        </Card>
      </div>

      {/* Row 2: category breakdown + funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle>Interactions by category</CardTitle>
          {catBreak.isLoading ? <Spinner /> :
           catBreak.error   ? <ErrorMsg msg="Failed" /> :
           <CategoryBarChart data={catBreak.data} />}
        </Card>

        <Card>
          <CardTitle>Conversion funnel</CardTitle>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            click → cart → order
          </p>
          {funnel.isLoading ? <Spinner /> :
           funnel.error   ? <ErrorMsg msg="Failed" /> :
           <FunnelViz data={funnel.data} />}
        </Card>
      </div>
    </div>
  )
}
