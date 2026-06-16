/**
 * SSH University App Configuration
 * Central location for environment variables and API endpoints
 */

// API Endpoints
export const PAYLOAD_API_URL = import.meta.env.VITE_PAYLOAD_API_URL || 'http://localhost:3000/api'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Feature flags
export const ENABLE_MENUS = import.meta.env.VITE_ENABLE_MENUS !== 'false'
export const ENABLE_CMS_PAGES = import.meta.env.VITE_ENABLE_CMS_PAGES !== 'false'

// Cache settings
export const CACHE_ENABLED = import.meta.env.VITE_CACHE_ENABLED !== 'false'
export const CACHE_TTL = parseInt(import.meta.env.VITE_CACHE_TTL || '300000', 10) // 5 minutes default

// UI Configuration
export const HEADER_STICKY = import.meta.env.VITE_HEADER_STICKY !== 'false'
export const FOOTER_SHOW_COMPANY_INFO = import.meta.env.VITE_FOOTER_SHOW_COMPANY_INFO !== 'false'

// Analytics
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
