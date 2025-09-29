-- Batch Management System Schema - Fixed Version
-- This file contains the SQL commands to create the batch management tables
-- with better error handling

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create user_permissions table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.permissions(id),
    granted_by UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Create batches table - ensure it has is_active column
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    gurukul_id UUID NOT NULL REFERENCES public.gurukuls(id),
    teacher_id UUID,
    start_date DATE,
    end_date DATE,
    max_students INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'archived')),
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_active column to batches table if it doesn't exist (safety check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'batches'
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.batches ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create batch_students table (many-to-many relationship between batches and students)
CREATE TABLE IF NOT EXISTS public.batch_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, student_id)
);

-- Create batch_courses table (many-to-many relationship between batches and courses)
CREATE TABLE IF NOT EXISTS public.batch_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id),
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON public.permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON public.user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON public.user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_batches_gurukul_id ON public.batches(gurukul_id);
CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON public.batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_active ON public.batches(is_active);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student_id ON public.batch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_active ON public.batch_students(is_active);
CREATE INDEX IF NOT EXISTS idx_batch_courses_batch_id ON public.batch_courses(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_courses_course_id ON public.batch_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_batch_courses_active ON public.batch_courses(is_active);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batch_students_updated_at BEFORE UPDATE ON public.batch_students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batch_courses_updated_at BEFORE UPDATE ON public.batch_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default batch management permissions only if we have admin users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Try to find an admin or super_admin user
    SELECT id INTO admin_user_id
    FROM public.profiles
    WHERE role IN ('admin', 'super_admin')
    LIMIT 1;

    -- Only insert permissions if we found an admin user
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.permissions (name, description, resource, action, created_by) VALUES
        ('Batch Management - Create', 'Create new batches', 'batches', 'create', admin_user_id),
        ('Batch Management - Read', 'View batch information', 'batches', 'read', admin_user_id),
        ('Batch Management - Update', 'Update batch information', 'batches', 'update', admin_user_id),
        ('Batch Management - Delete', 'Delete batches', 'batches', 'delete', admin_user_id),
        ('Student Assignment - Create', 'Assign students to batches', 'batch_students', 'create', admin_user_id),
        ('Student Assignment - Read', 'View student assignments', 'batch_students', 'read', admin_user_id),
        ('Student Assignment - Update', 'Update student assignments', 'batch_students', 'update', admin_user_id),
        ('Student Assignment - Delete', 'Remove student assignments', 'batch_students', 'delete', admin_user_id),
        ('Course Assignment - Create', 'Assign courses to batches', 'batch_courses', 'create', admin_user_id),
        ('Course Assignment - Read', 'View course assignments', 'batch_courses', 'read', admin_user_id),
        ('Course Assignment - Update', 'Update course assignments', 'batch_courses', 'update', admin_user_id),
        ('Course Assignment - Delete', 'Remove course assignments', 'batch_courses', 'delete', admin_user_id)
        ON CONFLICT (resource, action) DO NOTHING;
    ELSE
        RAISE NOTICE 'No admin users found. Please create an admin user first and re-run the permissions insert.';
    END IF;
END $$;