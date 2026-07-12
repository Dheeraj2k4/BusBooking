/**
 * Structured trip search bar — styled to match the design mock.
 *
 * Rounded fields (boarding, drop-off, departure date, passenger) each with a
 * small icon, a circular swap button between the two locations, and the
 * "Search Bus" button. Calls `onSearch({ origin, destination, date })`.
 */
import { useState } from 'react'

// Small inline icons keep the look crisp without an icon dependency.
const BusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11" /><path d="M4 11h16" />
    <path d="M4 17h16v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1M4 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1" />
    <circle cx="8" cy="14" r="1" /><circle cx="16" cy="14" r="1" />
  </svg>
)
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" />
  </svg>
)
const SwapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4 4 7l3 3" /><path d="M4 7h13" /><path d="m17 20 3-3-3-3" /><path d="M20 17H7" />
  </svg>
)

export default function TripSearchBar({ initial, onSearch }) {
  const [origin, setOrigin] = useState(initial?.origin || '')
  const [destination, setDestination] = useState(initial?.destination || '')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(1)

  const swap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const submit = (e) => {
    e.preventDefault()
    onSearch({ origin: origin.trim(), destination: destination.trim(), date })
  }

  return (
    <form className="trip-card" onSubmit={submit}>
      <div className="trip-fields">
        <div className="trip-field">
          <span className="tf-label">Boarding point</span>
          <div className="tf-input">
            <BusIcon />
            <input placeholder="e.g. Mumbai" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </div>
        </div>

        <button type="button" className="swap-btn" onClick={swap} title="Swap" aria-label="Swap">
          <SwapIcon />
        </button>

        <div className="trip-field">
          <span className="tf-label">Drop-off point</span>
          <div className="tf-input">
            <BusIcon />
            <input placeholder="e.g. Pune" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
        </div>

        <div className="trip-field">
          <span className="tf-label">Departure date</span>
          <div className="tf-input">
            <CalendarIcon />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="trip-field">
          <span className="tf-label">Passenger</span>
          <div className="tf-input">
            <PersonIcon />
            <input type="number" min="1" max="10" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary search-btn">Search Bus</button>
      </div>
    </form>
  )
}
