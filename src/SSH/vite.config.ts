import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    base: '/ssh-app/',
    plugins: [
      react(),
      // visualizer({
      //   filename: 'dist/stats.html',
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      // }),
    ],
    // Development server configuration
    server: {
      host: true,
      port: 5173,
      hmr: {
        overlay: true,
      },
      // Force reload on file changes during development
      ...(isDev && {
        fs: {
          strict: false,
        },
      }),
    },
    build: {
      sourcemap: isDev, // Enable source maps in development
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: !isDev, // Don't minify in development
    },
    define: {
      global: 'globalThis',
      'process.env': {},
      __DEV__: isDev ? 'true' : 'false',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Development-specific optimizations and production console removal
    esbuild: isDev
      ? {
          // Faster rebuilds in development
          target: 'es2020',
        }
      : {
          // Remove console logs in production builds only
          drop: ['console', 'debugger'],
        },
    optimizeDeps: {
      // Force reload dependencies in development
      force: isDev, // Set to true in dev to force dep optimization
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['lucide-react'],
    },
  }
})
