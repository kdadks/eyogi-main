#!/usr/bin/env node
/**
 * Backfill Student IDs
 *
 * Finds all profiles with role='student' and student_id=NULL,
 * generates a proper student ID for each using the same logic as the app,
 * and updates the record in Supabase.
 *
 * Usage:
 *   node scripts/backfill-student-ids.mjs [--dry-run]
 *
 * Options:
 *   --dry-run   Show what would be updated without writing to the database
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY env vars.')
  console.error('Run from the src/SSH directory: node scripts/backfill-student-ids.mjs')
  process.exit(1)
}

const isDryRun = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Student ID Generator (mirrors src/lib/id-generator.ts) ──────────────────
async function generateStudentId(country, state, city) {
  const countryCode = (country || 'XX').toUpperCase()
  const stateCode = state ? state.toUpperCase() : city ? city.substring(0, 2).toUpperCase() : 'XX'
  const year = new Date().getFullYear()
  const prefix = `${countryCode}${stateCode}${year}`

  const maxAttempts = 10
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('student_id')
      .not('student_id', 'is', null)
      .ilike('student_id', `${prefix}%`)

    let nextNumber = 1
    if (!error && data && data.length > 0) {
      const numbers = data
        .map((row) => {
          const sid = row.student_id
          if (!sid || sid.length < 5) return 0
          const num = parseInt(sid.slice(-5), 10)
          return isNaN(num) ? 0 : num
        })
        .filter((n) => n > 0)
      if (numbers.length > 0) nextNumber = Math.max(...numbers) + 1
    }

    const candidateId = `${prefix}${String(nextNumber).padStart(5, '0')}`

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', candidateId)
      .maybeSingle()

    if (!existing) return candidateId
    console.warn(`  Collision on ${candidateId}, retrying (attempt ${attempt + 1})…`)
  }

  // Fallback
  const ts = Date.now().toString().slice(-5)
  return `${prefix}${ts}`
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== SSH University: Backfill Student IDs${isDryRun ? ' [DRY RUN]' : ''} ===\n`)

  // 1. Fetch all students with null student_id
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, country, state, city, student_id')
    .eq('role', 'student')
    .is('student_id', null)

  if (error) {
    console.error('Failed to query profiles:', error.message)
    process.exit(1)
  }

  if (!students || students.length === 0) {
    console.log('No students with missing student_id found. Nothing to do.')
    return
  }

  console.log(`Found ${students.length} student(s) with no student_id:\n`)

  let successCount = 0
  let skipCount = 0
  let failCount = 0

  for (const student of students) {
    const { id, email, full_name, country, state, city } = student

    if (!country) {
      console.warn(`  SKIP  ${email || id} — no country on profile (cannot generate ID)`)
      skipCount++
      continue
    }

    let newId
    try {
      newId = await generateStudentId(country, state, city)
    } catch (err) {
      console.error(`  FAIL  ${email || id} — ID generation error: ${err.message}`)
      failCount++
      continue
    }

    console.log(`  ${isDryRun ? '[DRY]' : 'FIX '} ${email || id}`)
    console.log(`         name   : ${full_name || '(encrypted)'}`)
    console.log(`         country: ${country}  state: ${state || '—'}  city: ${city || '—'}`)
    console.log(`         new ID : ${newId}`)

    if (!isDryRun) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ student_id: newId, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) {
        console.error(`         ERROR: ${updateError.message}`)
        failCount++
      } else {
        console.log(`         ✓ Updated successfully`)
        successCount++
      }
    } else {
      successCount++
    }

    console.log()
  }

  console.log('─'.repeat(50))
  console.log(
    `Results: ${successCount} ${isDryRun ? 'would be updated' : 'updated'}, ${skipCount} skipped (no country), ${failCount} failed`,
  )
  if (isDryRun) console.log('\nRe-run without --dry-run to apply changes.')
  console.log()
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
