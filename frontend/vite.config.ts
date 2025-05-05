import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Keep the frontend port consistent
    host: true, // Ensure server is accessible externally (though command flag should also work)
    proxy: {
      // Proxy /api requests to our backend server
      '/api': {
        target: 'http://backend:8000', // Target backend service in Docker
        changeOrigin: true,
        // Remove the /api prefix before forwarding
        rewrite: (path) => path.replace(/^\/api/, ''), 
      }
    }
  }
})
