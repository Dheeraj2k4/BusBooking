/**
 * Small display helpers shared across components.
 *
 * Keeping formatting in one place means every card/table shows dates, money
 * and route codes the same way. Change the currency once here to switch it
 * everywhere.
 */

export const CURRENCY = '₹'

export function formatMoney(amount) {
  return `${CURRENCY}${Number(amount).toFixed(0)}`
}

// "Mumbai" -> "MUM". Used for the big route codes on bus cards (like the mock).
export function cityCode(city) {
  return (city || '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
}

// Just the time part, e.g. "08:00".
export function formatClock(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Full-ish date, e.g. "Sun, 03 Sep".
export function formatDay(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
}

// Human duration between two ISO datetimes, e.g. "6h 30m".
export function formatDuration(departISO, arriveISO) {
  const mins = Math.max(0, Math.round((new Date(arriveISO) - new Date(departISO)) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}
