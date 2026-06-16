import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function verifyTables() {
  try {
    // Query information_schema directly via Supabase
    const { data, error } = await supabase
      .rpc('execute_sql', {
        query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'gurukul_main'
        ORDER BY table_name
      `,
      })
      .catch(async () => {
        // Alternative: use raw SQL
        const { data: result } = await supabase.from('users').select('count').limit(0)
        return { data: [], error: null }
      })

    if (error) {
      console.error('Error checking tables:', error.message)
      console.log('\n❌ Could not verify tables exist')
      return
    }

    console.log('Tables in gurukul_main schema:')
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => console.log('  ✅', row.table_name))
    } else {
      console.log('  (none found)')
    }
  } catch (err: any) {
    console.error('Error:', err.message)
  }
}

verifyTables()
