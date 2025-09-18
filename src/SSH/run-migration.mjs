import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
const supabaseUrl = 'https://fxhmipivmuqgdtwzpeni.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aG1pcGl2bXVxZ2R0d3pwZW5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEwMDUzMCwiZXhwIjoyMDczNjc2NTMwfQ.qds4eDB5fOwa-9i7iwD2qeqD5YBFWQqj5eZajaiUMzw'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20250918000004_fix_website_user_auth.sql',
      'utf8',
    )

    console.log('Applying website user authentication fix migration...')
    console.log('SQL:', migrationSQL)

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration failed:', error)
      return
    }

    console.log('Migration completed successfully!')
    console.log('Result:', data)
  } catch (error) {
    console.error('Error running migration:', error)
  }
}

runMigration()
