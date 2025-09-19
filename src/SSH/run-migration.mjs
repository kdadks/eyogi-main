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
    // Get migration file from command line argument or use default
    const migrationFile = process.argv[2] || './supabase/migrations/20250918000004_fix_website_user_auth.sql'

    // Read the migration file
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8')

    console.log(`Applying migration from ${migrationFile}...`)
    console.log('SQL:', migrationSQL)

    // Split SQL into individual statements and execute each
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT')

    console.log(`Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      console.log(`\nExecuting statement ${i + 1}:`, statement.substring(0, 100) + '...')

      const { data, error } = await supabase.from('dummy').select('*').limit(0) // Just to test connection

      // For DDL statements, we need to use a direct query
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ query: statement })
        })

        if (!response.ok) {
          console.error(`Statement ${i + 1} failed:`, await response.text())
        } else {
          console.log(`Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err)
      }
    }

    console.log('Migration completed!')
  } catch (error) {
    console.error('Error running migration:', error)
  }
}

runMigration()
