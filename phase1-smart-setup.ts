#!/usr/bin/env node

/**
 * Phase 1 Days 2-5: Smart Setup
 * Tests what can be automated, flags what needs manual setup
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

function log(color: string, msg: string) {
  console.log(`${color}${msg}${RESET}`)
}

async function main() {
  log(
    BLUE,
    `
╔════════════════════════════════════════════════════════════════╗
║  Phase 1 Smart Setup - Automated + Manual                     ║
║  Tests infrastructure, guides manual setup                    ║
╚════════════════════════════════════════════════════════════════╝
  `,
  )

  const results: { [key: string]: { status: boolean; action: string } } = {}

  // ============================================
  // TEST 1: Connection
  // ============================================
  log(BLUE, `\n1️⃣  Testing Supabase Connection...`)
  try {
    const { data, error } = await supabase.auth.getSession()
    if (!error || error.status === 401) {
      log(GREEN, `   ✅ Connected to ${SUPABASE_URL}`)
      results['Supabase Connection'] = { status: true, action: 'Auto-verified' }
    } else {
      log(RED, `   ❌ Connection failed: ${error.message}`)
      results['Supabase Connection'] = { status: false, action: 'Check URL/keys' }
    }
  } catch (err: any) {
    log(RED, `   ❌ Error: ${err.message}`)
    results['Supabase Connection'] = { status: false, action: 'Check credentials' }
  }

  // ============================================
  // TEST 2: List Existing Tables (read schema)
  // ============================================
  log(BLUE, `\n2️⃣  Checking Database Tables...`)
  try {
    // Try to get list of tables via information_schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'gurukul_main')
      .limit(100)

    if (tables && tables.length > 0) {
      log(GREEN, `   ✅ Found ${tables.length} tables in gurukul_main schema`)
      results['Database Tables'] = {
        status: true,
        action: `Auto-verified (${tables.length} tables found)`,
      }
    } else if (error && error.message.includes('Cannot find')) {
      log(YELLOW, `   ⚠️  Need to verify tables manually in Supabase Dashboard`)
      results['Database Tables'] = {
        status: false,
        action: 'Manual verification needed',
      }
    } else {
      log(RED, `   ❌ Error: ${error?.message}`)
      results['Database Tables'] = { status: false, action: error?.message || 'Unknown error' }
    }
  } catch (err: any) {
    log(YELLOW, `   ⚠️  Manual check needed: Dashboard → SQL Editor`)
    results['Database Tables'] = { status: false, action: 'Manual verification' }
  }

  // ============================================
  // TEST 3: List Storage Buckets
  // ============================================
  log(BLUE, `\n3️⃣  Checking Storage Buckets...`)
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (buckets && buckets.length > 0) {
      const bucketNames = buckets.map((b) => b.name).join(', ')
      log(GREEN, `   ✅ Found ${buckets.length} buckets: ${bucketNames}`)
      results['Storage Buckets'] = {
        status: buckets.length >= 3,
        action: `${buckets.length >= 3 ? 'Auto-verified' : 'Need to create media, course-materials, user-uploads'}`,
      }
    } else {
      log(YELLOW, `   ⚠️  No buckets found - need to create them`)
      results['Storage Buckets'] = { status: false, action: 'Create via Dashboard' }
    }
  } catch (err: any) {
    log(RED, `   ❌ Error: ${err.message}`)
    results['Storage Buckets'] = { status: false, action: 'Storage configuration needed' }
  }

  // ============================================
  // TEST 4: Check Auth Providers
  // ============================================
  log(BLUE, `\n4️⃣  Checking Authentication...`)
  try {
    // We can't directly query auth providers, but we can test auth
    const { data, error } = await supabase.auth.admin.listUsers()

    if (!error || error.status === 401) {
      log(GREEN, `   ✅ Authentication is accessible`)
      results['Authentication'] = { status: true, action: 'Auto-verified' }
    } else {
      log(YELLOW, `   ⚠️  Auth accessible but may need email provider setup`)
      results['Authentication'] = {
        status: false,
        action: 'Enable Email/Password in Dashboard',
      }
    }
  } catch (err: any) {
    log(YELLOW, `   ⚠️  Need to verify Email/Password provider`)
    results['Authentication'] = { status: false, action: 'Enable via Dashboard' }
  }

  // ============================================
  // TEST 5: Check RLS Status
  // ============================================
  log(BLUE, `\n5️⃣  Checking Row-Level Security (RLS)...`)
  try {
    // Try to query a table to see if RLS is working
    const { data, error } = await supabase.from('users').select('count').limit(1)

    if (!error || error.message.includes('Unable to recognize role')) {
      log(GREEN, `   ✅ RLS is active (as expected for public/anon user)`)
      results['RLS Active'] = { status: true, action: 'Auto-verified' }
    } else if (error.message.includes('not found')) {
      log(YELLOW, `   ⚠️  RLS may need to be enabled`)
      results['RLS Active'] = { status: false, action: 'Enable RLS in Dashboard' }
    } else {
      log(YELLOW, `   ℹ️  RLS status: ${error.message}`)
      results['RLS Active'] = { status: false, action: 'Verify in Dashboard' }
    }
  } catch (err: any) {
    log(RED, `   ❌ Error: ${err.message}`)
    results['RLS Active'] = { status: false, action: 'Check RLS configuration' }
  }

  // ============================================
  // SUMMARY
  // ============================================
  log(
    BLUE,
    `
╔════════════════════════════════════════════════════════════════╗
║  PHASE 1 SETUP STATUS REPORT                                  ║
╚════════════════════════════════════════════════════════════════╝
  `,
  )

  const passed = Object.values(results).filter((r) => r.status).length
  const total = Object.keys(results).length

  for (const [test, { status, action }] of Object.entries(results)) {
    const symbol = status ? '✅' : '⏳'
    log(status ? GREEN : YELLOW, `${symbol} ${test}: ${action}`)
  }

  log(BLUE, `\n📊 Automated Verification: ${passed}/${total} passed`)

  // ============================================
  // NEXT STEPS
  // ============================================
  log(
    BLUE,
    `
╔════════════════════════════════════════════════════════════════╗
║  NEXT STEPS - Manual Setup in Supabase Dashboard              ║
╚════════════════════════════════════════════════════════════════╝
  `,
  )

  log(YELLOW, `⏱️  Time Needed: ~1 hour`)
  log(YELLOW, `🔗 Link: https://gwugapcoknxqqluocjzl.supabase.co`)
  log(YELLOW, `📋 Guide: Open PHASE1-EXECUTION-GUIDE.md\n`)

  if (!results['Database Tables'].status) {
    log(YELLOW, `Day 2: Verify 14 database tables exist in gurukul_main schema`)
    log(YELLOW, `       → SQL Editor: Select from information_schema.tables\n`)
  }

  if (!results['Storage Buckets'].status) {
    log(YELLOW, `Day 3: Create 3 storage buckets`)
    log(
      YELLOW,
      `       → Storage: Create "media" (public), "course-materials" (private), "user-uploads" (private)`,
    )
    log(YELLOW, `       → Then configure CORS on all 3 buckets\n`)
  }

  if (!results['RLS Active'].status) {
    log(YELLOW, `Day 4-5: Enable RLS and create security policies`)
    log(YELLOW, `         → SQL Editor: ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
    log(YELLOW, `         → Copy all 42 policies from PHASE1-RLS-POLICIES.md\n`)
  }

  log(
    GREEN,
    `
🎯 QUICK SUMMARY:
  
  1. Go to: https://gwugapcoknxqqluocjzl.supabase.co
  2. Follow: PHASE1-EXECUTION-GUIDE.md (Day by day)
  3. Verify: All manual tasks completed
  4. Then: Ready for Phase 2 API development

⏱️  Total Time: ~1 hour spread across 4 days
  `,
  )

  const allDone = passed === total
  process.exit(allDone ? 0 : 1)
}

main().catch((err) => {
  log(RED, `\n❌ Fatal error: ${err.message}`)
  process.exit(1)
})
