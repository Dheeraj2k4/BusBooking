/**
 * Login page.
 *
 * On success we redirect based on the returned role (admin -> /admin,
 * customer -> /). Demo credentials are shown to make the review easy.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  // One-click fill for the demo accounts.
  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@busbooking.com')
      setPassword('admin123')
    } else {
      setEmail('customer@busbooking.com')
      setPassword('customer123')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">BusBooking</h1>
        <p className="auth-sub">Sign in to continue</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-hint">
          <span>Demo:</span>
          <button className="link-btn" onClick={() => fillDemo('admin')}>Admin</button>
          <button className="link-btn" onClick={() => fillDemo('customer')}>Customer</button>
        </div>

        <p className="auth-foot">
          New customer? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
