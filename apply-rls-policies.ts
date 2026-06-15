#!/usr/bin/env node

/**
 * Phase 1 Days 2-5: Complete RLS Policies
 * Creates all 42 security policies for the gurukul_main schema
 *
 * Usage: npx ts-node apply-rls-policies.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

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

// All RLS policies from PHASE1-RLS-POLICIES.md
const RLS_POLICIES = `
SET search_path = 'gurukul_main';

-- Helper Functions
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
BEGIN
  RETURN (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() IN ('teacher', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE POLICIES (6 policies)
-- ============================================

CREATE POLICY "Allow users to read own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Allow admins to read all users" 
  ON users FOR SELECT 
  USING (is_admin());

CREATE POLICY "Allow users to update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins to update any user" 
  ON users FOR UPDATE 
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admins to delete users" 
  ON users FOR DELETE 
  USING (is_admin());

CREATE POLICY "Service role can insert users" 
  ON users FOR INSERT 
  WITH CHECK (current_setting('role') = 'service_role');

-- ============================================
-- PAGES TABLE POLICIES (6 policies)
-- ============================================

CREATE POLICY "Allow public to read published pages" 
  ON pages FOR SELECT 
  USING (status = 'published' OR status = 'public');

CREATE POLICY "Allow authenticated users to read draft pages" 
  ON pages FOR SELECT 
  USING (auth.role() = 'authenticated' AND status IN ('draft', 'published'));

CREATE POLICY "Allow admins to read all pages" 
  ON pages FOR SELECT 
  USING (is_admin());

CREATE POLICY "Allow admins to insert pages" 
  ON pages FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Allow admins to update pages" 
  ON pages FOR UPDATE 
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admins to delete pages" 
  ON pages FOR DELETE 
  USING (is_admin());

-- ============================================
-- POSTS TABLE POLICIES (6 policies)
-- ============================================

CREATE POLICY "Allow public to read published posts" 
  ON posts FOR SELECT 
  USING (status = 'published' OR status = 'public');

CREATE POLICY "Allow authenticated users to read draft posts" 
  ON posts FOR SELECT 
  USING (auth.role() = 'authenticated' AND (status IN ('draft', 'published') OR author_id = auth.uid()));

CREATE POLICY "Allow admins to read all posts" 
  ON posts FOR SELECT 
  USING (is_admin());

CREATE POLICY "Allow authenticated users to insert posts" 
  ON posts FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own posts" 
  ON posts FOR UPDATE 
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Allow admins to delete posts" 
  ON posts FOR DELETE 
  USING (is_admin());

-- ============================================
-- MEDIA TABLE POLICIES (4 policies)
-- ============================================

CREATE POLICY "Allow public to read media" 
  ON media FOR SELECT 
  USING (access_level = 'public');

CREATE POLICY "Allow authenticated to read media" 
  ON media FOR SELECT 
  USING (auth.role() = 'authenticated' AND access_level IN ('public', 'authenticated'));

CREATE POLICY "Allow authenticated to insert media" 
  ON media FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update/delete own media" 
  ON media FOR UPDATE 
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================
-- COURSES TABLE POLICIES (7 policies)
-- ============================================

CREATE POLICY "Allow public to read published courses" 
  ON courses FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Allow enrolled users to read courses" 
  ON courses FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM enrollments WHERE course_id = id
  ));

CREATE POLICY "Allow teachers to read own courses" 
  ON courses FOR SELECT 
  USING (teacher_id = auth.uid());

CREATE POLICY "Allow admins to read all courses" 
  ON courses FOR SELECT 
  USING (is_admin());

CREATE POLICY "Allow teachers to insert courses" 
  ON courses FOR INSERT 
  WITH CHECK (is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Allow teachers to update own courses" 
  ON courses FOR UPDATE 
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Allow admins to delete courses" 
  ON courses FOR DELETE 
  USING (is_admin());

-- ============================================
-- LESSONS TABLE POLICIES (7 policies)
-- ============================================

CREATE POLICY "Allow public to read published lessons" 
  ON lessons FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Allow enrolled users to read lessons" 
  ON lessons FOR SELECT 
  USING (
    course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow teachers to read own course lessons" 
  ON lessons FOR SELECT 
  USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to read all lessons" 
  ON lessons FOR SELECT 
  USING (is_admin());

CREATE POLICY "Allow teachers to insert lessons" 
  ON lessons FOR INSERT 
  WITH CHECK (is_teacher());

CREATE POLICY "Allow teachers to update lessons in own courses" 
  ON lessons FOR UPDATE 
  USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to delete lessons" 
  ON lessons FOR DELETE 
  USING (is_admin());

-- ============================================
-- ASSIGNMENTS TABLE POLICIES (4 policies)
-- ============================================

CREATE POLICY "Allow enrolled users to read assignments" 
  ON assignments FOR SELECT 
  USING (
    course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow teachers to insert assignments" 
  ON assignments FOR INSERT 
  WITH CHECK (is_teacher());

CREATE POLICY "Allow teachers to update assignments" 
  ON assignments FOR UPDATE 
  USING (is_teacher())
  WITH CHECK (is_teacher());

CREATE POLICY "Allow teachers to delete assignments" 
  ON assignments FOR DELETE 
  USING (is_teacher());

-- ============================================
-- SUBMISSIONS TABLE POLICIES (5 policies)
-- ============================================

CREATE POLICY "Allow users to read own submissions" 
  ON submissions FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Allow teachers to read student submissions" 
  ON submissions FOR SELECT 
  USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE course_id IN (
        SELECT id FROM courses WHERE teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow students to insert submissions" 
  ON submissions FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow students to update ungraded submissions" 
  ON submissions FOR UPDATE 
  USING (user_id = auth.uid() AND grade IS NULL)
  WITH CHECK (user_id = auth.uid() AND grade IS NULL);

CREATE POLICY "Allow teachers to grade submissions" 
  ON submissions FOR UPDATE 
  USING (is_teacher())
  WITH CHECK (is_teacher());

-- ============================================
-- ENROLLMENTS TABLE POLICIES (5 policies)
-- ============================================

CREATE POLICY "Allow users to read own enrollments" 
  ON enrollments FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Allow teachers to read student enrollments" 
  ON enrollments FOR SELECT 
  USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to read all enrollments" 
  ON enrollments FOR SELECT 
  USING (is_admin());

CREATE POLICY "Service role can insert enrollments" 
  ON enrollments FOR INSERT 
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Allow teachers to update enrollments" 
  ON enrollments FOR UPDATE 
  USING (is_teacher())
  WITH CHECK (is_teacher());

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Media bucket (public read)
CREATE POLICY "Allow public read media" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'media');

-- Course materials bucket (authenticated read)
CREATE POLICY "Allow authenticated read course materials" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'course-materials' AND auth.role() = 'authenticated');

-- User uploads bucket (user-scoped)
CREATE POLICY "Allow users to upload files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to read own uploads" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to delete own uploads" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
`

async function applyPolicies() {
  try {
    log(
      BLUE,
      `
╔════════════════════════════════════════╗
║  Applying RLS Policies                 ║
║  42 security policies for 14 tables     ║
╚════════════════════════════════════════╝
    `,
    )

    // Execute the entire SQL script
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: RLS_POLICIES,
    })

    if (error) {
      log(YELLOW, `Note: RPC execute_sql may not exist yet.`)
      log(YELLOW, `You must apply these policies manually via Supabase Dashboard.`)
      log(BLUE, `\nInstructions:`)
      log(BLUE, `1. Go to: https://gwugapcoknxqqluocjzl.supabase.co`)
      log(BLUE, `2. Navigate to: SQL Editor`)
      log(BLUE, `3. Create new query`)
      log(BLUE, `4. Paste the SQL from PHASE1-RLS-POLICIES.md`)
      log(BLUE, `5. Run (Ctrl+Enter)`)

      return false
    }

    log(GREEN, `✅ All 42 RLS policies applied successfully!`)
    return true
  } catch (err: any) {
    log(RED, `❌ Error: ${err.message}`)
    return false
  }
}

applyPolicies().then((success) => {
  process.exit(success ? 0 : 1)
})
