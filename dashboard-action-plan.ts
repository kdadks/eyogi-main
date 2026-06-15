#!/usr/bin/env node

/**
 * Phase 1 Days 2-5: Dashboard Action Plan
 * Generates a step-by-step checklist for Supabase Dashboard setup
 *
 * Usage: npx ts-node dashboard-action-plan.ts
 */

import * as fs from 'fs'

const BLUE = '\x1b[34m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

function log(color: string, msg: string) {
  console.log(`${color}${msg}${RESET}`)
}

function printSection(title: string) {
  log(
    BLUE,
    `
╔════════════════════════════════════════════════════════════════╗
║  ${title}
╚════════════════════════════════════════════════════════════════╝
  `,
  )
}

const plan = {
  day2: {
    title: 'Day 2: Database & Email Verification',
    duration: '7 minutes',
    link: 'https://gwugapcoknxqqluocjzl.supabase.co',
    tasks: [
      {
        num: '2.1',
        title: 'Verify Database Tables',
        steps: [
          '1. Go to: SQL Editor (left sidebar)',
          '2. Create new query',
          '3. Run this SQL:',
          '',
          'SELECT table_name',
          'FROM information_schema.tables',
          "WHERE table_schema = 'gurukul_main'",
          'ORDER BY table_name;',
          '',
          '4. Should return 14 tables:',
          '   - assignments',
          '   - categories',
          '   - courses',
          '   - enrollments',
          '   - form_submissions',
          '   - forms',
          '   - lessons',
          '   - media',
          '   - memberships',
          '   - pages',
          '   - posts',
          '   - settings',
          '   - submissions',
          '   - users',
          '',
          '✅ DONE: If all 14 appear',
        ],
        time: '3 min',
      },
      {
        num: '2.2',
        title: 'Verify Email/Password Provider',
        steps: [
          '1. Go to: Authentication → Providers',
          '2. Check that "Email" provider is enabled (green toggle)',
          '3. Verify settings:',
          '   - ✅ "Allow sign-ups" is checked',
          '   - ✅ "Confirm email" is checked',
          '',
          '✅ DONE: Provider is ready',
        ],
        time: '2 min',
      },
      {
        num: '2.3',
        title: 'Test Supabase Connection',
        steps: [
          '✅ ALREADY DONE: Connection test passed in smart setup',
          '',
          'Result: Connected to https://gwugapcoknxqqluocjzl.supabase.co',
        ],
        time: '0 min',
      },
    ],
  },
  day3: {
    title: 'Day 3: Storage Buckets & CORS',
    duration: '25 minutes',
    link: 'https://gwugapcoknxqqluocjzl.supabase.co',
    tasks: [
      {
        num: '3.1',
        title: 'Create Storage Buckets',
        steps: [
          '📝 NOTE: "media" bucket already exists',
          '',
          'Create 2 more buckets:',
          '',
          'BUCKET 1: course-materials (Private)',
          '  1. Go to: Storage → Buckets',
          '  2. Click "New bucket"',
          '  3. Name: course-materials',
          '  4. File size limit: 104857600 (100MB)',
          '  5. ❌ DO NOT check "Public bucket"',
          '  6. Click "Create bucket"',
          '',
          'BUCKET 2: user-uploads (Private)',
          '  1. Click "New bucket"',
          '  2. Name: user-uploads',
          '  3. File size limit: 52428800 (50MB)',
          '  4. ❌ DO NOT check "Public bucket"',
          '  5. Click "Create bucket"',
          '',
          '✅ DONE: 3 buckets exist (media, course-materials, user-uploads)',
        ],
        time: '10 min',
      },
      {
        num: '3.2',
        title: 'Configure CORS',
        steps: [
          'For EACH bucket (media, course-materials, user-uploads):',
          '',
          '  1. Click bucket name',
          '  2. Click "Settings" tab',
          '  3. Scroll to "CORS Configuration"',
          '  4. Click "+ Add allowed origin"',
          '  5. Add these 4 origins (one at a time):',
          '     - http://localhost:3000',
          '     - http://localhost:3001',
          '     - https://eyogigurukul.com',
          '     - https://www.eyogigurukul.com',
          '  6. Click "Save"',
          '',
          '  💡 Repeat steps 1-6 for all 3 buckets',
          '',
          '✅ DONE: CORS configured on all 3 buckets',
        ],
        time: '15 min',
      },
    ],
  },
  day4: {
    title: 'Day 4: Enable RLS',
    duration: '10 minutes',
    link: 'https://gwugapcoknxqqluocjzl.supabase.co',
    tasks: [
      {
        num: '4.1',
        title: 'Enable RLS on All Tables',
        steps: [
          '1. Go to: SQL Editor',
          '2. Create new query',
          '3. Copy & paste this entire SQL:',
          '',
          "SET search_path = 'gurukul_main';",
          '',
          'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE pages ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE posts ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE categories ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE media ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE settings ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE forms ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE courses ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;',
          '',
          '4. Click "Run" (or Ctrl+Enter)',
          '5. Should complete with no errors',
          '',
          '✅ DONE: RLS enabled on all 14 tables',
        ],
        time: '10 min',
      },
      {
        num: '4.2',
        title: 'Verify RLS Enabled',
        steps: [
          '1. Go to: SQL Editor',
          '2. Create new query',
          '3. Run this:',
          '',
          'SELECT schemaname, tablename, rowsecurity',
          'FROM pg_tables',
          "WHERE schemaname = 'gurukul_main'",
          'ORDER BY tablename;',
          '',
          '4. Verify: rowsecurity column = true for all tables',
          '',
          '✅ DONE: All 14 tables have RLS enabled',
        ],
        time: '2 min',
      },
    ],
  },
  day5: {
    title: 'Day 5: Create RLS Security Policies',
    duration: '20 minutes',
    link: 'https://gwugapcoknxqqluocjzl.supabase.co',
    tasks: [
      {
        num: '5.1',
        title: 'Create Helper Functions',
        steps: [
          '1. Go to: SQL Editor',
          '2. Create new query',
          '3. Copy & paste this:',
          '',
          "SET search_path = 'gurukul_main';",
          '',
          'CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$',
          'BEGIN',
          '  RETURN COALESCE(',
          "    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role',",
          "    'public'",
          '  );',
          'END;',
          '$$ LANGUAGE plpgsql SECURITY DEFINER;',
          '',
          'CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$',
          'BEGIN',
          "  RETURN current_user_role() = 'admin';",
          'END;',
          '$$ LANGUAGE plpgsql SECURITY DEFINER;',
          '',
          'CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$',
          'BEGIN',
          "  RETURN current_user_role() IN ('teacher', 'admin');",
          'END;',
          '$$ LANGUAGE plpgsql SECURITY DEFINER;',
          '',
          '4. Click "Run"',
          '',
          '✅ DONE: Helper functions created',
        ],
        time: '5 min',
      },
      {
        num: '5.2',
        title: 'Apply All 42 RLS Policies',
        steps: [
          '1. Go to: SQL Editor',
          '2. Create new query',
          '3. Open file: PHASE1-RLS-POLICIES.md (in your editor)',
          '4. Copy EVERYTHING from that file',
          '5. Paste into SQL Editor',
          '6. Click "Run" (Ctrl+Enter)',
          '7. Should complete with no errors',
          '',
          '✅ DONE: 42 security policies applied',
        ],
        time: '10 min',
      },
      {
        num: '5.3',
        title: 'Verify Policies Created',
        steps: [
          '1. Go to: SQL Editor',
          '2. Create new query',
          '3. Run this:',
          '',
          'SELECT schemaname, tablename, policyname',
          'FROM pg_policies',
          "WHERE schemaname = 'gurukul_main'",
          'ORDER BY tablename, policyname;',
          '',
          '4. Should return ~42 policies',
          '',
          '✅ DONE: All policies verified',
        ],
        time: '3 min',
      },
    ],
  },
}

