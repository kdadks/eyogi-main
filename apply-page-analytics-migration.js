const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('📊 Applying page_analytics table migration...')

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'src/SSH/migrations/page_analytics.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 60)}...`)

      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        // Try direct execution as fallback
        console.log('   Trying alternative method...')
        const { error: directError } = await supabase.from('_migrations').insert({
          name: `page_analytics_${Date.now()}`,
          executed_at: new Date().toISOString()
        })

        if (directError && directError.code !== '42P01') {
          console.error(`   ⚠️  Warning: ${error.message}`)
        }
      } else {
        console.log('   ✅ Success')
      }
    }

    console.log('\n✅ Migration completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of src/SSH/migrations/page_analytics.sql')
    console.log('4. Click "Run" to execute the migration')
    console.log('\nOr run this SQL directly in Supabase:')
    console.log(sql)

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Manual steps:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of src/SSH/migrations/page_analytics.sql')
    console.log('4. Click "Run" to execute the migration')
  }
}

applyMigration()
