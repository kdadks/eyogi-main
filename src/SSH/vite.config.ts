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
          manualChunks: (id) => {
            // Only isolate heavy, non-React/standalone vendor libraries
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdfjs'
            }
            if (id.includes('node_modules/jspdf')) {
              return 'vendor-jspdf'
            }
            if (id.includes('node_modules/html2canvas')) {
              return 'vendor-canvas'
            }
            if (id.includes('node_modules/quill/') || id.includes('node_modules/quill-delta/')) {
              return 'vendor-editor'
            }
            if (id.includes('node_modules/@supabase/')) {
              return 'vendor-supabase'
            }

            // All React, UI, icons, and application components are naturally bundled and
            // code-split via React.lazy() without artificial circular dependency cycles.
            return undefined
          },
        },
      },
      chunkSizeWarningLimit: 2000,
      minify: !isDev ? 'esbuild' : false,
    },
    define: {
      global: 'globalThis',
      'process.env': {},
      __DEV__: isDev ? 'true' : 'false',
      'process.browser': true,
      'process.version': JSON.stringify(''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Polyfill Node.js modules for browser
        stream: 'stream-browserify',
        buffer: 'buffer',
        util: 'util',
        http: 'stream-http',
        https: 'https-browserify',
        url: 'url',
        zlib: 'browserify-zlib',
        assert: 'assert',
      },
      dedupe: ['react', 'react-dom'], // Ensure only one instance of React
    },
    // Development-specific optimizations
    esbuild: isDev
      ? {
          // Faster rebuilds in development
          target: 'es2020',
        }
      : {
          // Keep console logs visible in production for debugging
          drop: [],
        },
    optimizeDeps: {
      // Force reload dependencies in development
      force: isDev, // Set to true in dev to force dep optimization
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      exclude: ['lucide-react'],
      esbuildOptions: {
        // Ensure React is treated as a single module
        mainFields: ['module', 'main'],
      },
    },
  }
})
