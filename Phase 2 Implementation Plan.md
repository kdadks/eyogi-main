# 🚀 Phase 2 Implementation Plan: 6-Stage Execution Blueprint (Unified Supabase Architecture)
> **Project**: eYogi Platform & SSH Gurukul University Ecosystem  
> **Document**: Comprehensive Phase 2 Implementation Plan  
> **Target Architecture**: Single Unified Supabase Backend + Custom CMS via SSH Admin Portal  
> **Author**: Antigravity Technical Architecture Team  
> **Status**: Ready for Implementation  

---

## 1. Executive Summary & Architectural Migration

This implementation plan reflects the architectural pivot to **completely decommission Neon PostgreSQL and PayloadCMS** in favor of a **single, unified Supabase backend** and a **Custom CMS administered within the SSH-App Admin Portal**:

### Key Architectural Tenets:
1. **Single Unified Database**: **Supabase PostgreSQL** powers both the public `eyogi` website and the `ssh-app` LMS ecosystem.
2. **Decommissioning of PayloadCMS & Neon**: PayloadCMS collections and Neon connection pools are removed.
3. **Custom CMS in SSH Admin Portal**: All content management (Website Pages, Hero Banners, Dynamic Menus, Wisdom Hub / Blogs, Media Storage, FAQs, Donations, and Memberships) is managed via the custom CMS components in `src/SSH/src/components/admin/`.
4. **Public Frontend Consumption**: Next.js 15 App Router functions as an ultra-fast rendering layer querying Supabase directly via server components with Incremental Static Regeneration (ISR).
5. **Zero Mixed Builds**: SSH continues to build into `public/ssh-app/` via `copy-ssh-files.js`, while the public website shares the same Supabase database.

---

## 2. 6-Phase Execution Roadmap Overview

