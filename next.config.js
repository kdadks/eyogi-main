import { withPayload } from '@payloadcms/next/withPayload'
import os from 'os'
import path from 'path'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.URL || // Netlify environment
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aggressive build speed optimizations
  experimental: {
    // Enable fastest compilation mode
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
      loaders: {
        // Skip heavy transformations
        '.js': ['babel-loader'],
        '.ts': ['ts-loader'],
        '.tsx': ['ts-loader'],
      },
    },
    // Speed up builds by reducing work
    webpackBuildWorker: true,
    // Enable parallel builds for faster compilation
    cpus: Math.max(1, os.cpus().length - 1),
    // Enable webpack caching
    webpackMemoryOptimizations: true,
    // Skip static generation where possible
    staticGenerationMaxConcurrency: 1,
    // Skip optimizations that slow down builds
    optimizePackageImports: [],
    // Skip font optimization for faster builds
    optimizeCss: false,
  },
  // Configure caching
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Reduce bundle analyzer overhead
  productionBrowserSourceMaps: false,
  // Optimize output - disable standalone for Netlify
  ...(process.env.NETLIFY ? {} : { output: 'standalone' }),
  // Skip optimizations for faster builds
  // Disable image optimization during build
  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './src/utilities/imageLoader.js',
  },
  // Reduce build size
  compiler: {
    // Remove console statements in production for smaller bundles
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      { protocol: 'https', hostname: 'eyogigurukul.com' },
    ],
  },
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript checking during build for speed
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for speed
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false, // Disable for faster builds
  // Custom webpack config for faster builds
  webpack: (config, { dev }) => {
    // Speed up builds with filesystem cache
    config.cache = {
      type: 'filesystem',
      cacheDirectory: path.resolve('.next/cache/webpack'),
    }

    // Disable unnecessary optimizations during build
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // Use faster minification
        minimize: true,
        // Reduce bundle analysis time
        sideEffects: false,
        // Skip heavy optimizations
        concatenateModules: false,
      }
    }

    // Skip source maps for faster builds
    config.devtool = false

    return config
  },
  redirects,
  async rewrites() {
    return [
      // Handle SSH app routes (except for assets)
      {
        source: '/ssh-app',
        destination: '/ssh-app/index.html',
      },
      {
        source: '/ssh-app/((?!assets|Images|.*\\..*).*)',
        destination: '/ssh-app/index.html',
      },
    ]
  },
}

export default withPayload(nextConfig)
