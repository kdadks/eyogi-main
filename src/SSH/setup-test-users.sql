-- Add password_hash column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create test users for website authentication
-- Note: Password for all test users is '123456' 
-- Hash generated using SHA-256: e3afed0047b08059d0fada10f400c1e5903edfa5da1e86a18e0ed4d6cf1e60e8

-- Test Student
INSERT INTO profiles (id, email, full_name, password_hash, role, status, student_id, preferences, created_at, updated_at)
VALUES (
  'student-test-001',
  'student@test.com',
  'Test Student',
  'e3afed0047b08059d0fada10f400c1e5903edfa5da1e86a18e0ed4d6cf1e60e8',
  'student',
  'active',
  'STU001',
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Test Teacher
INSERT INTO profiles (id, email, full_name, password_hash, role, status, preferences, created_at, updated_at)
VALUES (
  'teacher-test-001',
  'teacher@test.com',
  'Test Teacher',
  'e3afed0047b08059d0fada10f400c1e5903edfa5da1e86a18e0ed4d6cf1e60e8',
  'teacher',
  'active',
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Test Admin
INSERT INTO profiles (id, email, full_name, password_hash, role, status, preferences, created_at, updated_at)
VALUES (
  'admin-test-001',
  'admin@test.com',
  'Test Admin',
  'e3afed0047b08059d0fada10f400c1e5903edfa5da1e86a18e0ed4d6cf1e60e8',
  'admin',
  'active',
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();