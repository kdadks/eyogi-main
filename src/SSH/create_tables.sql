-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('student', 'teacher', 'participation', 'completion')) DEFAULT 'student',
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificate_assignments table
CREATE TABLE IF NOT EXISTS certificate_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
  gurukul_id UUID REFERENCES gurukuls(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure at least one of gurukul_id or course_id is set, but both can be null during creation
  CONSTRAINT check_assignment_target CHECK (
    (gurukul_id IS NOT NULL) OR (course_id IS NOT NULL)
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_assignments_template_id ON certificate_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_certificate_assignments_gurukul_id ON certificate_assignments(gurukul_id);
CREATE INDEX IF NOT EXISTS idx_certificate_assignments_course_id ON certificate_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_active ON certificate_templates(is_active);

-- Add updated_at trigger for certificate_templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE
ON certificate_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_assignments_updated_at BEFORE UPDATE
ON certificate_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
