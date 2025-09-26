import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from the main project
dotenv.config({ path: path.resolve('../../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
  console.log('VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function addCertificateColumns() {
  console.log('🔍 Checking enrollments table structure...')

  try {
    // Check current table structure
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .limit(1)

    if (columnError) {
      console.error('❌ Error checking enrollments table:', columnError.message)
      return
    }

    console.log('✅ Enrollments table exists')

    if (columns && columns.length > 0) {
      const sampleRecord = columns[0]
      console.log('\n📋 Current columns in enrollments table:')
      Object.keys(sampleRecord).forEach((column) => {
        console.log(`  - ${column}`)
      })

      // Check if certificate_issued column exists
      if ('certificate_issued' in sampleRecord) {
        console.log('\n✅ certificate_issued column already exists!')
      } else {
        console.log('\n❌ certificate_issued column is missing')
        console.log('\n📝 SQL to add missing columns:')
        console.log(`
-- Add certificate_issued column to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT FALSE;

-- Add certificate_url column to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Update existing completed enrollments to have certificate_issued = false
UPDATE enrollments 
SET certificate_issued = FALSE 
WHERE certificate_issued IS NULL;
`)

        console.log('\n🚀 You need to run the above SQL commands in your Supabase SQL Editor.')
        console.log('🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql')
      }

      // Check if certificate_url column exists
      if ('certificate_url' in sampleRecord) {
        console.log('✅ certificate_url column already exists!')
      } else {
        console.log('❌ certificate_url column is missing (SQL above includes this)')
      }
    } else {
      console.log('⚠️  No records found in enrollments table')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

addCertificateColumns()
