/**
 * Admin bus management.
 *
 * Full CRUD over buses in a table: add, edit, toggle availability, delete.
 * The create/edit form lives in the BusForm modal; this page owns the list
 * and wires the actions to the API.
 */
import { useEffect, useState } from 'react'
import { busApi } from '../../api/client'
import BusForm from '../../components/BusForm'
import ConfirmDialog from '../../components/ConfirmDialog'

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminBusesPage() {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)   // bus object being edited
  const [showForm, setShowForm] = useState(false)
  const [confirmBus, setConfirmBus] = useState(null) // bus pending deletion

  const load = async () => {
    setLoading(true)
    try {
      const res = await busApi.list()
      setBuses(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load buses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (bus) => {
    setEditing(bus)
    setShowForm(true)
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    load() // refetch to reflect create/edit consistently
  }

  // Delete happens after the user confirms in the ConfirmDialog.
  const doRemove = async () => {
    const id = confirmBus.id
    setConfirmBus(null)
    setError('')
    try {
      await busApi.remove(id)
      setBuses((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed')
    }
  }

  if (loading) return <p className="muted">Loading buses…</p>

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Manage buses</h1>
          <p className="muted">Add routes, schedules and pricing.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add bus</button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Route</th><th>Operator</th><th>Type</th><th>Departs</th>
              <th>Seats</th><th>Price</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b.id}>
                <td>{b.origin} → {b.destination}</td>
                <td>{b.operator_name}</td>
                <td>{b.bus_type}</td>
                <td>{formatTime(b.departure_time)}</td>
                <td>{b.available_seats}/{b.total_seats}</td>
                <td>₹{b.price.toFixed(0)}</td>
                <td>
                  <span className={`status ${b.is_active ? 'status-confirmed' : 'status-cancelled'}`}>
                    {b.is_active ? 'Active' : 'Off-sale'}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmBus(b)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <BusForm bus={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      {confirmBus && (
        <ConfirmDialog
          title="Delete bus"
          message={`Delete ${confirmBus.operator_name} (${confirmBus.origin} → ${confirmBus.destination})? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={doRemove}
          onCancel={() => setConfirmBus(null)}
        />
      )}
    </div>
  )
}
