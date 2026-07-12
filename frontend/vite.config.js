import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server config. Runs on port 5173 (the origin the backend's
// CORS is configured to allow).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
