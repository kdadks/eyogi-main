-- SSH University Certificate Management Database Update
-- Run this SQL script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql

-- ========================================
-- Add Certificate Columns to Enrollments Table
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

-- ========================================
-- Set Default Values for Existing Records
-- ========================================

-- Update existing completed enrollments to have certificate_issued = false
-- (This ensures all existing records have a proper value)
UPDATE enrollments 
SET certificate_issued = FALSE 
WHERE certificate_issued IS NULL;

-- ========================================
-- Create Certificate Assignments Table (if needed)
-- ========================================

-- This table manages which certificate templates are assigned to courses/gurukuls
-- First, drop the table if it exists with issues, then recreate it properly
DROP TABLE IF EXISTS certificate_assignments CASCADE;

CREATE TABLE certificate_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES certificate_templates(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('gurukul', 'course')),
    gurukul_id UUID REFERENCES gurukuls(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    -- Ensure either gurukul_id or course_id is set, but not both
    CONSTRAINT certificate_assignment_type_check 
    CHECK (
        (assignment_type = 'gurukul' AND gurukul_id IS NOT NULL AND course_id IS NULL) OR
        (assignment_type = 'course' AND course_id IS NOT NULL AND gurukul_id IS NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX idx_certificate_assignments_template_id ON certificate_assignments(template_id);
CREATE INDEX idx_certificate_assignments_gurukul_id ON certificate_assignments(gurukul_id);
CREATE INDEX idx_certificate_assignments_course_id ON certificate_assignments(course_id);
CREATE INDEX idx_certificate_assignments_assignment_type ON certificate_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_enrollments_certificate_issued ON enrollments(certificate_issued);

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================

-- Enable RLS on certificate_assignments table
ALTER TABLE certificate_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can do everything
CREATE POLICY "Super admins can manage certificate assignments" ON certificate_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Policy: Teachers can view assignments for their courses
CREATE POLICY "Teachers can view their course certificate assignments" ON certificate_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'teacher'
            AND (
                -- For gurukul assignments, check if teacher teaches any course in that gurukul
                (certificate_assignments.assignment_type = 'gurukul' AND EXISTS (
                    SELECT 1 FROM course_assignments ca
                    JOIN courses c ON ca.course_id = c.id
                    WHERE ca.teacher_id = profiles.id 
                    AND c.gurukul_id = certificate_assignments.gurukul_id
                )) OR
                -- For course assignments, check if teacher teaches that specific course
                (certificate_assignments.assignment_type = 'course' AND EXISTS (
                    SELECT 1 FROM course_assignments ca
                    WHERE ca.teacher_id = profiles.id 
                    AND ca.course_id = certificate_assignments.course_id
                ))
            )
        )
    );

-- ========================================
-- Verification
-- ========================================

-- Query to verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND column_name IN ('certificate_issued', 'certificate_url', 'certificate_issued_at')
ORDER BY column_name;

-- Count enrollments by certificate status
SELECT 
    certificate_issued,
    COUNT(*) as count
FROM enrollments 
GROUP BY certificate_issued;

COMMENT ON COLUMN enrollments.certificate_issued IS 'Boolean flag indicating if a certificate has been issued for this enrollment';
COMMENT ON COLUMN enrollments.certificate_url IS 'URL to the generated certificate PDF file';
COMMENT ON COLUMN enrollments.certificate_issued_at IS 'Timestamp when the certificate was issued';