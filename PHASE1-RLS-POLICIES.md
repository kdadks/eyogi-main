# Phase 1: Row-Level Security (RLS) Policies

**Status**: Implementation Ready  
**Date**: 2026-06-15  
**Project**: gwugapcoknxqqluocjzl.supabase.co

---

## RLS Overview

**RLS** = Row-Level Security  
**Purpose**: Ensure users can ONLY access data they're authorized for

### Three Levels of Security
1. **Authentication**: Is user logged in? (Supabase Auth)
2. **Authorization**: What role does user have? (users.role)
3. **Row-Level**: Which specific rows can user access? (RLS policies)

---

## Implementation Steps

### Step 1: Set Schema and Enable RLS on All Tables

Run this SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- Set search path to gurukul_main schema
SET search_path = 'gurukul_main';

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Helper Function for Role Checking

```sql
-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM gurukul_main.users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'public');
END;
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_user_role() = 'admin';
END;
$$;

-- Helper function to check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_user_role() IN ('teacher', 'admin');
END;
$$;
```

---

## RLS Policies by Table

### 1. Users Table

```sql
-- Policy: Users can read their own profile
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all users
CREATE POLICY users_read_admin ON users
  FOR SELECT
  USING (is_admin());

-- Policy: Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- Policy: Only admins can update user roles/status
CREATE POLICY users_update_admin ON users
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy: Only admins can delete users
CREATE POLICY users_delete_admin ON users
  FOR DELETE
  USING (is_admin());

-- Policy: Service role can insert (for signup trigger)
CREATE POLICY users_insert_service_role ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

### 2. Pages Table

```sql
-- Policy: Everyone can read published pages
CREATE POLICY pages_read_published ON pages
  FOR SELECT
  USING (status = 'published');

-- Policy: Creators can read their own drafts
CREATE POLICY pages_read_own_draft ON pages
  FOR SELECT
  USING (created_by = auth.uid() AND status = 'draft');

-- Policy: Admins can read all pages
CREATE POLICY pages_read_admin ON pages
  FOR SELECT
  USING (is_admin());

-- Policy: Only admins can create pages
CREATE POLICY pages_insert_admin ON pages
  FOR INSERT
  WITH CHECK (is_admin() AND created_by = auth.uid());

-- Policy: Only admins can update pages
CREATE POLICY pages_update_admin ON pages
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy: Only admins can delete pages
CREATE POLICY pages_delete_admin ON pages
  FOR DELETE
  USING (is_admin());
```

### 3. Posts Table

```sql
-- Policy: Everyone can read published posts
CREATE POLICY posts_read_published ON posts
  FOR SELECT
  USING (status = 'published');

-- Policy: Creators can read their own drafts
CREATE POLICY posts_read_own_draft ON posts
  FOR SELECT
  USING (created_by = auth.uid() AND status != 'published');

-- Policy: Admins can read all posts
CREATE POLICY posts_read_admin ON posts
  FOR SELECT
  USING (is_admin());

-- Policy: Only admins can create posts
CREATE POLICY posts_insert_admin ON posts
  FOR INSERT
  WITH CHECK (is_admin() AND created_by = auth.uid());

-- Policy: Admins or creators can update own posts
CREATE POLICY posts_update ON posts
  FOR UPDATE
  USING (is_admin() OR created_by = auth.uid())
  WITH CHECK (is_admin() OR created_by = auth.uid());

-- Policy: Only admins can delete posts
CREATE POLICY posts_delete_admin ON posts
  FOR DELETE
  USING (is_admin());
```

### 4. Media Table

```sql
-- Policy: Everyone can read all media
CREATE POLICY media_read_all ON media
  FOR SELECT
  USING (true);

-- Policy: Any authenticated user can insert media
CREATE POLICY media_insert_auth ON media
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND uploaded_by = auth.uid());

-- Policy: Users can update their own media
CREATE POLICY media_update_own ON media
  FOR UPDATE
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own media
CREATE POLICY media_delete_own ON media
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- Policy: Admins can delete any media
CREATE POLICY media_delete_admin ON media
  FOR DELETE
  USING (is_admin());
```

### 5. Courses Table

```sql
-- Policy: Everyone can read published courses
CREATE POLICY courses_read_published ON courses
  FOR SELECT
  USING (status = 'published');

-- Policy: Teachers can read their own drafts
CREATE POLICY courses_read_own_draft ON courses
  FOR SELECT
  USING (instructor_id = auth.uid());

-- Policy: Admins can read all courses
CREATE POLICY courses_read_admin ON courses
  FOR SELECT
  USING (is_admin());

-- Policy: Enrolled students can see enrolled courses
CREATE POLICY courses_read_enrolled ON courses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = courses.id
      AND enrollments.student_id = auth.uid()
      AND enrollments.status IN ('enrolled', 'completed')
    )
  );

-- Policy: Only teachers can create courses
CREATE POLICY courses_insert_teacher ON courses
  FOR INSERT
  WITH CHECK (is_teacher() AND instructor_id = auth.uid());

-- Policy: Teachers can update their own courses
CREATE POLICY courses_update ON courses
  FOR UPDATE
  USING (instructor_id = auth.uid() OR is_admin())
  WITH CHECK (instructor_id = auth.uid() OR is_admin());

-- Policy: Only admins can delete courses
CREATE POLICY courses_delete_admin ON courses
  FOR DELETE
  USING (is_admin());
```

### 6. Lessons Table

```sql
-- Policy: Everyone can read lessons from published courses
CREATE POLICY lessons_read_published ON lessons
  FOR SELECT
  USING (
    lessons.status = 'published'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.status = 'published'
    )
  );

