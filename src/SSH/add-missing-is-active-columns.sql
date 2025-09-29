-- Add missing is_active columns to existing tables
-- This should be run BEFORE batch-management-schema.sql

-- Add is_active column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user profile is active';
    END IF;
END $$;

-- Add is_active column to enrollments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'enrollments'
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.enrollments ADD COLUMN is_active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN public.enrollments.is_active IS 'Whether the enrollment is active';
    END IF;
END $$;

-- Add is_active column to certificates table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'certificates'
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.certificates ADD COLUMN is_active BOOLEAN DEFAULT true;
        COMMENT ON COLUMN public.certificates.is_active IS 'Whether the certificate is active';
    END IF;
END $$;

-- Update any existing records to have is_active = true
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
UPDATE public.enrollments SET is_active = true WHERE is_active IS NULL;
UPDATE public.certificates SET is_active = true WHERE is_active IS NULL;