```
Phase 2 Execution Pipeline (Unified Supabase):
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Sub-Phase 1: Foundation, Public Portal Redesign, Custom CMS Bridge & SumUp Donations   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Sub-Phase 2: Multi-Role Identity Engine & Teacher Onboarding with Mandatory NDA        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Sub-Phase 3: Public Guru Directory, SEO Profiles & Enterprise Document Library         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Sub-Phase 4: Course Schedule & Teacher Availability Management                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Sub-Phase 5: Quiz Management System & Motivational Badging Engine                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Sub-Phase 6: Course Materials (DRM), Bidirectional Feedback & Teacher Admin Suite      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Sub-Phase Specifications

### 🔹 Sub-Phase 1: Foundation, Public Portal Redesign, Custom CMS Bridge & SumUp Donations

#### 1. Objective
Decommission Neon PostgreSQL / PayloadCMS dependencies for public pages; wire Next.js public pages directly to Supabase (`page_settings`, `dynamic_menus`); decommission the `/contact` page in favor of an omnipresent **WhatsApp Sticky Action Button**; and deploy an automated, PCI DSS/GDPR-compliant **SumUp / Stripe donation engine** with instant PDF tax receipts stored in Supabase.

#### 2. Architecture & File Locations
- **Project Boundary**: Root Next.js 15 (`eyogi`) querying Supabase via `@supabase/supabase-js`.
- **Key Files & Routes**:
  - `src/lib/supabaseServer.ts` (Next.js server-side Supabase client with ISR caching)
  - `src/components/layout/WhatsAppStickyButton.tsx` (Floating WhatsApp action button)
  - `src/app/(frontend)/layout.tsx` (Mounts WhatsApp button; fetches dynamic menu from Supabase)
  - `src/SSH/migrations/phase2_01_donations_and_cms.sql` (Supabase schema for `donation_records`, `page_settings`)
  - `src/app/(frontend)/page.tsx` (Queries `page_settings` from Supabase)
  - `src/app/(frontend)/donation/page.tsx` (Redesigned donation UI)
  - `src/app/api/donations/checkout/route.ts` (API launching SumUp/Stripe checkout session)
  - `src/app/api/donations/sumup-webhook/route.ts` (Webhook verifying HMAC & updating Supabase)
  - `src/lib/pdf/donationReceiptGenerator.ts` (PDF tax receipt generator via `pdf-lib`)
  - `src/SSH/src/components/admin/DonationsLedger.tsx` (Custom CMS donation ledger in SSH admin)

#### 3. Database Schema Changes (Supabase PostgreSQL)
```sql
CREATE TABLE public.donation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  frequency TEXT NOT NULL DEFAULT 'one-time',
  cause TEXT DEFAULT 'General Fund',
  status TEXT NOT NULL DEFAULT 'PENDING',
  gateway_provider TEXT NOT NULL DEFAULT 'sumup',
  gateway_transaction_id TEXT,
  gift_aid_eligible BOOLEAN DEFAULT false,
  receipt_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure public read for page settings
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read page_settings" ON public.page_settings FOR SELECT USING (true);
```

#### 4. Step-by-Step Execution Tasks
1. Create `src/lib/supabaseServer.ts` in root project connecting to Supabase with service role for server-side ISR data fetching.
2. Build `WhatsAppStickyButton.tsx` with pulse animation and mobile responsiveness; mount in `src/app/(frontend)/layout.tsx`.
3. Deprecate `/contact` route in Next.js; remove contact links from Supabase `dynamic_menus`.
4. Refactor `src/app/(frontend)/page.tsx` (Homepage) and `about/page.tsx` to read content directly from Supabase `page_settings` table (managed via `HomePageCMSEditor.tsx` and `AboutPageCMSEditor.tsx` in SSH admin).
5. Build the frontend donation form collecting **First Name, Last Name, Email, Phone**, amount ($25, $50, $100, $250, custom), and frequency.
6. Implement `/api/donations/checkout` with server-side SumUp Checkout API integration, inserting pending records into Supabase `donation_records`.
7. Implement `/api/donations/sumup-webhook` with HMAC signature verification, updating Supabase records to `PAID`.
8. Create `donationReceiptGenerator.ts` generating sequentially numbered charitable PDF tax receipts.
9. Dispatch confirmation emails via Microsoft Graph API / SMTP with the attached PDF receipt within 60s of payment capture.
10. Build `DonationsLedger.tsx` in SSH Admin Portal allowing Business Admins to filter, search, and export donation records to CSV.

#### 5. Verification Commands & Acceptance Criteria
- `npx tsc --noEmit && yarn lint` passes with 0 errors.
- Test TC-P2-01: Public homepage loads from Supabase; valid checkout creates pending record; webhook transitions status to `PAID` and triggers receipt email.
- Sticky WhatsApp button renders and opens WhatsApp web/app with pre-filled text.

---

### 🔹 Sub-Phase 2: Multi-Role Identity Engine & Teacher Onboarding with Mandatory NDA

#### 1. Objective
Establish the **Multi-Role Identity Engine** in Supabase allowing a single account to seamlessly switch between roles (Student, Parent, Teacher, etc.) and automate **Teacher Onboarding** with an enforced electronic NDA signing workflow that blocks course assignments until Admin approval.

#### 2. Architecture & File Locations
- **Project Boundary**: `src/SSH/` (Vite 7, React 18, Supabase PostgreSQL).
- **Key Files & Routes**:
  - `src/SSH/migrations/phase2_02_user_roles_and_nda.sql`
  - `src/SSH/src/contexts/MultiRoleContext.tsx` (Multi-role state provider)
  - `src/SSH/src/components/layout/RoleSwitcherDropdown.tsx` (Top-nav role switcher)
  - `src/SSH/src/components/auth/TeacherRegistrationModal.tsx` (Registration UI)
  - `src/SSH/src/components/onboarding/EmbeddedNDAModal.tsx` (Electronic NDA signing modal)
  - `src/SSH/src/components/admin/TeacherApprovalQueue.tsx` (Admin verification & approval UI)

#### 3. Database Schema Changes (Supabase PostgreSQL)
```sql
-- Multi-Role Association
CREATE TYPE app_role AS ENUM ('student', 'teacher', 'parent', 'business_admin', 'super_admin', 'teacher_admin');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, role)
);

-- Teacher Onboarding & Electronic Signatures
CREATE TYPE teacher_onboarding_stage AS ENUM ('registered', 'nda_pending', 'nda_signed', 'admin_review', 'approved', 'rejected');
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS onboarding_stage teacher_onboarding_stage NOT NULL DEFAULT 'nda_pending',
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teacher_code TEXT UNIQUE;

CREATE TABLE public.document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  legal_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_hash TEXT NOT NULL
);

-- Trigger: Block course assignment prior to approval
CREATE OR REPLACE FUNCTION public.check_teacher_approval_before_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teachers
    WHERE id = NEW.teacher_id AND is_approved = true AND onboarding_stage = 'approved'
  ) THEN
    RAISE EXCEPTION 'Teacher cannot be assigned to courses until account is verified and approved by Admin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_teacher_assignment