-- Policy: Teachers can read lessons from their courses
CREATE POLICY lessons_read_own ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Enrolled students can read lessons
CREATE POLICY lessons_read_enrolled ON lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN enrollments ON courses.id = enrollments.course_id
      WHERE courses.id = lessons.course_id
      AND enrollments.student_id = auth.uid()
    )
  );

-- Policy: Teachers can insert lessons in own courses
CREATE POLICY lessons_insert ON lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Teachers can update lessons in own courses
CREATE POLICY lessons_update ON lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Teachers can delete lessons
CREATE POLICY lessons_delete ON lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );
```

### 7. Assignments Table

```sql
-- Policy: Students can read assignments for enrolled courses
CREATE POLICY assignments_read ON assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      JOIN enrollments ON enrollments.course_id = courses.id
      WHERE lessons.id = assignments.lesson_id
      AND enrollments.student_id = auth.uid()
    )
  );

-- Policy: Teachers can create assignments
CREATE POLICY assignments_insert ON assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = assignments.lesson_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Teachers can update assignments
CREATE POLICY assignments_update ON assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = assignments.lesson_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Teachers can delete assignments
CREATE POLICY assignments_delete ON assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = assignments.lesson_id
      AND courses.instructor_id = auth.uid()
    )
  );
```

### 8. Submissions Table

```sql
-- Policy: Students can read their own submissions
CREATE POLICY submissions_read_own ON submissions
  FOR SELECT
  USING (student_id = auth.uid());

-- Policy: Teachers can read submissions for their assignments
CREATE POLICY submissions_read_teacher ON submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      JOIN lessons ON lessons.id = assignments.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE assignments.id = submissions.assignment_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Students can create submissions
CREATE POLICY submissions_insert ON submissions
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Policy: Students can update ungraded submissions
CREATE POLICY submissions_update_own ON submissions
  FOR UPDATE
  USING (
    student_id = auth.uid()
    AND (status != 'graded' OR auth.role() = 'service_role')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND (status != 'graded' OR auth.role() = 'service_role')
  );

-- Policy: Teachers can update to add grades/feedback
CREATE POLICY submissions_update_teacher ON submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      JOIN lessons ON lessons.id = assignments.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE assignments.id = submissions.assignment_id
      AND courses.instructor_id = auth.uid()
    )
  );
```

### 9. Enrollments Table

```sql
-- Policy: Students can read their own enrollments
CREATE POLICY enrollments_read_own ON enrollments
  FOR SELECT
  USING (student_id = auth.uid());

-- Policy: Teachers can read enrollments for their courses
CREATE POLICY enrollments_read_teacher ON enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Policy: Admins can read all enrollments
CREATE POLICY enrollments_read_admin ON enrollments
  FOR SELECT
  USING (is_admin());

-- Policy: Only service role can create enrollments (via backend)
CREATE POLICY enrollments_insert ON enrollments
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Teachers can update enrollments in own courses
CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );
```

### 10. Storage Objects (Files)

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public read for media bucket
CREATE POLICY media_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- Policy: Authenticated read for course-materials
CREATE POLICY course_materials_auth_read ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'course-materials'
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can upload to own directory in user-uploads
CREATE POLICY user_uploads_upload ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read own files in user-uploads
CREATE POLICY user_uploads_read ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete own files
CREATE POLICY user_uploads_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Testing RLS Policies

### Test as Anonymous User
```sql
-- This should fail (no auth)
SELECT * FROM courses WHERE status = 'published';
-- Result: Should return 0 rows or fail
```

### Test as Authenticated User
```sql
-- Set JWT token in Supabase SQL Editor
-- Then test queries

-- Should work (published courses)
SELECT * FROM courses WHERE status = 'published';

-- Should fail (private courses)
SELECT * FROM courses WHERE status = 'draft' AND instructor_id != auth.uid();
```

### Test as Admin
```sql
-- Admin should see all courses
SELECT * FROM courses;
-- Result: All courses visible
```

---

## Troubleshooting RLS

### Issue: "Row-level security violation" error
**Check**:
1. RLS enabled on table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. At least one policy exists for the action (SELECT, INSERT, UPDATE, DELETE)
3. User matches policy conditions
4. JWT token valid and decoded correctly

### Issue: No policies are working
**Check**:
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` was executed
2. No "FOR ALL USING (...)" policies that allow everything
3. Auth user ID is correct

### Issue: Admin can't see anything
**Check**:
1. Admin policy uses `is_admin()` function
2. User role in database is "admin"
3. Admin policies come AFTER user-specific policies

---

## Security Best Practices

✅ **DO**:
- Create specific policies for each role
- Use `WITH CHECK` clause to prevent unauthorized updates
- Test policies as different user types
- Log policy violations
- Review policies quarterly

❌ **DON'T**:
- Create overly permissive policies
- Use `USING (true)` except for public data
- Skip `WITH CHECK` in UPDATE policies
- Allow users to modify their own role
- Expose service role key to client

---

## Phase 1 Completion

After RLS policies configured:
1. ✅ Environment variables set
2. ✅ Authentication configured
3. ✅ Storage buckets created
4. ✅ RLS policies created
5. ⏭️ **Next**: Phase 1 Completion Checklist

---

## Files in Phase 1

- PHASE1-ENV-TEMPLATE.md
- PHASE1-AUTH-SETUP.md
- PHASE1-STORAGE-SETUP.md
- **PHASE1-RLS-POLICIES.md** ← You are here
- PHASE1-CHECKLIST.md
