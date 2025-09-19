-- Fix Database Schema: Add business_admin role and course_assignments table
-- Run this script to fix the enum error and create missing table

BEGIN;

-- 1. First, check if we're using an enum type or constraint
-- Drop existing constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint that includes business_admin
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'admin', 'business_admin', 'super_admin', 'parent'));

-- 2. Create course_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id VARCHAR(20) NOT NULL, -- References profiles.teacher_id
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id), -- Admin/Business Admin who made the assignment
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(teacher_id, course_id), -- A teacher can only be assigned to a course once

  -- Foreign key to profiles table via teacher_id
  CONSTRAINT fk_teacher_assignment
    FOREIGN KEY (teacher_id)
    REFERENCES profiles(teacher_id)
    ON DELETE CASCADE
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_assignments_teacher_id ON course_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_active ON course_assignments(is_active);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all course assignments" ON course_assignments;
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON course_assignments;
DROP POLICY IF EXISTS "Admins can manage course assignments" ON course_assignments;

-- 6. Create RLS policies
-- Policy: Allow admins and business_admins to view all assignments
CREATE POLICY "Admins can view all course assignments" ON course_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'business_admin', 'super_admin')
    )
  );

-- Policy: Allow teachers to view their own assignments
CREATE POLICY "Teachers can view their own assignments" ON course_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.teacher_id = course_assignments.teacher_id
      AND profiles.id = auth.uid()
    )
  );

-- Policy: Allow admins and business_admins to create/update assignments
CREATE POLICY "Admins can manage course assignments" ON course_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'business_admin', 'super_admin')
    )
  );

-- 7. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_course_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_course_assignments_updated_at ON course_assignments;
CREATE TRIGGER update_course_assignments_updated_at
  BEFORE UPDATE ON course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_assignments_updated_at();

COMMIT;

-- Verify the changes
SELECT 'Database schema updated successfully' as status;