BEFORE INSERT OR UPDATE ON public.course_assignments
FOR EACH ROW EXECUTE FUNCTION public.check_teacher_approval_before_assignment();
```

#### 4. Step-by-Step Execution Tasks
1. Execute Supabase migrations for `user_roles`, `document_signatures`, and teacher approval triggers.
2. Implement `MultiRoleContext.tsx` and `useMultiRole()` hook with session caching in `localStorage`.
3. Add `RoleSwitcherDropdown.tsx` to `GlossyHeader.tsx` and admin navigation bars.
4. Build `TeacherRegistrationModal.tsx` capturing required teacher credentials.
5. Create `EmbeddedNDAModal.tsx` with PDF rendering, scroll-to-bottom confirmation, and electronic signature capture.
6. Build `TeacherApprovalQueue.tsx` in the SSH Admin Portal for verifying credentials and signed NDAs.
7. Implement automated `teacher_code` generation and email dispatch upon Admin approval.

#### 5. Verification Commands & Acceptance Criteria
- `cd src/SSH && npm run type-check && npm test && npm run lint` passes.
- Test TC-P2-02: Switching roles in dropdown updates active portal context without reload.
- Test TC-P2-06: Unapproved teacher is blocked from batch/course assignment by database trigger.

---

### 🔹 Sub-Phase 3: Public Guru Directory, SEO Profiles & Enterprise Document Library

#### 1. Objective
Deliver a public-facing, SEO-optimized **Teachers / Guru Directory** with card grids and rich modal overlays, paired with an **Enterprise Document Library** in Supabase for managing DOCX, PPT, and PDF files with dynamic workflow triggers.

#### 2. Architecture & File Locations
- **Project Boundary**: `src/SSH/` (Public pages & Admin components) + Next.js SSR bridge.
- **Key Files & Routes**:
  - `src/SSH/migrations/phase2_03_gurus_and_documents.sql`
  - `src/SSH/src/pages/GurusPage.tsx` (Public directory listing)
  - `src/SSH/src/components/gurus/GuruDetailModal.tsx` (Tabbed modal overlay)
  - `src/SSH/src/components/admin/GuruManagement.tsx` (Admin CRUD & CSV import/export)
  - `src/SSH/src/components/teacher/GuruProfileEditor.tsx` (Teacher self-service profile editor)
  - `src/SSH/src/components/admin/EnterpriseDocumentLibrary.tsx` (Admin document manager)

#### 3. Database Schema Changes (Supabase PostgreSQL)
```sql
CREATE TABLE public.gurus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  bio TEXT NOT NULL, -- 150-200 words active voice
  degrees_certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_achievements TEXT[] DEFAULT '{}',
  teaching_specialties TEXT[] DEFAULT '{}',
  extracurricular TEXT[] DEFAULT '{}',
  email TEXT,
  calendar_booking_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.document_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_format TEXT NOT NULL, -- 'pdf', 'docx', 'ppt', etc.
  storage_path TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  category TEXT NOT NULL,
  is_default_mandatory BOOLEAN DEFAULT false,
  target_role TEXT
);
```

#### 4. Step-by-Step Execution Tasks
1. Execute Supabase migrations for `gurus` and `document_library`.
2. Build `GurusPage.tsx` with responsive tile grid, search, and specialty filter tags.
3. Build `GuruDetailModal.tsx` displaying the 4 tabs (*Overview, Credentials, Achievements, Involvement*) and `JSON-LD Person` schema.
4. Implement `GuruManagement.tsx` supporting bulk CSV/JSON import/export, image upload with automatic client-side resizing ($800\times 800\text{px}$ WebP), and version history.
5. Create `GuruProfileEditor.tsx` in the Teacher Portal with instant database commit and live reflection.
6. Build `EnterpriseDocumentLibrary.tsx` with tagging, full-text search, and workflow trigger assignments (mapping NDAs and compliance guides).

#### 5. Verification Commands & Acceptance Criteria
- Test TC-P2-04 & TC-P2-11: Public directory displays active teachers; clicking tile opens modal overlay without page navigation; updates reflect immediately.
- Test TC-P2-03: Documents upload, tag, version, and assign dynamically to roles.

---

### 🔹 Sub-Phase 4: Course Schedule & Teacher Availability Management

#### 1. Objective
Implement master **Course Schedule Management** across Day, Week, Month, and Year calendar views with automated active batch generation in Supabase, paired with **Teacher Availability Management** to prevent scheduling conflicts and double-booking.

#### 2. Architecture & File Locations
- **Project Boundary**: `src/SSH/` (Admin & Teacher Portals).
- **Key Files & Routes**:
  - `src/SSH/migrations/phase2_04_schedule_and_availability.sql`
  - `src/SSH/src/components/schedule/MasterCalendarView.tsx` (Day/Week/Month/Year views)
  - `src/SSH/src/components/admin/ScheduleManagement.tsx` (Admin schedule builder)
  - `src/SSH/src/components/teacher/TeacherAvailabilityCalendar.tsx` (Teacher availability editor)
  - `src/SSH/src/components/admin/TeacherAvailabilityManager.tsx` (Admin availability inspector)
  - `src/SSH/src/lib/scheduleConflictDetector.ts` (Collision detection utility)

#### 3. Database Schema Changes (Supabase PostgreSQL)
```sql
CREATE TABLE public.teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT, -- 0-6 for recurring
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.course_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  room_or_zoom_link TEXT
);
```

#### 4. Step-by-Step Execution Tasks
1. Execute Supabase migrations for `teacher_availability`, `course_schedules`, and conflict functions.
2. Build `MasterCalendarView.tsx` supporting Day, Week, Month, and Year views with time slot grids.
3. Build `TeacherAvailabilityCalendar.tsx` allowing teachers to configure specific dates or recurring weekly slots (e.g. Mon 17:00–20:00).
4. Implement automatic batch schedule generation for active batches.
5. Implement `scheduleConflictDetector.ts` identifying overlapping sessions and warning/blocking saves during batch and schedule authoring.
6. Connect Admin batch creation workflow to validate teacher availability in real time.

#### 5. Verification Commands & Acceptance Criteria
- Test TC-P2-07: Calendar toggles Day/Week/Month/Year; active batches automatically generate schedule sessions.
- Test TC-P2-08: Schedule collision engine blocks overlapping assignments and warns when scheduling outside availability.

---

### 🔹 Sub-Phase 5: Quiz Management System & Motivational Badging Engine

#### 1. Objective
Deliver a full-featured **Quiz Management System** in Supabase enforcing active-batch publishing, student draft saving, unauthenticated deep-link routing, automated scoring, and **automatic badge awarding for scores $>80\%$**.

#### 2. Architecture & File Locations
- **Project Boundary**: `src/SSH/` (Teacher, Student, and Parent Portals).
- **Key Files & Routes**:
  - `src/SSH/migrations/phase2_05_quizzes_and_badges.sql`
  - `src/SSH/src/components/teacher/QuizCreatorModal.tsx` (Teacher quiz authoring)
  - `src/SSH/src/components/teacher/QuizGradingModal.tsx` (Teacher grading interface)
  - `src/SSH/src/components/student/QuizRunnerView.tsx` (Student quiz taking engine)
  - `src/SSH/src/components/dashboard/StudentBadgesDisplay.tsx` (Motivational badge showcase)
  - `src/SSH/src/lib/quizScoringEngine.ts` (Score calculation & badge assignment trigger)

#### 3. Database Schema Changes (Supabase PostgreSQL)
```sql
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time_limit_minutes INT DEFAULT 30,
  is_published BOOLEAN DEFAULT false
);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB NOT NULL,
  order_index INT NOT NULL
);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'Draft',
  answers JSONB NOT NULL
);

CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  title TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 4. Step-by-Step Execution Tasks
1. Execute Supabase migrations for `quizzes`, `quiz_questions`, `quiz_attempts`, and `student_badges`.
2. Build `QuizCreatorModal.tsx` with active batch validation (preventing selection of inactive batches) and email notification dispatch.
3. Implement quiz cloning feature allowing duplication of existing quizzes for future batches.
4. Build `QuizRunnerView.tsx` with countdown timer, "Save and submit later" draft saving, and final submission triggers.
5. Handle unauthenticated quiz deep links by redirecting through login and landing directly on the quiz page.
6. Build `QuizGradingModal.tsx` calculating percentage scores and executing the automated badge award trigger for scores $>80\%$.
7. Display awarded badges in `StudentBadgesDisplay.tsx` on Student and Parent dashboards.

#### 5. Verification Commands & Acceptance Criteria
- Test TC-P2-05: Quiz publish blocks on inactive batches; unauthenticated links route through login; score $>80\%$ awards badge immediately to student profile.

---

### 🔹 Sub-Phase 6: Course Materials (DRM), Bidirectional Feedback & Teacher Admin Suite

#### 1. Objective
Implement the **Course Material lifecycle** with admin templates, teacher drafting, review queues, and DRM viewing (disabled context menu and suppressed downloads); deploy **Bidirectional Feedback** (Teacher-to-student & Parent-to-course); operationalize the **Teacher Admin Suite**; and activate full **Invoice & Payment Management**.

