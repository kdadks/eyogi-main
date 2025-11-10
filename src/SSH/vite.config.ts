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
            // Core React libraries - MUST be first and keep ALL React code together
            if (
              id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-is') ||
              id.includes('node_modules/prop-types') ||
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')
            ) {
              return 'vendor-react'
            }
            
            // Router - also React-related
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
              return 'vendor-react'
            }
            
            // Framer Motion - uses React context heavily
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-react'
            }
            
            // UI Component libraries
            if (
              id.includes('node_modules/@headlessui') ||
              id.includes('node_modules/@heroicons') ||
              id.includes('node_modules/lucide-react')
            ) {
              return 'vendor-ui'
            }
            
            // Rich text editor (large dependency)
            if (id.includes('node_modules/react-quill') || id.includes('node_modules/quill')) {
              return 'vendor-editor'
            }
            
            // PDF libraries - split into separate chunks
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdfjs'
            }
            if (id.includes('node_modules/html2canvas')) {
              return 'vendor-canvas'
            }
            if (id.includes('node_modules/jspdf')) {
              return 'vendor-jspdf'
            }
            
            // Supabase (database client)
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase'
            }
            
            // Form libraries
            if (
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/zod') ||
              id.includes('node_modules/@hookform')
            ) {
              return 'vendor-forms'
            }
            
            // Date libraries
            if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs')) {
              return 'vendor-dates'
            }
            
            // Charts and visualization
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory')
            ) {
              return 'vendor-charts'
            }
            
            // Toast/notifications - also React context based
            if (id.includes('node_modules/sonner') || id.includes('node_modules/react-hot-toast')) {
              return 'vendor-react'
            }
            
            // Admin dashboard components - more granular splitting
            if (id.includes('src/components/admin') || id.includes('src/pages/dashboard')) {
              // Core admin components
              if (id.includes('AdminDashboard') || id.includes('AdminLayout')) {
                return 'admin-core'
              }
              // User management
              if (id.includes('UserManagement') || id.includes('PermissionManagement')) {
                return 'admin-users'
              }
              // Content and course management
              if (id.includes('CourseManagement') || id.includes('ContentManagement')) {
                return 'admin-content'
              }
              // Batch and enrollment management
              if (id.includes('BatchManagement') || id.includes('EnrollmentManagement')) {
                return 'admin-batch'
              }
              // Teacher and student management
              if (id.includes('TeacherManagement') || id.includes('StudentManagement') || id.includes('TeacherDetail')) {
                return 'admin-people'
              }
              // Resources (certificates, media)
              if (id.includes('Certificate') || id.includes('MediaManagement')) {
                return 'admin-resources'
              }
              // Compliance, invoice, payment
              if (id.includes('Compliance') || id.includes('Invoice') || id.includes('Payment')) {
                return 'admin-finance'
              }
              // Analytics and gurukul
              if (id.includes('Analytics') || id.includes('GurukulManagement')) {
                return 'admin-analytics'
              }
              // Course assignments
              if (id.includes('CourseAssignment')) {
                return 'admin-assignments'
              }
              // Catch-all for remaining admin components
              return 'admin-misc'
            }
            
            // Dashboard pages - split by user role
            if (id.includes('src/pages/dashboard')) {
              if (id.includes('TeacherDashboard')) {
                return 'dashboard-teacher'
              }
              if (id.includes('StudentDashboard')) {
                return 'dashboard-student'
              }
              if (id.includes('parents/ParentsDashboard')) {
                return 'dashboard-parent'
              }
              if (id.includes('DashboardPage')) {
                return 'dashboard-main'
              }
            }
            
            // Teacher components (separate from teacher dashboard)
            if (id.includes('src/components/teacher')) {
              return 'features-teacher'
            }
            
            // Don't separate contexts or hooks - keep with main app code
            if (id.includes('src/contexts/') || id.includes('src/hooks/')) {
              return undefined // Let Vite decide, usually bundles with main
            }
            
            // Other large node_modules
            if (id.includes('node_modules')) {
              return 'vendor-misc'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1500, // Raised to 1.5MB since gzipped sizes are much smaller
      minify: !isDev ? 'terser' : false, // Use terser for better console removal
      terserOptions: !isDev
        ? {
            compress: {
              drop_console: true, // Remove all console statements
              drop_debugger: true, // Remove debugger statements
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // Remove specific console methods
            },
          }
        : undefined,
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
      include: ['react', 'react-dom', 'react-router-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      exclude: ['lucide-react'],
      esbuildOptions: {
        // Ensure React is treated as a single module
        mainFields: ['module', 'main'],
      },
    },
  }
})
