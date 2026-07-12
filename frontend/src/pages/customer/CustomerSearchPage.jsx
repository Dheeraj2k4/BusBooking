/**
 * Customer home — bus search, styled after the provided mock.
 *
 * Two ways to search (both required by the assignment brief):
 *   1. TripSearchBar   — structured boarding/drop-off/date -> GET /buses
 *   2. AiSearchBar     — natural language -> POST /search (Groq + fallback)
 *
 * Results (normalised to { bus, match_reasons }) are shown as cards. The left
 * FilterSidebar refines the *displayed* set client-side (type/price/operator).
 * Booking opens the BookingForm modal; on success we drop the seat locally.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { busApi, searchApi } from '../../api/client'
import TripSearchBar from '../../components/TripSearchBar'
import AiSearchBar from '../../components/AiSearchBar'
import FilterSidebar from '../../components/FilterSidebar'
import BusResultCard from '../../components/BusResultCard'
import BookingForm from '../../components/BookingForm'

const DEFAULT_FILTERS = { busType: 'All', minPrice: 0, maxPrice: 2000, operator: 'All' }

export default function CustomerSearchPage() {
  // `results` is the raw set from the last search; `filters` narrows the view.
  const [results, setResults] = useState([])          // [{ bus, match_reasons }]
  const [interpreted, setInterpreted] = useState(null) // AI panel (search only)
  const [route, setRoute] = useState({ origin: 'Mumbai', destination: 'Pune' })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [applied, setApplied] = useState(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBus, setSelectedBus] = useState(null)
  const [toast, setToast] = useState('')

  // Normalise a plain bus list into the { bus, match_reasons } shape.
  const wrap = (buses) => buses.map((bus) => ({ bus, match_reasons: [] }))

  // Initial load: show all bookable buses.
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    setInterpreted(null)
    try {
      const res = await busApi.list({ only_available: true })
      setResults(wrap(res.data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load buses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Structured search (boarding/drop-off/date).
  const handleTripSearch = async ({ origin, destination }) => {
    setLoading(true)
    setError('')
    setInterpreted(null)
    setRoute({ origin: origin || 'Anywhere', destination: destination || 'Anywhere' })
    try {
      const res = await busApi.list({ origin, destination, only_available: true })
      setResults(wrap(res.data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  // AI natural-language search.
  const handleAiSearch = async (query) => {
    setLoading(true)
    setError('')
    try {
      const res = await searchApi.natural(query)
      setInterpreted(res.data.interpreted)
      setResults(res.data.results.map((r) => ({ bus: r.bus, match_reasons: r.match_reasons })))
      const { origin, destination } = res.data.interpreted
      setRoute({ origin: origin || 'Anywhere', destination: destination || 'Anywhere' })
    } catch (err) {
      setError(err.response?.data?.detail || 'AI search failed')
    } finally {
      setLoading(false)
    }
  }

  // Operators present in the current result set (for the sidebar).
  const operators = useMemo(
    () => [...new Set(results.map((r) => r.bus.operator_name))].sort(),
    [results]
  )

  // Apply the *applied* filters to the raw results for display.
  const visible = useMemo(() => {
    return results.filter(({ bus }) => {
      if (applied.busType !== 'All' && bus.bus_type !== applied.busType) return false
      if (bus.price < applied.minPrice || bus.price > applied.maxPrice) return false
      if (applied.operator !== 'All' && bus.operator_name !== applied.operator) return false
      return true
    })
  }, [results, applied])

  const handleBooked = (booking) => {
    setSelectedBus(null)
    setToast(`Booked! Ref #${booking.id} · ${booking.seats_booked} seat(s)`)
    setResults((prev) =>
      prev.map((r) =>
        r.bus.id === booking.bus_id
          ? { ...r, bus: { ...r.bus, available_seats: r.bus.available_seats - booking.seats_booked } }
          : r
      )
    )
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="booking-page">
      <TripSearchBar initial={route} onSearch={handleTripSearch} />
      <AiSearchBar loading={loading} onSearch={handleAiSearch} />

      {toast && <div className="alert alert-success">{toast}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* AI interpretation panel (only after an AI search) */}
      {interpreted && (
        <div className="ai-panel">
          <div className="ai-panel-head">
            <span className="ai-badge">AI understood</span>
          </div>
          <div className="ai-filters">
            <Filter label="From" value={interpreted.origin} />
            <Filter label="To" value={interpreted.destination} />
            <Filter label="Date" value={interpreted.travel_date} />
            <Filter label="Time" value={interpreted.time_of_day} />
            <Filter label="Type" value={interpreted.bus_type} />
            <Filter label="Max" value={interpreted.max_price} />
          </div>
        </div>
      )}

      <div className="results-head">
        <h2>Bus from {route.origin} to {route.destination}</h2>
        <span className="results-count">{visible.length} result found</span>
      </div>

      <div className="booking-layout">
        <FilterSidebar
          filters={filters}
          operators={operators}
          onChange={setFilters}
          onApply={() => setApplied(filters)}
          onReset={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS) }}
        />

        <div className="bus-grid">
          {loading && <p className="muted">Loading buses…</p>}
          {!loading && visible.length === 0 && (
            <p className="muted">No buses match. Try another route, date, or relax the filters.</p>
          )}
          {!loading &&
            visible.map(({ bus, match_reasons }) => (
              <BusResultCard key={bus.id} bus={bus} matchReasons={match_reasons} onBook={setSelectedBus} />
            ))}
        </div>
      </div>

      {selectedBus && (
        <BookingForm bus={selectedBus} onClose={() => setSelectedBus(null)} onBooked={handleBooked} />
      )}
    </div>
  )
}

function Filter({ label, value }) {
  return (
    <div className="ai-filter">
      <span className="ai-filter-label">{label}</span>
      <span className="ai-filter-value">{value ?? '—'}</span>
    </div>
  )
}
