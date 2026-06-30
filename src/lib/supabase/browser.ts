import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const browserClient = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { db: { schema: 'gurukul_main' } },
)

// Admin client for authenticated operations that bypass RLS if needed
export const createAdminClient = () => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    {
      db: { schema: 'gurukul_main' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    }
  )
}
