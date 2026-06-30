import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [react()],
    envPrefix: ['VITE_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'src': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 3000,
      strictPort: false,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      watch: {
        ignored: ['**/node_modules/**', '**/SSH/**'],
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: isDev,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Core React libraries
            if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('node_modules/react') && !id.includes('react-router'))) {
              return 'vendor-react'
            }
            // Animation library
            if (id.includes('framer-motion') || id.includes('/motion/')) {
              return 'vendor-motion'
            }
            // Database
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            // UI utilities
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-ui'
            }
          },
        },
      },
    },
  }
})
