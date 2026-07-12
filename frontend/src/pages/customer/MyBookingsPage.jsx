/**
 * Customer booking history.
 *
 * Lists the logged-in customer's bookings (newest first) and lets them
 * cancel a confirmed booking, which releases the seats on the backend.
 */
import { useEffect, useState } from 'react'
import { bookingApi } from '../../api/client'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await bookingApi.mine()
      setBookings(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const cancel = async (id) => {
    try {
      const res = await bookingApi.cancel(id)
      // Replace the cancelled booking in place with the updated record.
      setBookings((prev) => prev.map((b) => (b.id === id ? res.data : b)))
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancel failed')
    }
  }

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div className="page">
      <header className="page-head">
        <h1>My bookings</h1>
        <p className="muted">Your past and upcoming trips.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length === 0 ? (
        <p className="muted">No bookings yet. Head to Search to book your first trip.</p>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-row">
              <div>
                <div className="bus-route">
                  {b.bus.origin} <span className="arrow">→</span> {b.bus.destination}
                </div>
                <div className="muted small">
                  {b.bus.operator_name} · {b.bus.bus_type} · Departs {formatDate(b.bus.departure_time)}
                </div>
                <div className="muted small">
                  Passenger: {b.passenger_name} ({b.passenger_age}/{b.passenger_gender}) · {b.seats_booked} seat(s)
                </div>
              </div>

              <div className="booking-row-side">
                <div className="bus-price">₹{b.total_price.toFixed(0)}</div>
                <span className={`status status-${b.status.toLowerCase()}`}>{b.status}</span>
                {b.status === 'Confirmed' && (
                  <button className="btn btn-danger" onClick={() => cancel(b.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
