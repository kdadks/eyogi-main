/**
 * Server-side (admin) Supabase client for eyogi-main (Vite SPA)
 * Uses service role key — only call from trusted server/API contexts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const createAdminClient = () =>
  createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'gurukul_main',
      },
    },
  )
