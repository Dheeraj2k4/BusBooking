/**
 * Booking form shown inside a modal.
 *
 * Collects passenger details + seat count for the selected bus and submits
 * the booking. Seat count is capped at the seats actually available so the
 * UI never even attempts an overbooking (the backend enforces it too).
 */
import { useState } from 'react'
import Modal from './Modal'
import { bookingApi } from '../api/client'

export default function BookingForm({ bus, onClose, onBooked }) {
  const [form, setForm] = useState({
    passenger_name: '',
    passenger_age: '',
    passenger_gender: 'Male',
    seats_booked: 1,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        bus_id: bus.id,
        passenger_name: form.passenger_name,
        passenger_age: Number(form.passenger_age),
        passenger_gender: form.passenger_gender,
        seats_booked: Number(form.seats_booked),
      }
      const res = await bookingApi.create(payload)
      onBooked(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed')
    } finally {
      setBusy(false)
    }
  }

  const maxSeats = Math.min(bus.available_seats, 10)
  const total = (bus.price * Number(form.seats_booked || 0)).toFixed(0)

  return (
    <Modal title={`Book: ${bus.origin} → ${bus.destination}`} onClose={onClose}>
      <div className="booking-summary">
        <span>{bus.operator_name} · {bus.bus_type}</span>
        <span>₹{bus.price.toFixed(0)} / seat</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Passenger name</span>
          <input value={form.passenger_name} onChange={update('passenger_name')} required />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Age</span>
            <input type="number" min="1" max="119" value={form.passenger_age} onChange={update('passenger_age')} required />
          </label>
          <label className="field">
            <span>Gender</span>
            <select value={form.passenger_gender} onChange={update('passenger_gender')}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label className="field">
            <span>Seats</span>
            <select value={form.seats_booked} onChange={update('seats_booked')}>
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="booking-total">
          <span>Total</span>
          <strong>₹{total}</strong>
        </div>

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Confirming…' : 'Confirm booking'}
        </button>
      </form>
    </Modal>
  )
}