function main() {
  printSection('PHASE 1 DAYS 2-5: DASHBOARD ACTION PLAN')

  log(YELLOW, `🔗 Supabase Dashboard: https://gwugapcoknxqqluocjzl.supabase.co`)
  log(YELLOW, `⏱️  Total Time: ~1 hour spread over 4 days\n`)

  // DAY 2
  printSection(`${plan.day2.title} [${plan.day2.duration}]`)
  for (const task of plan.day2.tasks) {
    log(GREEN, `\n📋 Task ${task.num}: ${task.title} (${task.time})`)
    for (const step of task.steps) {
      log(step === '' ? RESET : step.includes('✅') ? GREEN : YELLOW, step)
    }
  }

  // DAY 3
  printSection(`${plan.day3.title} [${plan.day3.duration}]`)
  for (const task of plan.day3.tasks) {
    log(GREEN, `\n📋 Task ${task.num}: ${task.title} (${task.time})`)
    for (const step of task.steps) {
      log(step === '' ? RESET : step.includes('✅') ? GREEN : YELLOW, step)
    }
  }

  // DAY 4
  printSection(`${plan.day4.title} [${plan.day4.duration}]`)
  for (const task of plan.day4.tasks) {
    log(GREEN, `\n📋 Task ${task.num}: ${task.title} (${task.time})`)
    for (const step of task.steps) {
      log(step === '' ? RESET : step.includes('✅') ? GREEN : YELLOW, step)
    }
  }

  // DAY 5
  printSection(`${plan.day5.title} [${plan.day5.duration}]`)
  for (const task of plan.day5.tasks) {
    log(GREEN, `\n📋 Task ${task.num}: ${task.title} (${task.time})`)
    for (const step of task.steps) {
      log(step === '' ? RESET : step.includes('✅') ? GREEN : YELLOW, step)
    }
  }

  // COMPLETION
  printSection('COMPLETION CHECKLIST')

  log(GREEN, `\n✅ When all tasks above are complete:`)
  log(
    BLUE,
    `
  [ ] Day 2: Database tables verified (14 tables in gurukul_main)
  [ ] Day 2: Email/Password provider enabled
  [ ] Day 3: 3 storage buckets created
  [ ] Day 3: CORS configured on all buckets
  [ ] Day 4: RLS enabled on 14 tables
  [ ] Day 5: Helper functions created
  [ ] Day 5: 42 RLS policies applied
  [ ] Day 5: Policies verified in database
  
  `,
  )

  log(GREEN, `\n🎉 PHASE 1 COMPLETE!`)
  log(BLUE, `\nNext: Phase 2 - Build REST API with Next.js`)
  log(BLUE, `See: MIGRATION_PLAN.md for Phase 2-8 timeline\n`)
}

main()
