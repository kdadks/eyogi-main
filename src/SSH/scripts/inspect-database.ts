#!/usr/bin/env tsx

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env file
dotenv.config({ path: join(process.cwd(), '.env') })

// Create Supabase client using environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please ensure .env file contains:')
  console.log('- VITE_SUPABASE_URL')
  console.log('- VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface TableStats {
  table_name: string
  row_count: number
}

async function inspectDatabase() {
  console.log('🔍 Inspecting Database Schema and Records...\n')

  try {
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_table_names').select()

    if (tablesError) {
      console.log('❌ Could not fetch table names via RPC. Trying alternative method...')

      // Alternative: Query specific tables we know about
      const knownTables = [
        'profiles',
        'courses',
        'enrollments',
        'certificates',
        'certificate_templates',
        'gurukuls',
        'batches',
        'batch_students',
      ]

      for (const tableName of knownTables) {
        await inspectTable(tableName)
      }

      return
    }

    console.log(`📊 Found ${tables?.length || 0} tables\n`)

    // Inspect each table
    for (const table of tables || []) {
      await inspectTable(table.table_name)
    }
  } catch (error) {
    console.error('❌ Error inspecting database:', error)

    // Fallback: inspect known important tables
    console.log('\n🔄 Fallback: Inspecting known tables...\n')
    const importantTables = ['enrollments', 'certificates']

    for (const tableName of importantTables) {
      await inspectTable(tableName)
    }
  }
}

async function inspectTable(tableName: string) {
  try {
    console.log(`📋 Table: ${tableName}`)
    console.log('='.repeat(50))

    // Get table structure from information_schema (if accessible)
    try {
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position')

      if (!columnsError && columns) {
        console.log('\n🏗️  Schema:')
        columns.forEach((col) => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
          console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`)
        })
      }
    } catch (schemaError) {
      console.log('  ⚠️  Could not fetch schema information')
    }

    // Get row count and sample data
    const { count, error: countError } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log(`  ❌ Could not access table ${tableName}:`, countError.message)
    } else {
      console.log(`\n📊 Records: ${count || 0}`)

      // Get sample data (first 3 records)
      if (count && count > 0) {
        const { data: sampleData, error: sampleError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(3)

        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log('\n📄 Sample Records:')
          sampleData.forEach((record, index) => {
            console.log(`\n  Record ${index + 1}:`)
            Object.entries(record).forEach(([key, value]) => {
              const displayValue =
                typeof value === 'string' && value.length > 50
                  ? value.substring(0, 50) + '...'
                  : JSON.stringify(value)
              console.log(`    ${key}: ${displayValue}`)
            })
          })
        }

        // Special handling for enrollment table to check certificate fields
        if (tableName === 'enrollments') {
          await checkEnrollmentCertificateFields()
        }

        // Special handling for certificates table
        if (tableName === 'certificates') {
          await checkCertificatesTable()
        }
      }
    }

    console.log('\n' + '='.repeat(50) + '\n')
  } catch (error) {
    console.log(`  ❌ Error inspecting table ${tableName}:`, error)
  }
}

async function checkEnrollmentCertificateFields() {
  try {
    console.log('\n🔍 Checking enrollment certificate fields...')

    const { data: enrollmentsWithCerts, error } = await supabaseAdmin
      .from('enrollments')
      .select('id, certificate_issued, certificate_url, certificate_issued_at')
      .not('certificate_issued', 'is', null)
      .limit(5)

    if (error) {
      console.log('  ❌ Could not check certificate fields (possibly removed):', error.message)
    } else {
      console.log(
        `  📋 Found ${enrollmentsWithCerts?.length || 0} enrollments with certificate data`,
      )
      if (enrollmentsWithCerts && enrollmentsWithCerts.length > 0) {
        console.log('  Sample certificate data in enrollments:')
        enrollmentsWithCerts.forEach((enrollment, index) => {
          console.log(
            `    ${index + 1}. ID: ${enrollment.id}, Issued: ${enrollment.certificate_issued}, URL: ${enrollment.certificate_url}`,
          )
        })
      }
    }
  } catch (error) {
    console.log('  ⚠️  Certificate fields may have been removed from enrollments table')
  }
}

async function checkCertificatesTable() {
  try {
    console.log('\n🏆 Analyzing certificates table structure...')

    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .limit(3)

    if (error) {
      console.log('  ❌ Error accessing certificates table:', error.message)
    } else {
      console.log(`  ✅ Certificates table is accessible`)
      if (certificates && certificates.length > 0) {
        console.log('  🔑 Key fields found:')
        const firstCert = certificates[0]
        const keyFields = [
          'id',
          'student_id',
          'course_id',
          'certificate_number',
          'title',
          'issue_date',
          'completion_date',
          'verification_code',
        ]

        keyFields.forEach((field) => {
          const hasField = field in firstCert
          const value = hasField ? firstCert[field] : 'NOT FOUND'
          console.log(
            `    ${field}: ${hasField ? '✅' : '❌'} ${hasField ? JSON.stringify(value) : ''}`,
          )
        })
      }
    }
  } catch (error) {
    console.log('  ⚠️  Could not analyze certificates table structure')
  }
}

// Run the inspection
inspectDatabase()
  .then(() => {
    console.log('✅ Database inspection completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to inspect database:', error)
    process.exit(1)
  })
