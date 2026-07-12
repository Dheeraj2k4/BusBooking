/**
 * Bus result card in the mock's style.
 *
 * Header: operator avatar + name + AC/Non-AC badge.
 * Body:   origin code/time  ── duration · non-stop ──  destination code/time.
 * Footer: seats remaining + price + Book button.
 *
 * Presentational: it renders bus data and calls `onBook(bus)`. Optional
 * `matchReasons` (from AI search) render as small chips.
 */
import { cityCode, formatClock, formatDuration, formatMoney } from '../utils/format'

// A stable-ish color per operator so avatars look consistent.
const COLORS = ['#16a34a', '#e11d48', '#f59e0b', '#2563eb', '#7c3aed', '#0891b2']
function colorFor(name) {
  let sum = 0
  for (const ch of name) sum += ch.charCodeAt(0)
  return COLORS[sum % COLORS.length]
}

export default function BusResultCard({ bus, onBook, matchReasons = [] }) {
  const soldOut = bus.available_seats <= 0
  const isAc = bus.bus_type === 'AC'

  return (
    <div className="rc">
      <div className="rc-head">
        <div className="rc-operator">
          <div className="rc-avatar" style={{ background: colorFor(bus.operator_name) }}>
            {bus.operator_name.charAt(0)}
          </div>
          <span className="rc-name">{bus.operator_name}</span>
        </div>
        <span className={`rc-badge ${isAc ? 'ac' : 'nonac'}`}>{bus.bus_type} Bus</span>
      </div>

      <div className="rc-route">
        <div className="rc-end">
          <div className="rc-code">{cityCode(bus.origin)}</div>
          <div className="rc-city">{bus.origin}</div>
          <div className="rc-time">{formatClock(bus.departure_time)}</div>
        </div>

        <div className="rc-mid">
          <div className="rc-dur">{formatDuration(bus.departure_time, bus.arrival_time)}</div>
          <div className="rc-line"><span className="rc-dot" /><span className="rc-dot" /></div>
          <div className="rc-stop">Non-stop</div>
        </div>

        <div className="rc-end rc-end-right">
          <div className="rc-code">{cityCode(bus.destination)}</div>
          <div className="rc-city">{bus.destination}</div>
          <div className="rc-time">{formatClock(bus.arrival_time)}</div>
        </div>
      </div>

      {matchReasons.length > 0 && (
        <div className="rc-reasons">
          {matchReasons.map((r, i) => (
            <span key={i} className="reason-chip">{r}</span>
          ))}
        </div>
      )}

      <div className="rc-foot">
        <span className={`rc-seats ${soldOut ? 'out' : ''}`}>
          🪑 {soldOut ? 'Sold out' : `${bus.available_seats} Remaining`}
        </span>
        <div className="rc-foot-right">
          <span className="rc-price">{formatMoney(bus.price)}</span>
          <button className="btn btn-primary btn-sm" disabled={soldOut} onClick={() => onBook(bus)}>
            {soldOut ? 'Full' : 'Book'}
          </button>
        </div>
      </div>
    </div>
  )
}
