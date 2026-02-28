import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/api/v1/users': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/api/v1/accounts': {
        target: 'http://localhost:9005',
        changeOrigin: true,
      },
      '/api/v1/loan': {
        target: 'http://localhost:9001',
        changeOrigin: true,
      },
    },
  },
})
