/*
  # eYogi Gurukul Initial Schema

  1. New Tables
    - `profiles` - User profiles with role-based information
    - `gurukuls` - Different Gurukul types (Hinduism, Mantra, Philosophy, etc.)
    - `courses` - Course catalog with detailed information
    - `enrollments` - Student course enrollments with status tracking
    - `certificates` - Digital certificates with verification
    - `certificate_templates` - Template management for certificates

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure student data with proper access controls

  3. Functions
    - Student ID generation function
    - Certificate verification functions
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE course_level AS ENUM ('elementary', 'basic', 'intermediate', 'advanced');
CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE delivery_method AS ENUM ('physical', 'remote', 'hybrid');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'student',
  age integer,
  phone text,
  address text,
  parent_guardian_name text,
  parent_guardian_email text,
  parent_guardian_phone text,
  student_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gurukuls table
CREATE TABLE IF NOT EXISTS gurukuls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gurukul_id uuid REFERENCES gurukuls(id) ON DELETE CASCADE,
  course_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  level course_level NOT NULL,
  age_group_min integer NOT NULL,
  age_group_max integer NOT NULL,
  duration_weeks integer NOT NULL,
  fee decimal(10,2) NOT NULL DEFAULT 0,
  max_students integer DEFAULT 20,
  delivery_method delivery_method DEFAULT 'remote',
  entry_requirements text,
  learning_outcomes text[] DEFAULT '{}',
  syllabus jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  teacher_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  status enrollment_status DEFAULT 'pending',
  enrolled_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  completed_at timestamptz,
  payment_status payment_status DEFAULT 'pending',
  payment_id text,
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Certificate templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('student', 'teacher')) DEFAULT 'student',
  template_data jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  template_id uuid REFERENCES certificate_templates(id),
  issued_at timestamptz DEFAULT now(),
  issued_by uuid REFERENCES profiles(id),
  verification_code text UNIQUE NOT NULL,
  certificate_data jsonb DEFAULT '{}',
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS text AS $$
DECLARE
  current_year text;
  next_number integer;
  student_id text;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::text;
  
  -- Get the next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN student_id ~ ('^EYG-' || current_year || '-[0-9]+$') 
      THEN CAST(SUBSTRING(student_id FROM LENGTH('EYG-' || current_year || '-') + 1) AS integer)
      ELSE 0 
    END
  ), 0) + 1
  INTO next_number
  FROM profiles
  WHERE student_id IS NOT NULL;
  
  student_id := 'EYG-' || current_year || '-' || LPAD(next_number::text, 4, '0');
  
  RETURN student_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate student ID for students
CREATE OR REPLACE FUNCTION assign_student_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.student_id IS NULL THEN
    NEW.student_id := generate_student_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_student_id_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_student_id();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gurukuls_updated_at
  BEFORE UPDATE ON gurukuls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gurukuls ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can read student profiles in their courses"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'student' AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN courses c ON c.teacher_id = p.id
      JOIN enrollments e ON e.course_id = c.id AND e.student_id = profiles.id
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- RLS Policies for gurukuls
CREATE POLICY "Anyone can read active gurukuls"
  ON gurukuls
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage gurukuls"
  ON gurukuls
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for courses
CREATE POLICY "Anyone can read active courses"
  ON courses
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Teachers can read their assigned courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for enrollments
CREATE POLICY "Students can read own enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create own enrollments"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can read enrollments for their courses"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update enrollments for their courses"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all enrollments"
  ON enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for certificates
CREATE POLICY "Students can read own certificates"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can read certificates for their courses"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = certificates.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create certificates for their courses"
  ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = certificates.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all certificates"
  ON certificates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for certificate templates
CREATE POLICY "Anyone can read active certificate templates"
  ON certificate_templates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage certificate templates"
  ON certificate_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_courses_gurukul_id ON courses(gurukul_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);