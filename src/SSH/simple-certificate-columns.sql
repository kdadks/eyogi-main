-- Simple Certificate Columns Update
-- Run this SQL script in your Supabase SQL Editor if you want to add just the essential columns first
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql

-- ========================================
-- Add Certificate Columns to Enrollments Table ONLY
-- ========================================

-- Add certificate_issued boolean column (tracks if certificate has been issued)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT FALSE;

-- Add certificate_url text column (stores the URL to the generated certificate)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Add certificate_issued_at timestamp column (tracks when certificate was issued)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMP WITH TIME ZONE;

-- Add certificate_template_id column (tracks which template was used, nullable for default certificates)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS certificate_template_id UUID;

-- ========================================
-- Set Default Values for Existing Records
-- ========================================

-- Update existing completed enrollments to have certificate_issued = false
-- (This ensures all existing records have a proper value)
UPDATE enrollments 
SET certificate_issued = FALSE 
WHERE certificate_issued IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_certificate_issued ON enrollments(certificate_issued);

-- Add comments for documentation
COMMENT ON COLUMN enrollments.certificate_issued IS 'Boolean flag indicating if a certificate has been issued for this enrollment';
COMMENT ON COLUMN enrollments.certificate_url IS 'URL to the generated certificate PDF file';
COMMENT ON COLUMN enrollments.certificate_issued_at IS 'Timestamp when the certificate was issued';
COMMENT ON COLUMN enrollments.certificate_template_id IS 'ID of the certificate template used for this enrollment';
COMMENT ON COLUMN enrollments.certificate_template_id IS 'ID of the certificate template used for this enrollment';

-- ========================================
-- Verification Query
-- ========================================

-- Query to verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND column_name IN ('certificate_issued', 'certificate_url', 'certificate_issued_at', 'certificate_template_id')
ORDER BY column_name;

-- Count enrollments by certificate status
SELECT 
    CASE 
        WHEN certificate_issued IS NULL THEN 'NULL'
        WHEN certificate_issued = true THEN 'TRUE'
        ELSE 'FALSE'
    END as certificate_status,
    COUNT(*) as count
FROM enrollments 
GROUP BY certificate_issued
ORDER BY certificate_issued;