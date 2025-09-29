-- Create indexes for better performance (without user_permissions references)
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_batches_gurukul_id ON public.batches(gurukul_id);
CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON public.batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_active ON public.batches(is_active);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON public.batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student_id ON public.batch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_active ON public.batch_students(is_active);

-- Only add batch_courses indexes if you decide to create that table
-- CREATE INDEX IF NOT EXISTS idx_batch_courses_batch_id ON public.batch_courses(batch_id);
-- CREATE INDEX IF NOT EXISTS idx_batch_courses_course_id ON public.batch_courses(course_id);
-- CREATE INDEX IF NOT EXISTS idx_batch_courses_active ON public.batch_courses(is_active);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batch_students_updated_at BEFORE UPDATE ON public.batch_students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only add batch_courses trigger if you create that table
-- CREATE TRIGGER update_batch_courses_updated_at BEFORE UPDATE ON public.batch_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default batch management permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
('Batch Management - Create', 'Create new batches', 'batches', 'create'),
('Batch Management - Read', 'View batch information', 'batches', 'read'),
('Batch Management - Update', 'Update batch information', 'batches', 'update'),
('Batch Management - Delete', 'Delete batches', 'batches', 'delete'),
('Student Assignment - Create', 'Assign students to batches', 'batch_students', 'create'),
('Student Assignment - Read', 'View student assignments', 'batch_students', 'read'),
('Student Assignment - Update', 'Update student assignments', 'batch_students', 'update'),
('Student Assignment - Delete', 'Remove student assignments', 'batch_students', 'delete')
ON CONFLICT (name) DO NOTHING;