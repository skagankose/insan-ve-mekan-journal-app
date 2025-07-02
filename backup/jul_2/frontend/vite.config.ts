import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      clientPort: 5173,
      host: '164.92.132.255'
    },
    watch: {
      usePolling: true
    },
    proxy: {
      // Proxy /api requests to our backend server
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // Remove the /api prefix before forwarding
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
