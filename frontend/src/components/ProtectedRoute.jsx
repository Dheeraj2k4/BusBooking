/**
 * Route guard.
 *
 * Wrap any page that requires authentication. Optionally restrict to a
 * single role. Behaviour:
 *   - still loading auth -> show nothing (avoids a flash of the login page),
 *   - not logged in      -> redirect to /login,
 *   - wrong role         -> redirect to that user's home area.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    // Send users to the section that matches their role.
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }

  return children
}
