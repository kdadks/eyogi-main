declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      VITE_SERVER_URL: string
      VITE_SUPABASE_URL: string
      VITE_SUPABASE_ANON_KEY: string
      URL: string
      DEPLOY_PRIME_URL: string
      DEPLOY_URL: string
      VITE_SUMUP_SANDBOX_KEY: string
      VITE_SUMUP_PRODUCTION_KEY: string
      VITE_SUMUP_SANDBOX_MERCHANT_CODE: string
      VITE_SUMUP_PRODUCTION_MERCHANT_CODE: string
      SUPABASE_SERVICE_ROLE_KEY: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
