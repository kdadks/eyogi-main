-- Fix user_role ENUM to include business_admin
-- This handles the PostgreSQL ENUM type properly

BEGIN;

-- Add business_admin to the user_role enum type
-- In PostgreSQL, you can add values to an enum but cannot remove them easily
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'business_admin';

-- Verify the enum now includes business_admin
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid
  FROM pg_type
  WHERE typname = 'user_role'
)
ORDER BY enumsortorder;

COMMIT;

SELECT 'ENUM user_role updated successfully' as status;