#### 2. Architecture & File Locations
- **Project Boundary**: `src/SSH/` (Portals and Admin Suite) + Root build.
- **Key Files & Routes**:
  - `src/SSH/migrations/phase2_06_materials_and_feedback.sql`
  - `src/SSH/src/components/materials/CourseMaterialTemplateEditor.tsx` (Admin template builder)
  - `src/SSH/src/components/materials/SecureMaterialViewer.tsx` (DRM viewer with canvas rendering)
  - `src/SSH/src/components/feedback/StudentFeedbackModal.tsx` (Teacher-to-student feedback)
  - `src/SSH/src/components/feedback/CourseFeedbackForm.tsx` (Parent-to-course feedback)
  - `src/SSH/src/components/teacher-admin/TeacherAdminDashboard.tsx` (11 operational modules)
  - `src/SSH/src/components/admin/InvoiceManagement.tsx` (Upgraded from placeholder)
  - `src/SSH/src/components/admin/PaymentManagement.tsx` (Upgraded from placeholder)

#### 3. Database Schema Changes (Supabase PostgreSQL)
```sql
-- Course Materials & DRM
CREATE TABLE public.course_material_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  structure_schema JSONB NOT NULL
);

CREATE TABLE public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL,
  file_path TEXT,
  external_video_url TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  review_feedback TEXT
);

-- Bidirectional Feedback
CREATE TABLE public.student_course_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  performance_rating INT,
  general_comments TEXT NOT NULL
);

CREATE TABLE public.parent_course_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_rating INT,
  feedback_text TEXT NOT NULL
);
```

#### 4. Step-by-Step Execution Tasks
1. Execute Supabase migrations for `course_materials`, `course_material_templates`, and feedback tables.
2. Build `CourseMaterialTemplateEditor.tsx` allowing Admins to define UI-based material templates.
3. Build `SecureMaterialViewer.tsx` rendering PDFs/PPTs via HTML5 Canvas with right-click disabled (`onContextMenu={(e) => e.preventDefault()}`) and download controls suppressed.
4. Support external video links (YouTube/OneDrive) embedded without local file download options.
5. Implement `StudentFeedbackModal.tsx` (Teacher-to-Student) and `CourseFeedbackForm.tsx` (Parent-to-Course post-completion).
6. Build out the 11 Teacher Admin sub-modules under `src/SSH/src/components/teacher-admin/`.
7. Replace `ComingSoon` placeholders in `InvoiceManagement.tsx` and `PaymentManagement.tsx` with production invoicing and SumUp reconciliation.
8. Perform final end-to-end build verification: `yarn build` (Next.js + Vite SSH build + file sync).

#### 5. Verification Commands & Acceptance Criteria
- Test TC-P2-09: Secure viewer prevents right-click and hides download buttons; external video streams without native save options.
- Test TC-P2-10: Teacher feedback visible to Student, Parent, and Admin; Parent feedback visible to Teacher and Admin.
- Full build passes: `yarn build` succeeds and updates `public/ssh-app/`.

---

## 4. Phase Verification & Test Gate Summary

| Sub-Phase | Verification Command | Mandatory Gate Criteria | Test Case Ref |
| :--- | :--- | :--- | :--- |
| **Sub-Phase 1** | `npx tsc --noEmit && yarn lint` | Sticky WhatsApp renders; SumUp checkout & PDF receipt work via Supabase | TC-P2-01 |
| **Sub-Phase 2** | `cd src/SSH && npm run type-check && npm test` | Multi-role switcher works; NDA blocks unapproved teacher assignment | TC-P2-02, TC-P2-06 |
| **Sub-Phase 3** | `cd src/SSH && npm run type-check && npm test` | Guru directory modal overlay renders; doc library assigns dynamically | TC-P2-03, TC-P2-11 |
| **Sub-Phase 4** | `cd src/SSH && npm run type-check && npm test` | Schedules generate for active batches; conflict detector blocks overlaps | TC-P2-07, TC-P2-08 |
| **Sub-Phase 5** | `cd src/SSH && npm run type-check && npm test` | Active batch quiz publish enforced; score $>80\%$ awards badge | TC-P2-05 |
| **Sub-Phase 6** | `yarn build` (Root full build) | DRM viewer blocks right-click; feedback forms render; all 11 modules pass | TC-P2-09, TC-P2-10, TC-INT-01 |

---

## 5. Mandatory Agent Protocol Checklist for Each Sub-Phase

> [!CAUTION]
> **Strict Operational Rule**: Upon completing any task or sub-phase, the executing agent must immediately:
> 1. Update [memory.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/memory.md) Section 6 (Recent Work & State Log) and Section 7 (Architectural Blueprint Reference).
> 2. Update [Test.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Test.md) Section 4 (Test Execution Log & Status Matrix) with timestamp, run command, and pass/fail outcome.
