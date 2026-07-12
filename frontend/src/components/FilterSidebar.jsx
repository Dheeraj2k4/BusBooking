/**
 * Left filter sidebar (matches the mock).
 *
 * Controlled component: the parent owns the `filters` state and the list of
 * available `operators` (derived from the current results). This component
 * only renders inputs and reports changes. "Apply" / "Reset" are handled by
 * the parent so filtering logic stays in one place.
 *
 * Price is a dual-handle range (min + max) built from two overlaid range
 * inputs, with value bubbles under each handle - like the design mock.
 */
import { CURRENCY } from '../utils/format'

const PRICE_MIN = 0
const PRICE_MAX = 2000
const PRICE_STEP = 50

// Position (0-100%) of a value along the track.
const pct = (v) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

export default function FilterSidebar({ filters, operators, onChange, onApply, onReset }) {
  const set = (patch) => onChange({ ...filters, ...patch })

  // Keep the two handles from crossing each other.
  const setMin = (v) => set({ minPrice: Math.min(v, filters.maxPrice - PRICE_STEP) })
  const setMax = (v) => set({ maxPrice: Math.max(v, filters.minPrice + PRICE_STEP) })

  return (
    <aside className="filters">
      <div className="filters-head">
        <h3>Filters</h3>
        <button className="reset-link" onClick={onReset}>Reset</button>
      </div>

      {/* Bus type */}
      <div className="filter-group">
        <h4>Bus Type</h4>
        {['All', 'AC', 'Non-AC', 'Sleeper'].map((type) => (
          <label key={type} className="radio">
            <input
              type="radio"
              name="busType"
              checked={filters.busType === type}
              onChange={() => set({ busType: type })}
            />
            <span>{type}</span>
          </label>
        ))}
      </div>

      {/* Price range (dual handle) */}
      <div className="filter-group">
        <h4>Price Range</h4>
        <div className="price-range">
          <div className="range-track">
            <div
              className="range-fill"
              style={{ left: `${pct(filters.minPrice)}%`, right: `${100 - pct(filters.maxPrice)}%` }}
            />
            <input
              type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
              value={filters.minPrice}
              onChange={(e) => setMin(Number(e.target.value))}
              className="range-input"
            />
            <input
              type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP}
              value={filters.maxPrice}
              onChange={(e) => setMax(Number(e.target.value))}
              className="range-input"
            />
            <span className="range-bubble" style={{ left: `${pct(filters.minPrice)}%` }}>
              {CURRENCY}{filters.minPrice}
            </span>
            <span className="range-bubble" style={{ left: `${pct(filters.maxPrice)}%` }}>
              {CURRENCY}{filters.maxPrice}
            </span>
          </div>
          <div className="range-scale">
            <span>{CURRENCY}{PRICE_MIN}</span>
            <span>{CURRENCY}{PRICE_MAX}</span>
          </div>
        </div>
      </div>

      {/* Operators */}
      <div className="filter-group">
        <h4>Bus Operators</h4>
        <label className="radio">
          <input
            type="radio"
            name="operator"
            checked={filters.operator === 'All'}
            onChange={() => set({ operator: 'All' })}
          />
          <span>All company</span>
        </label>
        {operators.map((op) => (
          <label key={op} className="radio">
            <input
              type="radio"
              name="operator"
              checked={filters.operator === op}
              onChange={() => set({ operator: op })}
            />
            <span>{op}</span>
          </label>
        ))}
      </div>

      <button className="btn btn-primary btn-block" onClick={onApply}>Apply Filters</button>
    </aside>
  )
}
