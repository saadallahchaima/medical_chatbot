import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    define: {
      '__BUNDLED_DEV__': JSON.stringify(true),
      'global': 'window', // Nécessaire pour certaines bibliothèques PDF
    },
    optimizeDeps: {
      // On retire les options rollupOptions dépréciées si elles existaient
    }
  },
})





