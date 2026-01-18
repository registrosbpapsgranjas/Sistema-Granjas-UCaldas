import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  
  // Configuración SEGURA para producción:
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Deja que Vite maneje el chunking automáticamente
    rollupOptions: {
      output: {
        // Solo configura naming si quieres, pero no manualChunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  base: '/',
  
  // OPTIONAL: Si quieres optimizaciones
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})