-- Role System Enhancement Migration
-- This script adds Business Admin role and course assignment functionality

-- 1. Add business_admin role to profiles table enum (if using enum)
-- Note: This might require table recreation depending on your database setup
-- For PostgreSQL with custom enum type:
-- ALTER TYPE user_role ADD VALUE 'business_admin';

-- Or if using check constraint, update it:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('student', 'teacher', 'admin', 'business_admin', 'super_admin', 'parent'));

-- 2. Create course_assignments table
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

-- 5. Create RLS policies
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

-- 6. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_course_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_assignments_updated_at
  BEFORE UPDATE ON course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_assignments_updated_at();

-- 7. Update profiles table to include business_admin in role enum if needed
-- This depends on your current table structure.
-- If you're using string type, no change needed.
-- If using enum, you might need to recreate or alter.

-- 8. Create some sample business admin users (optional - for testing)
-- Note: Adjust the IDs and details as needed for your system
/*
INSERT INTO profiles (
  id,
  email,
  password_hash,
  full_name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'businessadmin@eyogi.com',
  '$2a$10$example_hash_here', -- Use proper password hashing
  'Business Administrator',
  'business_admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
*/

-- 9. Grant necessary permissions to application roles
-- Adjust based on your database user setup
-- GRANT SELECT, INSERT, UPDATE, DELETE ON course_assignments TO your_app_user;
-- GRANT USAGE ON SEQUENCE course_assignments_id_seq TO your_app_user;

-- 10. Verify the migration
-- SELECT 'Migration completed successfully' as status;

COMMIT;