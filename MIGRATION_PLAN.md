# eYogi Unified Platform Migration Plan
## Merge Main Website + SSH University with Supabase Backend

**Date**: 2026-06-15  
**Status**: Planning Phase  
**Risk Level**: High (Major Architecture Change)

---

## Executive Summary

Merge the main eYogi website and SSH University into a **single unified platform** using:
- **Database**: Supabase (PostgreSQL + RLS)
- **File Storage**: Supabase Storage (replacing UploadThing)
- **Admin CMS**: Custom Supabase-based CMS (replacing Payload CMS)
- **Frontend**: Single Next.js 15 app with integrated SSH University
- **Build**: Unified build process (no separate Vite compilation)

### Key Benefits
✅ Single database (easier sync, real-time updates via Supabase realtime)  
✅ Unified authentication (Supabase Auth for all users)  
✅ Reduced costs (no Payload CMS, no UploadThing, no separate database)  
✅ Better real-time features (Supabase realtime subscriptions)  
✅ Simplified deployment (single Next.js app)  
✅ Row-level security built-in (Supabase RLS policies)  

---

## Part 1: Current Architecture vs. Target Architecture

### Current State (As-Is)
```
┌─────────────────────────────────────────────────────────────┐
│                      eYogi Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Main Website (Next.js 15)         SSH University (Vite)    │
│  ─────────────────────────        ──────────────────────    │
│                                                              │
│  ├─ Payload CMS                   ├─ React SPA              │
│  ├─ JWT Auth                      ├─ Supabase Auth          │
│  ├─ Role-based Access             ├─ Custom RBAC (6 roles)  │
│  ├─ 8 Collections                 ├─ Zustand State Mgmt     │
│  │  └─ Users, Pages, Posts, etc   └─ Supabase realtime      │
│  └─ UploadThing CDN                                         │
│                                                              │
│  Neon PostgreSQL         Supabase PostgreSQL                │
│  (Payload CMS)           (SSH University)                   │
│                                                              │
│  BUILD: yarn build                                          │
│  ├─ Builds Next.js                                         │
│  ├─ Builds Vite app separately                             │
│  └─ Copies SSH dist → public/ssh-app/                      │
│                                                              │
│  DEPLOY: Vercel                                             │
│  ├─ Serves / (Main site)                                   │
│  └─ Serves /ssh-app/ (Static SPA)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Target State (To-Be)
```
┌─────────────────────────────────────────────────────────────┐
│                 eYogi Unified Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│               Single Next.js 15 Application                  │
│               (Main Site + SSH University)                   │
│  ────────────────────────────────────────────────           │
│                                                              │
│  ├─ Frontend Routes                                         │
│  │  ├─ / → Main website (pages, posts, etc)                │
│  │  ├─ /dashboard → Main site admin                        │
│  │  ├─ /ssh-app/* → SSH University (integrated)            │
│  │  └─ /ssh-admin → SSH admin CMS                          │
│  │                                                          │
│  ├─ API Routes (Next.js)                                   │
│  │  ├─ /api/content/* → Pages, posts management            │
│  │  ├─ /api/media/* → File upload/retrieval                │
│  │  ├─ /api/users/* → User management                      │
│  │  ├─ /api/auth/* → Supabase auth wrapper                 │
│  │  └─ /api/ssh/* → SSH University API                     │
│  │                                                          │
│  ├─ Authentication                                         │
│  │  └─ Supabase Auth (JWT)                                │
│  │     └─ For all users (admin, students, teachers)        │
│  │                                                          │
│  ├─ Database Schema (Supabase PostgreSQL)                  │
│  │  ├─ Users table (unified)                               │
│  │  ├─ Pages table (main site content)                     │
│  │  ├─ Posts table (blog posts)                            │
│  │  ├─ Media table (metadata)                              │
│  │  ├─ Courses table (SSH curriculum)                      │
│  │  ├─ Lessons table (course content)                      │
│  │  ├─ Enrollments table (student courses)                 │
│  │  ├─ Assignments table (homework)                        │
│  │  ├─ Submissions table (student work)                    │
│  │  ├─ Forms table (contact forms)                         │
│  │  ├─ Categories table (blog categories)                  │
│  │  ├─ Membership table (subscription data)                │
│  │  ├─ Settings table (global config)                      │
│  │  └─ RLS Policies (multi-tenant security)                │
│  │                                                          │
│  ├─ File Storage (Supabase Storage)                        │
│  │  ├─ /media → Blog, page images & documents              │
│  │  ├─ /course-materials → SSH course files                │
│  │  ├─ /user-uploads → Student assignments                 │
│  │  └─ RLS Policies (user-scoped access)                   │
│  │                                                          │
│  └─ Admin CMS (Custom built)                               │
│     ├─ /dashboard → Main site CMS                          │
│     │  ├─ Pages editor (rich text, SEO)                    │
│     │  ├─ Posts management                                 │
│     │  ├─ Media library                                    │
│     │  ├─ Settings                                         │
│     │  └─ Analytics                                        │
│     │                                                       │
│     └─ /ssh-admin → SSH University CMS                     │
│        ├─ Courses management                               │
│        ├─ Lessons & assignments                            │
│        ├─ Student management                               │
│        ├─ Grading & reports                                │
│        ├─ Teacher management                               │
│        └─ Settings                                         │
│                                                             │
│  Single Supabase Project                                   │
│  ├─ PostgreSQL database (unified schema)                   │
│  ├─ Auth (all user types)                                  │
│  ├─ Storage (all files)                                    │
│  ├─ Realtime subscriptions                                 │
│  └─ RLS policies (security layer)                          │
│                                                             │
│  BUILD: yarn build                                         │
│  └─ Single Next.js build (includes both platforms)         │
│                                                             │
│  DEPLOY: Vercel                                            │
│  └─ Single app serves everything                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 2: Detailed Database Schema Design

### Tables Structure

#### Core Tables
```sql
-- Users (Unified)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'member', 'public')),
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Content Tables (Main Website)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB,  -- Rich text from Lexical
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image_id UUID REFERENCES media(id),
  status TEXT CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB,  -- Rich text from Lexical
  excerpt TEXT,
  featured_image_id UUID REFERENCES media(id),
  category_id UUID REFERENCES categories(id),
  status TEXT CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_path TEXT NOT NULL,  -- Path in Supabase Storage
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- SSH University Tables (Learning Management)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  featured_image_id UUID REFERENCES media(id),
  instructor_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) NOT NULL,
  title TEXT NOT NULL,
  content JSONB,  -- Rich text
  order_index INTEGER,
  status TEXT CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id),
  title TEXT NOT NULL,
  instructions JSONB,
  due_date TIMESTAMP,
  max_score NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES users(id),
  content TEXT,
  submission_date TIMESTAMP DEFAULT now(),
  score NUMERIC(5,2),
  feedback TEXT,
  status TEXT CHECK (status IN ('submitted', 'graded', 'late'))
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  student_id UUID REFERENCES users(id),
  enrollment_date TIMESTAMP DEFAULT now(),
  status TEXT CHECK (status IN ('enrolled', 'completed', 'dropped')),
  progress_percentage NUMERIC(3,2),
  UNIQUE(course_id, student_id)
);

-- Forms & Membership
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  fields JSONB,  -- Form field definitions
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id),
  data JSONB,  -- Submitted form data
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan_type TEXT,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### RLS Policies (Row-Level Security)

```sql
-- Users can read their own profile
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id OR current_user_role() = 'admin');

-- Admins can manage content
CREATE POLICY pages_admin_manage ON pages
  FOR ALL USING (current_user_role() = 'admin');

-- Published posts visible to everyone
CREATE POLICY posts_read_published ON posts
  FOR SELECT USING (status = 'published' OR created_by = auth.uid() OR current_user_role() = 'admin');

-- Students can only view enrolled courses
CREATE POLICY courses_student_view ON courses
  FOR SELECT USING (
    status = 'published' OR 
    instructor_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.course_id = courses.id 
      AND enrollments.student_id = auth.uid()
    ) OR
    current_user_role() = 'admin'
  );

-- Users can only access own submissions
CREATE POLICY submissions_user_own ON submissions
  FOR ALL USING (student_id = auth.uid() OR current_user_role() IN ('admin', 'teacher'));

-- Users can upload to own storage directory
CREATE POLICY storage_user_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read own files
CREATE POLICY storage_user_read ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('media', 'course-materials') OR
    (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)
  );
```

---

## Part 3: Migration Strategy (Phased Approach)

### Phase 1: Foundation Setup (Week 1)
**Goal**: Prepare Supabase infrastructure without touching current system

**Tasks**:
1. **Create new Supabase project**
   - Set up PostgreSQL database
   - Configure Auth settings
   - Create Storage buckets

2. **Set up database schema**
   - Run all CREATE TABLE scripts
   - Configure RLS policies
   - Create indexes for performance

3. **Configure authentication**
   - Enable Supabase Auth providers (Email, Google, GitHub)
   - Set redirect URLs for development/production
   - Create service role key for admin operations

4. **Set up Storage**
   - Create buckets: `media`, `course-materials`, `user-uploads`
   - Configure CORS for your domain
   - Set up RLS policies for storage

**Deliverables**:
- ✅ Supabase project fully configured
- ✅ Database schema ready
- ✅ Storage buckets accessible
- ✅ Auth configured
- ✅ RLS policies active
- ✅ Environment variables documented

**Risk**: Low (isolated infrastructure, current system untouched)

---

### Phase 2: API Layer Development (Week 2-3)
**Goal**: Create new API routes before migrating data

**Tasks**:
1. **Create Next.js API routes**
   ```
   src/app/api/
   ├── auth/          (Supabase auth wrapper)
   ├── content/       (pages, posts management)
   ├── media/         (file upload/retrieval)
   ├── users/         (user management)
   ├── courses/       (SSH courses)
   ├── lessons/       (SSH lessons)
   └── submissions/   (student work)
   ```

2. **Create utility libraries**
   - `src/lib/supabase/client.ts` - Client-side Supabase
   - `src/lib/supabase/server.ts` - Server-side Supabase
   - `src/lib/supabase/auth.ts` - Auth helpers
   - `src/lib/supabase/storage.ts` - File operations
   - `src/lib/rls.ts` - RLS policy helpers

3. **Implement file upload**
   - Create `/api/media/upload` endpoint
   - Handle image optimization
   - Store to Supabase Storage

4. **Create authentication middleware**
   - Session management
   - Role-based access control
   - JWT token validation

**Deliverables**:
- ✅ API routes functional
- ✅ File upload working
- ✅ Auth middleware ready
- ✅ Comprehensive error handling

**Risk**: Medium (testing needed, but not affecting users yet)

---

### Phase 3: Admin CMS Development (Week 3-4)
**Goal**: Build custom CMS for main site + SSH admin panel

**Tasks**:
1. **Main Site Admin CMS** (`/dashboard`)
   - Pages editor with Lexical integration
   - Posts management
   - Media library
   - Categories management
   - Settings panel
   - Analytics dashboard

2. **SSH University Admin** (`/ssh-admin`)
   - Courses management
   - Lessons editor
   - Assignments creation
   - Student management
   - Grading interface
   - Reports & analytics

3. **Shared Components**
   - File uploader
   - Rich text editor (Lexical)
   - Form builder
   - Data table with filters
   - Media picker

**Deliverables**:
- ✅ Full-featured admin CMS
- ✅ Responsive design (desktop/mobile)
- ✅ Real-time updates via Supabase
- ✅ Complete CRUD operations

**Risk**: Medium-High (Complex UI, but still isolated)

---

### Phase 4: Data Migration (Week 4-5)
**Goal**: Migrate all data from old systems to Supabase

**Tasks**:
1. **Export data from Payload CMS**
   ```bash
   # Export Neon database
   pg_dump --data-only > payload_data.sql
   ```

2. **Export data from Supabase (SSH current)**
   ```bash
   # Backup current SSH Supabase
   pg_dump > ssh_data.sql
   ```

3. **Transform and migrate**
   - Create migration scripts (Node.js)
   - Map old schema to new schema
   - Handle data transformations
   - Validate data integrity

4. **Migrate files**
   - Download files from UploadThing
   - Download files from current Supabase Storage
   - Upload to new Supabase Storage

5. **User data consolidation**
   - Merge user tables
   - Create admin users
   - Update enrollments references

**Deliverables**:
- ✅ All data migrated
- ✅ File integrity verified
- ✅ No data loss
- ✅ Migration rollback plan ready

**Risk**: High (Data integrity critical)

---

### Phase 5: Frontend Integration (Week 5-6)
**Goal**: Merge main site + SSH into single Next.js app

**Tasks**:
1. **Reorganize Next.js routes**
   ```
   app/
   ├── (frontend)/
   │  ├── page.tsx           # Homepage
   │  ├── blog/[slug]        # Blog posts
   │  ├── pages/[slug]       # Static pages
   │  ├── about              # About page
   │  └── ...
   ├── (auth)/
   │  ├── login              # Login page
   │  ├── register           # Register page
   │  └── forgot-password    # Password reset
   ├── dashboard/            # Main site admin (Protected)
   │  ├── pages/             # Pages management
   │  ├── posts/             # Posts management
   │  ├── media/             # Media library
   │  └── settings/          # Settings
   ├── ssh-app/              # SSH University (Integrated)
   │  ├── page.tsx           # SSH home
   │  ├── courses/[id]       # Course view
   │  ├── lessons/[id]       # Lesson view
   │  ├── assignments/[id]   # Assignment view
   │  └── dashboard/         # Student dashboard
   ├── ssh-admin/            # SSH Admin Panel (Protected)
   │  ├── courses/           # Course management
   │  ├── lessons/           # Lesson management
   │  ├── students/          # Student management
   │  └── grading/           # Grading interface
   └── api/
      └── [All routes]       # API routes
   ```

2. **Remove Payload CMS dependency**
   - Delete Payload config
   - Remove Payload routes
   - Clean up Payload types

3. **Remove SSH Vite build**
   - Delete `src/SSH/` (old Vite app)
   - Integrate SSH components into Next.js
   - Update build process

4. **Update environment setup**
   - Replace Neon credentials with Supabase
   - Replace UploadThing with Supabase Storage
   - Update auth configuration

**Deliverables**:
- ✅ Single Next.js app structure
- ✅ All routes working
- ✅ No Payload CMS references
- ✅ Clean codebase

**Risk**: High (Major restructuring, extensive testing needed)

---

### Phase 6: Testing & QA (Week 6-7)
**Goal**: Comprehensive testing before go-live

**Tasks**:
1. **Functional testing**
   - All CRUD operations
   - Authentication flows
   - File upload/download
   - Real-time updates

2. **Security testing**
   - RLS policy validation
   - Auth bypass attempts
   - File access controls
   - SQL injection tests

3. **Performance testing**
   - Load testing (API endpoints)
   - Database query optimization
   - File CDN performance
   - Build time optimization

4. **User acceptance testing**
   - Admin users test CMS
   - Teachers test SSH admin
   - Students test learning platform
   - Public users test main site

**Deliverables**:
- ✅ All tests passed
- ✅ Security audit completed
- ✅ Performance baseline established
- ✅ UAT sign-off

**Risk**: Medium (Hidden bugs possible)

---

### Phase 7: Deployment & Go-Live (Week 7-8)
**Goal**: Deploy unified platform to production

**Tasks**:
1. **Production Supabase setup**
   - Create production project
   - Configure domain/SSL
   - Set up automated backups
   - Configure monitoring/alerts

2. **Database production migration**
   - Final data sync
   - Run all migrations
   - Verify data integrity

3. **Vercel deployment**
   - Update environment variables
   - Deploy updated Next.js app
   - Configure production domains
   - Set up monitoring

4. **DNS & redirect setup**
   - Point domain to Vercel
   - Set up 301 redirects (if URLs changed)
   - Configure email/SMTP

5. **Post-launch monitoring**
   - Monitor error rates
   - Check performance metrics
   - Monitor user reports
   - Database backup verification

**Deliverables**:
- ✅ Production live
- ✅ Monitoring active
- ✅ Backup procedures confirmed
- ✅ Rollback plan ready

**Risk**: Critical (Production live)

---

### Phase 8: Cleanup & Optimization (Week 8+)
**Goal**: Clean up old systems and optimize

**Tasks**:
1. **Decommission old systems**
   - Keep Neon database backup (6 months)
   - Delete UploadThing account (keep backup)
   - Archive old Payload CMS config
   - Document decommissioning

2. **Optimize performance**
   - Database query optimization
   - Add caching strategies
   - Optimize images
   - Minify CSS/JS

3. **Documentation**
   - Update deployment docs
   - Update API documentation
   - Create admin training docs
   - Document RLS policies

4. **Team training**
   - Train admins on new CMS
   - Train teachers on SSH admin
   - Document troubleshooting

**Deliverables**:
- ✅ Old systems archived
- ✅ Performance optimized
- ✅ Complete documentation
- ✅ Team trained

**Risk**: Low (Post-launch)

---

## Part 4: Keeping Current Setup Intact

### Strategy: Git Branch Approach

```bash
# Current main branch remains unchanged
git branch -b production/supabase-unified

# All development on new branch
# Current live system continues on main branch
# Can easily switch back if needed

Timeline:
1. Develop on supabase-unified branch (8 weeks)
2. UAT on supabase-unified in staging
3. When ready, merge to main and deploy
4. Keep old branch as backup for rollback
```

### Backup Strategy
```
Week 0: Full backup of current system
├─ Neon database export (pg_dump)
├─ UploadThing files backup
├─ Payload CMS config backup
├─ Git repo (current main branch)
└─ Vercel deployment snapshot

Week 8: Only switch to new system after go-live verification (24h)
```

---

## Part 5: Directory Structure (New)

```
eyogi-unified/
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── page.tsx                 # Homepage
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx            # Blog list
│   │   │   │   └── [slug]/page.tsx     # Blog post
│   │   │   ├── pages/[slug]/page.tsx   # Static pages
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── ...
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── dashboard/                  # Main site admin
│   │   │   ├── layout.tsx             # Admin layout
│   │   │   ├── page.tsx               # Dashboard home
│   │   │   ├── pages/page.tsx         # Pages management
│   │   │   ├── pages/[id]/edit.tsx    # Page editor
│   │   │   ├── posts/page.tsx         # Posts management
│   │   │   ├── posts/[id]/edit.tsx    # Post editor
│   │   │   ├── media/page.tsx         # Media library
│   │   │   ├── categories/page.tsx    # Categories
│   │   │   ├── settings/page.tsx      # Settings
│   │   │   └── analytics/page.tsx     # Analytics
│   │   │
│   │   ├── ssh-app/                   # SSH University
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # SSH home
│   │   │   ├── courses/page.tsx       # Courses list
│   │   │   ├── courses/[id]/
│   │   │   │   ├── page.tsx          # Course view
│   │   │   │   ├── lessons/[lessonId]/page.tsx
│   │   │   │   └── assignments/[assignmentId]/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # Student dashboard
│   │   │   │   ├── my-courses/page.tsx
│   │   │   │   ├── assignments/page.tsx
│   │   │   │   └── grades/page.tsx
│   │   │   └── not-found.tsx
│   │   │
│   │   ├── ssh-admin/                # SSH Admin Panel
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Admin home
│   │   │   ├── courses/page.tsx      # Courses management
│   │   │   ├── courses/[id]/edit.tsx # Course editor
│   │   │   ├── lessons/[id]/edit.tsx # Lesson editor
│   │   │   ├── students/page.tsx     # Student management
│   │   │   ├── grading/page.tsx      # Grading interface
│   │   │   ├── teachers/page.tsx     # Teacher management
│   │   │   ├── reports/page.tsx      # Reports
│   │   │   └── settings/page.tsx     # Settings
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── register/route.ts
│   │       │   └── me/route.ts
│   │       ├── content/
│   │       │   ├── pages/route.ts     # GET/POST
│   │       │   ├── pages/[id]/route.ts # GET/PUT/DELETE
│   │       │   ├── posts/route.ts
│   │       │   ├── posts/[id]/route.ts
│   │       │   ├── categories/route.ts
│   │       │   └── ...
│   │       ├── media/
│   │       │   ├── upload/route.ts
│   │       │   ├── [id]/route.ts
│   │       │   ├── delete/[id]/route.ts
│   │       │   └── ...
│   │       ├── courses/
│   │       │   ├── route.ts           # GET/POST courses
│   │       │   ├── [id]/route.ts      # GET/PUT/DELETE
│   │       │   ├── [id]/lessons/route.ts
│   │       │   ├── [id]/enrollments/route.ts
│   │       │   └── ...
│   │       ├── lessons/
│   │       │   ├── [id]/route.ts
│   │       │   ├── [id]/content/route.ts
│   │       │   └── ...
│   │       ├── assignments/
│   │       │   ├── [id]/route.ts
│   │       │   ├── [id]/submissions/route.ts
│   │       │   └── ...
│   │       ├── submissions/
│   │       │   ├── route.ts           # GET/POST submissions
│   │       │   ├── [id]/route.ts      # GET/PUT (grade)
│   │       │   └── ...
│   │       └── users/
│   │           ├── route.ts           # GET (current user)
│   │           ├── profile/route.ts   # PUT (update profile)
│   │           ├── admin/
│   │           │   ├── route.ts      # GET (admin list)
│   │           │   └── [id]/route.ts # PUT/DELETE
│   │           └── ...
│   │
│   ├── components/
│   │   ├── admin/                     # Shared admin components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Editor/
│   │   │   │   ├── RichTextEditor.tsx    # Lexical integration
│   │   │   │   ├── CodeBlock.tsx
│   │   │   │   └── ...
│   │   │   ├── FormBuilder/
│   │   │   │   ├── FormBuilder.tsx
│   │   │   │   ├── FormField.tsx
│   │   │   │   └── ...
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── DataTableColumnHeader.tsx
│   │   │   │   └── ...
│   │   │   ├── MediaPicker/
│   │   │   │   ├── MediaPicker.tsx
│   │   │   │   ├── MediaLibrary.tsx
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── frontend/                  # Frontend components
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Navigation/
│   │   │   ├── BlogCard/
│   │   │   ├── HeroSection/
│   │   │   └── ...
│   │   ├── ssh/                       # SSH app components
│   │   │   ├── CourseCard/
│   │   │   ├── LessonView/
│   │   │   ├── StudentDashboard/
│   │   │   ├── AssignmentSubmission/
│   │   │   └── ...
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Client-side Supabase
│   │   │   ├── server.ts              # Server-side Supabase
│   │   │   ├── auth.ts                # Auth utilities
│   │   │   ├── storage.ts             # File operations
│   │   │   ├── queries/
│   │   │   │   ├── pages.ts
│   │   │   │   ├── posts.ts
│   │   │   │   ├── courses.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── ...
│   │   │   └── mutations/
│   │   │       ├── pages.ts
│   │   │       ├── posts.ts
│   │   │       ├── courses.ts
│   │   │       └── ...
│   │   ├── rls.ts                     # RLS helper functions
│   │   ├── utils.ts                   # General utilities
│   │   ├── constants.ts               # Constants
│   │   ├── types.ts                   # Shared types
│   │   ├── validation.ts              # Zod schemas
│   │   └── email/                     # Email templates
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # Auth hook
│   │   ├── useUser.ts                 # User data hook
│   │   ├── usePages.ts                # Pages CRUD hook
│   │   ├── usePosts.ts                # Posts CRUD hook
│   │   ├── useCourses.ts              # Courses CRUD hook
│   │   ├── useSupabase.ts             # Supabase generic hook
│   │   └── ...
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx           # Auth context
│   │   ├── SupabaseProvider.tsx       # Supabase context
│   │   ├── ThemeProvider.tsx          # Theme context
│   │   └── index.tsx
│   │
│   ├── types/
│   │   ├── database.ts                # Database types (auto-generated from Supabase)
│   │   ├── api.ts                     # API response types
│   │   ├── content.ts                 # Content types
│   │   ├── ssh.ts                     # SSH types
│   │   └── ...
│   │
│   └── middleware.ts                  # Next.js middleware (auth checks)
│
├── public/
│   ├── images/
│   ├── icons/
│   └── ...
│
├── .env.local                         # Local environment variables
├── .env.example                       # Example environment file
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind config
├── tsconfig.json                      # TypeScript config
├── package.json                       # Dependencies
├── supabase.config.ts                 # Supabase CLI config (optional)
├── README.md                          # Documentation
└── MIGRATION_NOTES.md                 # This file
```

---

## Part 6: Development Roadmap

### Week-by-Week Breakdown

| Week | Phase | Key Deliverables | Team |
|------|-------|-----------------|------|
| 1 | Foundation | Supabase setup, schema, auth | DevOps + Backend |
| 2-3 | API Layer | API routes, file upload, auth middleware | Backend |
| 3-4 | CMS Dev | Admin CMS, SSH admin, components | Frontend |
| 4-5 | Migration | Data migration, file migration | Backend + DevOps |
| 5-6 | Frontend | Route reorganization, integration | Frontend |
| 6-7 | Testing | QA, security, performance, UAT | QA + Team |
| 7-8 | Go-Live | Production deploy, monitoring | DevOps + Backend |
| 8+ | Optimization | Performance tuning, cleanup | Backend |

### Dependencies
```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7 ──→ Phase 8
(Can run Phase 2 & 3 in parallel after Phase 1)
```

---

## Part 7: Technology Stack (New)

### Core Framework
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **ORM**: Supabase Client + typed queries

### Frontend Libraries
- **State Management**: Zustand
- **Rich Text Editor**: Lexical
- **Data Fetching**: SWR or React Query
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts

### Development Tools
- **Package Manager**: Yarn
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics + Sentry
- **Testing**: Jest + React Testing Library

---

## Part 8: Environment Variables

### Development (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Email (for sending emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=xxx
SMTP_FROM=noreply@example.com

# Third-party services
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=xxx (if payment needed)

# Feature flags
NEXT_PUBLIC_ENABLE_SSH=true
NEXT_PUBLIC_ENABLE_MEMBERSHIP=true
```

### Production (.env.production)
```env
# Same as above but with production Supabase URLs
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key-xxx
SUPABASE_SERVICE_ROLE_KEY=prod-service-key-xxx

# Production URLs
NEXT_PUBLIC_APP_URL=https://eyogi.com
NEXT_PUBLIC_API_URL=https://eyogi.com/api

# Production email
SMTP_HOST=smtp.production.com
...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=xxx
```

---

## Part 9: Cost Comparison

### Current Setup (Monthly)
```
Neon Database:          ~$50/month (Payload CMS)
Supabase (SSH):         ~$25/month (free tier + extras)
UploadThing:            ~$30/month (CDN & storage)
Vercel:                 ~$20/month
Payload CMS Cloud:      ~$100/month (if using cloud)
─────────────────────────────────────
Total:                  ~$225/month (minimum)
```

### New Setup (Monthly)
```
Supabase (all-in-one):  ~$50/month (generous tier)
  ├─ PostgreSQL
  ├─ Auth
  ├─ Storage (1GB)
  └─ Realtime
Vercel:                 ~$20/month
─────────────────────────────────────
Total:                  ~$70/month
```

### Savings
- **Monthly**: $155 (68% reduction)
- **Yearly**: $1,860
- **Plus**: Reduced maintenance, simpler architecture, better real-time features

---

## Part 10: Success Criteria

### Phase 1 Complete ✓
- [ ] Supabase project configured
- [ ] All tables created
- [ ] RLS policies active
- [ ] Storage buckets ready
- [ ] Auth configured

### Phase 2 Complete ✓
- [ ] All API routes functional
- [ ] File upload working
- [ ] Auth middleware active
- [ ] 95% test coverage on API

### Phase 3 Complete ✓
- [ ] Admin CMS fully functional
- [ ] SSH admin panel ready
- [ ] All CRUD operations work
- [ ] Real-time updates working

### Phase 4 Complete ✓
- [ ] 100% data migrated
- [ ] File integrity verified
- [ ] No data loss
- [ ] Rollback plan tested

### Phase 5 Complete ✓
- [ ] All routes working
- [ ] Both platforms integrated
- [ ] No Payload CMS references
- [ ] Build time < 5 minutes

### Phase 6 Complete ✓
- [ ] All tests passing
- [ ] Security audit cleared
- [ ] Performance baseline met
- [ ] UAT sign-off received

### Phase 7 Complete ✓
- [ ] Live in production
- [ ] Monitoring active
- [ ] Backups confirmed
- [ ] Zero critical issues

---

## Part 11: Risk Mitigation

### High-Risk Areas

#### Risk: Data Loss During Migration
**Mitigation**:
- Full backup before migration
- Migrate to staging first
- Verify data integrity with checksums
- Keep old database for 6 months
- Test rollback procedure

#### Risk: Downtime During Go-Live
**Mitigation**:
- Use blue-green deployment
- Gradual traffic migration (5% → 50% → 100%)
- Monitoring and auto-rollback
- Have old system ready for 48h after go-live

#### Risk: Performance Issues
**Mitigation**:
- Load test before launch
- Database query optimization
- Add caching strategies
- Monitor real-time metrics
- Have rollback plan

#### Risk: Authentication/Authorization Issues
**Mitigation**:
- Comprehensive RLS testing
- Auth bypass attempts
- Role-based access testing
- Load test auth endpoints

#### Risk: File Storage Issues
**Mitigation**:
- Test file upload/download
- Verify CORS configuration
- Test RLS policies on storage
- Plan storage scaling

---

## Part 12: Questions Before Starting

1. **Timeline**: Can you commit to 8-week timeline?
2. **Team**: Do you have dedicated backend, frontend, and DevOps resources?
3. **Budget**: Can you allocate budget for Supabase, new development, testing?
4. **Users**: How many concurrent users expected?
5. **Data**: Total data size? Number of files?
6. **Email**: Do you need email integration (newsletters, notifications)?
7. **Payments**: Do you need payment processing (Stripe, PayPal)?
8. **Analytics**: Need advanced analytics beyond Vercel?
9. **Backup**: Need automated backups beyond Supabase?
10. **Support**: Need 24/7 support or in-house only?

---

## Summary

**This migration plan provides:**
- ✅ Complete architecture of unified system
- ✅ Phased 8-week implementation roadmap
- ✅ Database schema with RLS policies
- ✅ API design and directory structure
- ✅ Risk mitigation strategies
- ✅ 68% monthly cost reduction
- ✅ Improved real-time capabilities
- ✅ Simplified maintenance and deployment
- ✅ Ability to keep current setup intact during development
- ✅ Clear success criteria and testing strategy

**Next Steps**:
1. Review this plan with stakeholders
2. Confirm timeline and budget
3. Allocate team resources
4. Set up Supabase project (Phase 1)
5. Begin API development (Phase 2)

**Contact**: For questions about this plan, refer to team lead or architect.
