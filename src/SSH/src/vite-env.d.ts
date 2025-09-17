/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
  readonly VITE_UPLOADTHING_APP_ID: string
  readonly UPLOADTHING_SECRET: string
  readonly UPLOADTHING_TOKEN: string
  readonly VITE_JWT_SECRET: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_FROM_EMAIL: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly STRIPE_SECRET_KEY: string
  readonly VITE_GA_MEASUREMENT_ID: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly NODE_ENV: string
  readonly VITE_DEV_MODE: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_RATE_LIMIT_REQUESTS: string
  readonly VITE_RATE_LIMIT_WINDOW: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
