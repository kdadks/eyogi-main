-- Migration: Fix profiles table to support website users without Supabase Auth
-- This allows both Supabase Auth users and website users to coexist
-- Run this in your Supabase SQL Editor

-- Step 1: Remove the foreign key constraint to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Modify the id column to allow any UUID (not just auth.users UUIDs)
-- The column is already UUID PRIMARY KEY, so we just need to add a default
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Step 3: Drop existing RLS policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public signup for website users" ON public.profiles;
DROP POLICY IF EXISTS "Allow super admin signup" ON public.profiles;

-- Step 4: Create new RLS policies for both auth types

-- Allow public signup for website users (with password_hash)
CREATE POLICY "Enable insert for website users" ON public.profiles
  FOR INSERT WITH CHECK (password_hash IS NOT NULL);

-- Allow super admin users (from Supabase Auth) to be created
CREATE POLICY "Enable insert for auth users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile data
CREATE POLICY "Enable read for own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    (password_hash IS NOT NULL)
  );

-- Allow users to update their own profile data
CREATE POLICY "Enable update for own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (password_hash IS NOT NULL)
  );

-- Allow service role to manage all profiles (for website user authentication)
CREATE POLICY "Enable all for service role" ON public.profiles
  FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Step 5: Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_profiles_website_auth ON public.profiles(email, password_hash) 
  WHERE password_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_auth_users ON public.profiles(id) 
  WHERE password_hash IS NULL;

-- Step 6: Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verification query (run this after the migration to check)
-- SELECT 
--   constraint_name, 
--   constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'profiles' AND table_schema = 'public';