-- =====================================================
-- eYogi Gurukul Comprehensive Database Schema
-- Phase 1: Foundation Tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE USER MANAGEMENT SYSTEM
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'super_admin', 'parent');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'withdrawn');
CREATE TYPE course_level AS ENUM ('elementary', 'basic', 'intermediate', 'advanced');
CREATE TYPE delivery_method AS ENUM ('physical', 'remote', 'hybrid');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'pending_verification',
    date_of_birth DATE,
    phone VARCHAR(20),
    address JSONB, -- {street, city, state, country, postal_code}
    emergency_contact JSONB, -- {name, phone, relationship}
    preferences JSONB DEFAULT '{}', -- {language, timezone, notifications}
    avatar_url TEXT,
    student_id VARCHAR(50) UNIQUE, -- Format: EYG-YYYY-XXXX
    parent_id UUID REFERENCES public.profiles(id), -- For minors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student ID sequence for auto-generation
CREATE SEQUENCE student_id_seq START 1;

-- Function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    sequence_num INTEGER := nextval('student_id_seq');
    formatted_num VARCHAR(4) := LPAD(sequence_num::TEXT, 4, '0');
BEGIN
    RETURN 'EYG-' || current_year || '-' || formatted_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign student ID on first course enrollment
CREATE OR REPLACE FUNCTION assign_student_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL AND NEW.role = 'student' THEN
        NEW.student_id := generate_student_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_student_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_student_id();

-- =====================================================
-- 2. GURUKUL & COURSE MANAGEMENT
-- =====================================================

-- Gurukuls table
CREATE TABLE public.gurukuls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    cover_image_url TEXT,
    brand_colors JSONB DEFAULT '{}', -- {primary, secondary, accent}
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gurukul_id UUID REFERENCES public.gurukuls(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    course_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., C1001
    description TEXT,
    detailed_description TEXT,
    level course_level NOT NULL,
    age_group_min INTEGER,
    age_group_max INTEGER,
    duration_weeks INTEGER DEFAULT 6,
    duration_hours INTEGER,
    delivery_method delivery_method DEFAULT 'hybrid',
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    max_students INTEGER DEFAULT 20,
    min_students INTEGER DEFAULT 10,
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    includes_certificate BOOLEAN DEFAULT true,
    certificate_template_id UUID,
    image_url TEXT,
    cover_image_url TEXT,
    video_preview_url TEXT,
    syllabus JSONB, -- Detailed class structure
    resources JSONB DEFAULT '[]', -- Links, documents, etc.
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    tags TEXT[],
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course sessions/classes
CREATE TABLE public.course_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB, -- Rich content structure
    resources JSONB DEFAULT '[]',
    homework_assignments JSONB DEFAULT '[]',
    duration_minutes INTEGER DEFAULT 60,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, session_number)
);

-- =====================================================
-- 3. ENROLLMENT & PAYMENT SYSTEM
-- =====================================================

-- Course enrollments
CREATE TABLE public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    status enrollment_status DEFAULT 'pending',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    final_grade VARCHAR(10),
    certificate_issued_at TIMESTAMP WITH TIME ZONE,
    certificate_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50), -- stripe, paypal, bank_transfer
    payment_intent_id VARCHAR(255), -- Stripe payment intent ID
    transaction_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10,2),
    invoice_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CERTIFICATE MANAGEMENT SYSTEM
-- =====================================================

-- Certificate templates
CREATE TABLE public.certificate_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'student', 'teacher', 'completion', 'achievement'
    template_data JSONB NOT NULL, -- Template design configuration
    preview_url TEXT,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issued certificates
CREATE TABLE public.certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.certificate_templates(id),
    teacher_id UUID REFERENCES public.profiles(id),
    title VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    certificate_data JSONB, -- Generated certificate content
    file_url TEXT, -- UploadThing URL for PDF
    verification_code VARCHAR(50) UNIQUE,
    is_verified BOOLEAN DEFAULT true,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    shared_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. CONTENT MANAGEMENT SYSTEM
-- =====================================================

-- Pages table for dynamic content
CREATE TABLE public.pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content JSONB NOT NULL, -- Block-based content structure
    page_type VARCHAR(50) DEFAULT 'page', -- 'page', 'gurukul_home', 'course_landing'
    gurukul_id UUID REFERENCES public.gurukuls(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT false,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    featured_image_url TEXT,
    template VARCHAR(100) DEFAULT 'default',
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    published_by UUID REFERENCES public.profiles(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media library
CREATE TABLE public.media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- 'image', 'video', 'document', 'audio'
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploadthing_url TEXT NOT NULL, -- UploadThing file URL
    uploadthing_key TEXT NOT NULL, -- UploadThing file key
    alt_text TEXT,
    caption TEXT,
    metadata JSONB DEFAULT '{}', -- dimensions, duration, etc.
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ANALYTICS & TRACKING
-- =====================================================

-- User activity tracking
CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'course', 'enrollment', 'certificate', etc.
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page views and engagement
CREATE TABLE public.page_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_path VARCHAR(500) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    referrer TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    country VARCHAR(100),
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ROLES & PERMISSIONS SYSTEM
-- =====================================================

-- Permissions table
CREATE TABLE public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- 'courses', 'students', 'content', etc.
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role permissions mapping
CREATE TABLE public.role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role user_role NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- =====================================================
-- 8. SYSTEM CONFIGURATION
-- =====================================================

-- Site settings
CREATE TABLE public.site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether setting can be accessed by frontend
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- User profile indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Course indexes
CREATE INDEX idx_courses_gurukul_id ON public.courses(gurukul_id);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_courses_is_active ON public.courses(is_active);
CREATE INDEX idx_courses_featured ON public.courses(featured);
CREATE INDEX idx_courses_slug ON public.courses(slug);

-- Enrollment indexes
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_teacher_id ON public.enrollments(teacher_id);

-- Analytics indexes
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX idx_page_analytics_page_path ON public.page_analytics(page_path);
CREATE INDEX idx_page_analytics_created_at ON public.page_analytics(created_at);

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gurukuls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Courses policies
CREATE POLICY "Anyone can read active courses" ON public.courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Teachers and admins can manage courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin', 'super_admin')
        )
    );

-- Enrollments policies
CREATE POLICY "Students can read own enrollments" ON public.enrollments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can read their course enrollments" ON public.enrollments
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Students can create enrollments" ON public.enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- =====================================================
-- 11. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gurukuls_updated_at BEFORE UPDATE ON public.gurukuls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity logging trigger
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        auth.uid(),
        TG_OP || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging to key tables
CREATE TRIGGER log_enrollment_activity AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_certificate_activity AFTER INSERT OR UPDATE OR DELETE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION log_activity();