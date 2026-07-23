import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ◄── Allows connections from outside the container
    port: 3000,      // ◄── Matches port 3000 mapped in docker-compose
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:5000', // ◄── Uses backend container service name
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://backend:5000', // ◄── Uses backend container service name
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
