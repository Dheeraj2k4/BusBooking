/**
 * Top navigation bar.
 *
 * Full-width light bar with the one-word "BusBooking" brand on the left, the
 * app's role-based links in the centre, and the user avatar + logout on the
 * right.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClass = (path) => (pathname === path ? 'nav-tab active' : 'nav-tab')

  // First letter of the user's name for the avatar circle.
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <nav className="navbar">
      <div className="nav-brand">BusBooking</div>

      <div className="nav-tabs">
        {isAdmin ? (
          <>
            <Link className={linkClass('/admin')} to="/admin">Dashboard</Link>
            <Link className={linkClass('/admin/buses')} to="/admin/buses">Manage Buses</Link>
          </>
        ) : (
          <>
            <Link className={linkClass('/')} to="/">Search Bus</Link>
            <Link className={linkClass('/bookings')} to="/bookings">My Bookings</Link>
          </>
        )}
      </div>

      <div className="nav-right">
        <div className="avatar" title={`${user?.name} (${user?.role})`}>{initial}</div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
