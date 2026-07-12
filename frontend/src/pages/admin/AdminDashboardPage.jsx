/**
 * Admin analytics dashboard.
 *
 * Reads GET /admin/dashboard and renders:
 *   - KPI cards: today's bookings, today's revenue, total revenue, active buses,
 *   - occupancy bars per bus (highest first),
 *   - route-wise demand table.
 *
 * All numbers are computed on the backend; this page is purely presentational.
 */
import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .dashboard()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard'))
  }, [])

  if (error) return <div className="alert alert-error">{error}</div>
  if (!stats) return <p className="muted">Loading dashboard…</p>

  return (
    <div className="page">
      <header className="page-head">
        <h1>Admin dashboard</h1>
        <p className="muted">Live overview of bookings, revenue and demand.</p>
      </header>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KpiCard label="Bookings today" value={stats.total_bookings_today} />
        <KpiCard label="Revenue today" value={`₹${stats.revenue_today.toFixed(0)}`} />
        <KpiCard label="Total revenue" value={`₹${stats.revenue_total.toFixed(0)}`} />
        <KpiCard label="Active buses" value={stats.active_buses} />
      </div>

      <div className="two-col">
        {/* Occupancy */}
        <section className="panel">
          <h2>Buses by occupancy</h2>
          {stats.buses_by_occupancy.length === 0 && <p className="muted">No buses yet.</p>}
          {stats.buses_by_occupancy.map((b) => (
            <div key={b.bus_id} className="occ-row">
              <div className="occ-label">
                <span>{b.label}</span>
                <span className="muted small">{b.total_seats - b.available_seats}/{b.total_seats} sold</span>
              </div>
              <div className="occ-bar">
                <div className="occ-fill" style={{ width: `${b.occupancy_rate}%` }} />
              </div>
              <span className="occ-pct">{b.occupancy_rate}%</span>
            </div>
          ))}
        </section>

        {/* Route demand */}
        <section className="panel">
          <h2>Route-wise demand</h2>
          {stats.route_demand.length === 0 ? (
            <p className="muted">No confirmed bookings yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Route</th><th>Bookings</th><th>Seats sold</th></tr>
              </thead>
              <tbody>
                {stats.route_demand.map((r) => (
                  <tr key={r.route}>
                    <td>{r.route}</td>
                    <td>{r.bookings}</td>
                    <td>{r.seats_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
