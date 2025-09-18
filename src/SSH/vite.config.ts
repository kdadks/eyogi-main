import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ssh-app/',
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor'
            }
            if (id.includes('react-router')) {
              return 'router'
            }
            if (id.includes('@heroicons')) {
              return 'ui'
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms'
            }
            if (id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils'
            }
            return 'vendor'
          }
          if (id.includes('pages/dashboard')) {
            return 'dashboard'
          }
          if (id.includes('pages/auth')) {
            return 'auth'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: false,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
