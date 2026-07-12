/**
 * Central API client.
 *
 * One axios instance for the whole app so that:
 *   - the base URL is configured in a single place,
 *   - every request automatically carries the JWT (via an interceptor),
 *   - a 401 response clears the stale token.
 *
 * The grouped exports (authApi, busApi, ...) keep components clean: they
 * call `busApi.list()` instead of repeating URLs and headers everywhere.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

// Attach the bearer token (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the token is rejected, drop it so the UI can send the user to login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

// --- Auth ---
export const authApi = {
  // Login uses OAuth2's form format (username = email).
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
}

// --- Buses ---
export const busApi = {
  list: (params) => api.get('/buses', { params }),
  get: (id) => api.get(`/buses/${id}`),
  create: (payload) => api.post('/buses', payload),
  update: (id, payload) => api.patch(`/buses/${id}`, payload),
  remove: (id) => api.delete(`/buses/${id}`),
}

// --- Bookings ---
export const bookingApi = {
  create: (payload) => api.post('/bookings', payload),
  mine: () => api.get('/bookings'),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
}

// --- AI search ---
export const searchApi = {
  natural: (query) => api.post('/search', { query }),
}

// --- Admin ---
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
}

export default api
