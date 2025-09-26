-- Add missing parent_guardian_email column to profiles table
-- Run this SQL script in your Supabase SQL Editor if the column doesn't exist

-- Add parent_guardian_email column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS parent_guardian_email TEXT;

-- Optional: Add comment to document the column
COMMENT ON COLUMN profiles.parent_guardian_email IS 'Email address of parent or guardian (for student and parent roles)';

-- Optional: Create an index for better query performance if needed
-- CREATE INDEX IF NOT EXISTS idx_profiles_parent_guardian_email ON profiles(parent_guardian_email);