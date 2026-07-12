/**
 * Create / edit form for a bus, shown in a modal.
 *
 * The same component handles both cases: if `bus` is passed we pre-fill and
 * PATCH; otherwise we POST a new bus. Datetime values are converted between
 * the API's ISO strings and the <input type="datetime-local"> format.
 */
import { useState } from 'react'
import Modal from './Modal'
import { busApi } from '../api/client'

// ISO -> "YYYY-MM-DDTHH:mm" for datetime-local inputs.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function BusForm({ bus, onClose, onSaved }) {
  const isEdit = Boolean(bus)

  const [form, setForm] = useState({
    operator_name: bus?.operator_name || '',
    origin: bus?.origin || '',
    destination: bus?.destination || '',
    departure_time: toLocalInput(bus?.departure_time) || '',
    arrival_time: toLocalInput(bus?.arrival_time) || '',
    bus_type: bus?.bus_type || 'AC',
    total_seats: bus?.total_seats || 40,
    price: bus?.price || 500,
    is_active: bus?.is_active ?? true,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        ...form,
        total_seats: Number(form.total_seats),
        price: Number(form.price),
        // Send the picked wall-clock time as-is (naive local), NOT UTC.
        // Using toISOString() here would shift times by the timezone offset
        // and clash with the naive datetimes used everywhere else.
        departure_time: form.departure_time,
        arrival_time: form.arrival_time,
      }
      const res = isEdit ? await busApi.update(bus.id, payload) : await busApi.create(payload)
      onSaved(res.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      // FastAPI validation errors come back as an array; surface the first.
      setError(Array.isArray(detail) ? detail[0]?.msg : detail || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit bus' : 'Add bus'} onClose={onClose}>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Operator</span>
          <input value={form.operator_name} onChange={update('operator_name')} required />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Origin</span>
            <input value={form.origin} onChange={update('origin')} required />
          </label>
          <label className="field">
            <span>Destination</span>
            <input value={form.destination} onChange={update('destination')} required />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Departure</span>
            <input type="datetime-local" value={form.departure_time} onChange={update('departure_time')} required />
          </label>
          <label className="field">
            <span>Arrival</span>
            <input type="datetime-local" value={form.arrival_time} onChange={update('arrival_time')} required />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Type</span>
            <select value={form.bus_type} onChange={update('bus_type')}>
              <option>AC</option>
              <option>Non-AC</option>
              <option>Sleeper</option>
            </select>
          </label>
          <label className="field">
            <span>Total seats</span>
            <input type="number" min="1" max="100" value={form.total_seats} onChange={update('total_seats')} required />
          </label>
          <label className="field">
            <span>Price (₹)</span>
            <input type="number" min="1" value={form.price} onChange={update('price')} required />
          </label>
        </div>

        <label className="checkbox">
          <input type="checkbox" checked={form.is_active} onChange={update('is_active')} />
          <span>Available for booking</span>
        </label>

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add bus'}
        </button>
      </form>
    </Modal>
  )
}
