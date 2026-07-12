/**
 * Authentication context.
 *
 * Holds the logged-in user in React state + localStorage so a page refresh
 * keeps you logged in. Exposes `login`, `register`, and `logout` so any
 * component can trigger auth actions without knowing the API details.
 *
 * On first load, if a token exists we call /auth/me to restore the session
 * (and silently log out if the token has expired).
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from an existing token on startup.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  // Persist the token + user after a successful auth response.
  const persist = (data) => {
    localStorage.setItem('token', data.access_token)
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    return persist(res.data)
  }

  const register = async (payload) => {
    const res = await authApi.register(payload)
    return persist(res.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Small hook so components just call `useAuth()`.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
