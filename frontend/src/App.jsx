/**
 * Application routes.
 *
 * Public:    /login, /register
 * Customer:  /          (AI search + booking)
 *            /bookings  (booking history)
 * Admin:     /admin        (analytics dashboard)
 *            /admin/buses   (bus management)
 *
 * Role-specific pages are wrapped in <ProtectedRoute role="..."> so the
 * routing layer enforces access, not the individual pages.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CustomerSearchPage from './pages/customer/CustomerSearchPage'
import MyBookingsPage from './pages/customer/MyBookingsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminBusesPage from './pages/admin/AdminBusesPage'

export default function App() {
  const { user } = useAuth()

  return (
    <>
      {/* Navbar is hidden on the auth screens for a cleaner look. */}
      {user && <Navbar />}

      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer area */}
          <Route
            path="/"
            element={
              <ProtectedRoute role="customer">
                <CustomerSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute role="customer">
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin area */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buses"
            element={
              <ProtectedRoute role="admin">
                <AdminBusesPage />
              </ProtectedRoute>
            }
          />

          {/* Anything else -> home (which itself redirects by role). */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
