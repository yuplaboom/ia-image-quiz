import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Écoute sur toutes les interfaces
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Nécessaire pour Docker sur certains systèmes
    },
    hmr: {
      clientPort: 5173, // Port pour le Hot Module Replacement
    }
  }
})
