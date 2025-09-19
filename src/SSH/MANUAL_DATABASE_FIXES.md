# Manual Database Fixes

Run these SQL commands in your Supabase SQL Editor in this exact order:

## Step 1: Fix the user_role ENUM

```sql
-- Add business_admin to the user_role enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'business_admin';

-- Verify the enum was updated
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid
  FROM pg_type
  WHERE typname = 'user_role'
)
ORDER BY enumsortorder;
```

## Step 2: Create course_assignments table

```sql
-- Create course_assignments table
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
```

## Step 3: Create indexes and RLS policies

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_assignments_teacher_id ON course_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_active ON course_assignments(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all course assignments" ON course_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'business_admin', 'super_admin')
    )
  );

CREATE POLICY "Teachers can view their own assignments" ON course_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.teacher_id = course_assignments.teacher_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage course assignments" ON course_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'business_admin', 'super_admin')
    )
  );
```

## Step 4: Create trigger for updated_at

```sql
-- Create trigger for updated_at
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
```

## Step 5: Test the fixes

```sql
-- Test that business_admin role works
SELECT 'business_admin' as test_role;

-- Check course_assignments table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'course_assignments';
```

After running these commands:
1. The business_admin role error should be fixed
2. The course_assignments table will be created
3. Try updating a user's role to "Business Admin" in the admin interface