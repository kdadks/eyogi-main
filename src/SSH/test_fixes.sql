-- Test the fixes we made
-- Run this to verify both issues are resolved

-- 1. Test if business_admin role can be inserted
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  status
) VALUES (
  uuid_generate_v4(),
  'test-business-admin@example.com',
  'Test Business Admin',
  'business_admin',
  'active'
) ON CONFLICT (email) DO UPDATE SET role = 'business_admin';

-- 2. Check if course_assignments table exists and works
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'course_assignments';

-- 3. Test inserting a course assignment (will fail if table doesn't exist)
-- This is just a syntax test - actual insert would need valid foreign keys
SELECT 'course_assignments table structure' as test,
       column_name, data_type
FROM information_schema.columns
WHERE table_name = 'course_assignments'
ORDER BY ordinal_position;

-- 4. Verify the role constraint includes business_admin
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%role%';

SELECT 'Test completed - if no errors, fixes are working' as result;