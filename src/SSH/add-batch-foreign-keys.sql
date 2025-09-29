-- Add missing foreign key constraints for batch management system
-- Run this after creating the tables to establish relationships with profiles table

-- Add foreign key for batches.teacher_id -> profiles.id (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'batches_teacher_id_fkey'
        AND table_name = 'batches'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.batches
        ADD CONSTRAINT batches_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key for batches.created_by -> profiles.id (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'batches_created_by_fkey'
        AND table_name = 'batches'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.batches
        ADD CONSTRAINT batches_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for user_permissions tables (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_permissions' AND table_schema = 'public') THEN
        -- Add foreign key for user_permissions.user_id -> profiles.id (only if not exists)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_permissions_user_id_fkey'
            AND table_name = 'user_permissions'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.user_permissions
            ADD CONSTRAINT user_permissions_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;

        -- Add foreign key for user_permissions.granted_by -> profiles.id (only if not exists)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_permissions_granted_by_fkey'
            AND table_name = 'user_permissions'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.user_permissions
            ADD CONSTRAINT user_permissions_granted_by_fkey
            FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Add foreign key for batch_students.assigned_by -> profiles.id (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'batch_students_assigned_by_fkey'
        AND table_name = 'batch_students'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.batch_students
        ADD CONSTRAINT batch_students_assigned_by_fkey
        FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for batch_courses.course_id -> courses.id (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'batch_courses_course_id_fkey'
        AND table_name = 'batch_courses'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.batch_courses
        ADD CONSTRAINT batch_courses_course_id_fkey
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for batch_courses.assigned_by -> profiles.id (if table exists and constraint doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_courses' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'batch_courses_assigned_by_fkey'
            AND table_name = 'batch_courses'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.batch_courses
            ADD CONSTRAINT batch_courses_assigned_by_fkey
            FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;