# eYogi Project - Comprehensive Architecture Analysis

**Date:** 2026-06-15  
**Project:** eYogi Gurukul - Dual-Platform Educational Ecosystem

---

## Executive Summary

eYogi is a sophisticated dual-platform educational application combining:
1. **PayloadCMS-powered Main Website** - Content management system for public website
2. **SSH University** - Full-featured learning management system (LMS) with multi-role support

Both platforms are built on Next.js 15 with PostgreSQL backend, sharing authentication infrastructure and media storage via UploadThing.

---

## 1. Platform Separation & Organization

### 1.1 Main eYogi Website (PayloadCMS)

**Location:** `src/` (root level)

**Purpose:** Public-facing content management system for the eYogi brand website

**Key Technologies:**
- **Framework:** Next.js 15.1.9 (App Router)
- **CMS:** Payload CMS 3.9.0
- **Database:** PostgreSQL via `@payloadcms/db-postgres`
- **Frontend:** React 19, Tailwind CSS, Lexical Rich Text Editor
- **Deployment:** Vercel

**Routing Structure:**
```
src/app/(frontend)/     # Public pages
├── about/              # About page
├── contact/            # Contact form
├── donation/           # Donation page
├── faq/                # FAQ section
├── forms/              # External form links
├── hinduism/           # Hindu philosophy content
├── membership/         # Membership information
├── privacy-policy/     # Legal pages
├── search/             # Search functionality
└── [slug]/             # Dynamic pages via CMS

src/app/(payload)/      # Admin panel routes
├── admin/              # Payload CMS admin interface
└── api/                # Backend API routes

src/app/api/            # API endpoints
├── auth/               # Authentication routes
├── enrollments/        # SSH enrollment APIs
├── uploadthing/        # Media upload handling
└── other endpoints     # Additional APIs
```

### 1.2 SSH University (Separate SPA Application)

**Location:** `src/SSH/` (Independent Vite + React project)

**Purpose:** Complete learning management system with student/teacher/parent/admin portals

**Key Technologies:**
- **Framework:** Vite + React 18.3.1 (SPA)
- **Database:** Supabase (PostgreSQL with RLS)
- **Build Tool:** Vite (faster than Next.js for SPA)
- **UI Components:** Custom React components + Tailwind CSS
- **State Management:** Zustand (lightweight alternative to Redux)
- **Server:** Express.js backend server for file uploads

**Separation Strategy:**
- Built independently as a separate Vite project
- Production build output copied to `public/ssh-app/`
- Served as a static SPA from Next.js public directory
- Accessible via `/ssh-app` route through Vercel rewrites

**Project Structure:**
```
src/SSH/
├── src/
│   ├── App.tsx              # Main SPA entry
│   ├── pages/               # Route pages (teacher, student, etc.)
│   ├── components/          # React components
│   ├── contexts/            # React contexts for state
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities (Supabase client)
│   ├── types/               # TypeScript definitions
│   ├── server/              # Express backend server
│   │   ├── api-handler.ts   # API routing
│   │   └── uploadthing.ts   # Upload handler
│   └── utils/               # Helper functions
├── server.mjs               # Express server entry
├── vite.config.ts           # Vite build configuration
└── package.json             # Independent dependencies
```

**Build Process:**
```bash
yarn build:ssh  # Runs:
  1. cd src/SSH
  2. npm install
  3. npx vite build (outputs to dist/)
  4. cd ../..
  5. node copy-ssh-files.js (copies dist/ to public/ssh-app/)
```

**Integration via Rewrites** (`vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/ssh-app",
      "destination": "/ssh-app/index.html"
    },
    {
      "source": "/ssh-app/((?!assets|Images|.*\\..*).*)",
      "destination": "/ssh-app/index.html"  // SPA routing
    }
  ]
}
```

---

## 2. Payload CMS Setup & Collections

### 2.1 Core Configuration

**File:** `src/payload.config.ts`

**Key Settings:**
```typescript
- Admin URL: /admin
- Editor: Lexical (rich text with code, media support)
- Live Preview: Enabled for mobile, tablet, desktop
- Database: PostgreSQL with connection pooling
- Sharp: Image optimization enabled
```

### 2.2 Collections (Data Models)

#### 2.2.1 Content Collections

| Collection | Slug | Purpose | Access | Key Fields |
|-----------|------|---------|--------|-----------|
| Pages | `pages` | Static pages with block layouts | Published visible to all | title, slug, hero, layout blocks, SEO |
| Posts | `posts` | Blog articles | Published visible to all | title, slug, content, categories, authors, cover image |
| Media | `media` | File uploads (images, videos) | Public read | alt text, UploadThing integration |
| Categories | `categories` | Post categorization | Public read | title |
| FAQ | `faq` | Frequently asked questions | Public read | question, answer, category |
| FAQ Categories | `categoriesfaq` | FAQ subcategories | Public read | title |

#### 2.2.2 Business/Content Collections

| Collection | Slug | Purpose | Access | Key Fields |
|-----------|------|---------|--------|-----------|
| Membership | `membership` | Membership tiers/info | Authenticated | title, description, features, pricing |
| Form Links | `formLinks` | External form integration | Authenticated | title, external link URL |
| Users | `users` | CMS users + authentication | Authenticated | email, password, name, role-based access |

#### 2.2.3 Global Content (Singletons)

| Global | Slug | Purpose |
|--------|------|---------|
| About Us | `aboutUs` | Global about page content |
| Privacy Policy | `privacyPolicy` | Legal documentation |
| Donation | `donation` | Donation page content |
| Header Menu | `headerMenu` | Navigation menu configuration |
| Footer Menu | `footerMenu` | Footer menu configuration |

### 2.3 Collection Architecture

**Access Control Pattern** (`src/access/`):
- `anyone()` - Public read access
- `authenticated()` - Requires login
- `authenticatedOrPublished()` - Logged-in users see all; public sees only published

**Fields Configuration:**
```typescript
// Posts collection example
{
  slug: 'posts',
  access: {
    create: authenticated,      // Only admins
    read: authenticatedOrPublished,  // Published visible to all
    update: authenticated,
    delete: authenticated
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText', editor: lexicalEditor },
    { name: 'categories', type: 'relationship', relationTo: 'categories' },
    { name: 'authors', type: 'relationship', relationTo: 'users' },
    { name: 'publishedAt', type: 'date' },
    ...SEO fields from plugin
  ]
}
```

### 2.4 Built-in Payload Plugins

| Plugin | Purpose | Status |
|--------|---------|--------|
| **Form Builder** | Create custom forms with validation | Enabled, hidden from admin UI |
| **SEO Plugin** | Automated meta tags, Open Graph, sitemaps | Enabled with custom title/URL generation |
| **Redirects** | URL redirect management | Enabled for pages/posts |
| **Search** | Full-text search across posts | Enabled with field overrides |
| **Nested Docs** | Hierarchical document structures | Loaded in plugins/index.ts |
| **UploadThing Storage** | Media file hosting | Primary media storage solution |
| **Payload Cloud** | Cloud hosting integration | Optional plugin available |

---

## 3. UploadThing Integration for Media Storage

### 3.1 Configuration

**File:** `src/lib/uploadthing.ts`

**Purpose:** Client-side UploadThing router configuration

**Supported File Types:**
```typescript
imageUploader: {
  image:  { maxFileSize: '8MB', maxFileCount: 10 },
  video:  { maxFileSize: '32MB', maxFileCount: 5 },
  audio:  { maxFileSize: '16MB', maxFileCount: 5 },
  pdf:    { maxFileSize: '8MB', maxFileCount: 5 },
  text:   { maxFileSize: '2MB', maxFileCount: 5 },
  blob:   { maxFileSize: '8MB', maxFileCount: 10 }
}
```

### 3.2 Payload CMS Integration

**File:** `src/payload.config.ts` (plugins section)

```typescript
uploadthingStorage({
  collections: {
    media: true  // Enable for media collection
  },
  options: {
    token: process.env.UPLOADTHING_TOKEN,
    acl: 'public-read'  // Public accessibility
  }
})
```

### 3.3 Media Collection Configuration

**File:** `src/collections/Media.ts`

```typescript
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,  // Only authenticated users can upload
    read: anyone,          // Anyone can view/download
    delete: authenticated,
    update: authenticated
  },
  fields: [
    { name: 'alt', type: 'text' }  // Alt text for accessibility
  ],
  upload: true  // Handled entirely by UploadThing plugin
}
```

### 3.4 UploadThing Endpoints

**File:** `src/app/api/uploadthing/`

```
config/    - UploadThing route configuration
route.ts   - GET/POST handlers for file uploads
```

### 3.5 Next.js Image Optimization

**File:** `next.config.js`

**Configured Remote Patterns:**
```javascript
remotePatterns: [
  { hostname: 'eyogigurukul.com' },
  { hostname: '*.uploadthing.com' },  // UploadThing CDN
  { hostname: 'utfs.io' },             // UploadThing file URLs
  { hostname: '*.utfs.io' },           // Regional CDN URLs
  { hostname: '*.vercel.app' },        // Vercel deployment URLs
  { hostname: 'localhost' }
]
```

**Performance Benefits:**
- Image resizing and optimization
- WebP format conversion
- Lazy loading support
- Responsive images via `sizes` prop

---

## 4. Database Connection Setup (Neon/PostgreSQL)

### 4.1 Main Website (Payload CMS)

**Configuration File:** `src/payload.config.ts`

```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || 'postgresql://localhost:5432/payload',
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }  // Production SSL
      : false                           // Local: no SSL
  },
  push: false  // Disable auto schema migration
})
```

**Environment Variables Required:**
- `DATABASE_URI` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Encryption key for sensitive data

**Connection Features:**
- Connection pooling for performance
- Automatic reconnection handling
- Supports Neon's PostgreSQL hosting

### 4.2 SSH University Database

**Technology:** Supabase (PostgreSQL + RLS)

**Connection File:** `src/SSH/src/lib/supabase.ts`

```typescript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)
```

**Database Features:**
- Row-level security (RLS) for multi-tenant isolation
- Real-time subscriptions for live updates
- Built-in authentication with JWT tokens
- File storage bucket for course materials

### 4.3 Database Structure

**Payload CMS Tables:**
```
users              - CMS administrators
pages              - Website pages
posts              - Blog articles
categories         - Post categories
media              - File metadata
faq                - FAQ entries
membership         - Membership tiers
formlinks          - External form references
payload_locked_documents
payload_preferences
redirects          - URL redirects
search             - Search index
```

**SSH University Tables** (Supabase):
```
users              - Student/teacher/parent/admin accounts
gurus/teachers     - Teacher profiles
students           - Student profiles
parents            - Parent profiles
gurus_gurus (gunkulls) - Gurukul (school) management
enrollments        - Student-course relationships
courses            - Course definitions
lessons            - Individual lessons
assignments        - Course assignments
submissions        - Student submissions
attendance         - Attendance records
certificates       - Certificate records
```

### 4.4 Database Connection During Build

**Critical Issue:** Build process requires live database connection

```javascript
// From memory: "The server does not support SSL connections" error
// Occurs during: Page generation/collection phase
// Solution: Ensure PostgreSQL accepts connections during build
```

**Build Time Database Requirements:**
1. Payload CMS introspects database schema during build
2. Generates TypeScript types (`payload-types.ts`)
3. Pre-renders static pages that query the database
4. SSH app builds independently (no DB dependency)

---

## 5. API Routes & Backend Structure

### 5.1 API Route Organization

**Location:** `src/app/api/`

```
api/
├── auth/
│   ├── register/                    - User registration
│   ├── login/                       - Login endpoint
│   ├── password-reset/              - Password reset flow
│   ├── reset-password-confirmation/ - Password reset confirmation
│   └── welcome/                     - Welcome email
│
├── uploadthing/
│   ├── route.ts                     - UploadThing handler
│   └── config/                      - Upload configuration
│
├── enrollments/                     - SSH University enrollments
├── certificate-issued/              - Certificate generation
├── cleanup/                         - Maintenance endpoints
├── send/                            - Email sending
├── test-email/                      - Email testing
└── (payload)/                       - Payload CMS API
    ├── admin/                       - Admin panel
    └── api/                         - GraphQL API
```

### 5.2 Authentication Flow

**File:** `src/app/api/auth/register/route.ts`

**Registration Process:**
```typescript
POST /api/auth/register
{
  email: string,
  fullName: string,
  role: 'student' | 'teacher' | 'parent' | 'admin',
  password: string
}

Response:
{
  success: boolean,
  message: string,
  userId?: string,
  token?: JWT
}
```

**Post-Registration:**
- Email notification via Microsoft Graph API
- User account activated or pending verification
- JWT token issued for future requests

### 5.3 Payload CMS Backend

**Entry Point:** `src/app/(payload)/`

**Features:**
- GraphQL API endpoint
- REST API endpoints
- Admin dashboard at `/admin`
- Authentication via JWT tokens
- Webhook support for content changes

**Custom Admin Components:**
```typescript
// src/components/BeforeLogin.tsx    - Custom login message
// src/components/BeforeDashboard.tsx - Dashboard welcome
```

### 5.4 Email Service Integration

**Primary Method:** Microsoft Graph API

**File:** `src/lib/email/graphEmailService.ts`

**Configuration Required:**
```env
MICROSOFT_TENANT_ID=<your_tenant_id>
MICROSOFT_CLIENT_ID=<your_client_id>
MICROSOFT_CLIENT_SECRET=<your_secret>
MICROSOFT_FROM_EMAIL=<sender_email>
```

**Email Capabilities:**
- User registration notifications
- Password reset emails
- Welcome messages
- Custom template support

**Fallback:** Nodemailer if Graph API unavailable

### 5.5 SSH University API

**Location:** `src/SSH/src/server/`

**Express Backend:**
```typescript
// server.mjs - Express server
app.use('/api', apiRouter)      // API routes
app.use('/upload', uploadRouter) // File uploads

// Upload Handler
POST /upload
- Handles file uploads via UploadThing
- Stores files in Supabase
- Returns file URLs
```

**API Endpoints for SSH:**
- Course management (CRUD)
- Student enrollment
- Attendance tracking
- Assignment submission
- Grade recording
- Certificate generation

---

## 6. Authentication Setup

### 6.1 Main Website (Payload CMS)

**User Collection Configuration:**

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,  // Enable built-in auth
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'password', type: 'password', required: true },
    { name: 'name', type: 'text' }
  ],
  timestamps: true
}
```

**Features:**
- Payload CMS built-in authentication
- JWT token generation
- Password hashing (bcrypt)
- Email verification support
- Password reset flow

**Access Control:**
```typescript
// src/access/ folder
authenticated()           // Checks if user exists
anyone()                 // Public access
authenticatedOrPublished() // Published content visible to all
```

### 6.2 SSH University Authentication

**Architecture:** Supabase Auth + Custom JWT

**User Model** (`src/SSH/src/types/index.ts`):
```typescript
interface User {
  id: string
  email: string
  password_hash?: string | null
  full_name?: string | null
  role: 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  avatar_url?: string | null
  created_at: string
  updated_at: string
  // Student-specific fields
  student_id?: string | null
  parent_id?: string | null
  // Teacher-specific fields
  teacher_code?: string | null
  // Admin-specific fields
  admin_code?: string | null
}
```

**Role-Based Access Control (RBAC):**
- **Student** - Access courses, assignments, grades
- **Teacher** - Create courses, grade assignments, track attendance
- **Parent** - Monitor child's progress
- **Admin** - Manage all users, courses, system settings
- **Business Admin** - Organization-level permissions
- **Super Admin** - Full system access

**Authentication Flow:**
```
1. User registers with email
2. Supabase creates account with RLS enabled
3. JWT token issued
4. Token stored in localStorage
5. Supabase RLS policies enforce row-level security
6. API requests include token in Authorization header
```

### 6.3 Payload CMS Admin Dashboard

**Protected Routes:**
```
/admin/              - Dashboard (requires authentication)
/admin/collections/* - Collection editors
/admin/users/*       - User management
/admin/media/*       - Media library
```

**Session Management:**
- JWT stored in HTTP-only cookies
- Auto-refresh before expiration
- CSRF protection enabled

---

## 7. Admin & Dashboard Functionality

### 7.1 Payload CMS Admin Panel

**Location:** `/admin` (route prefix)

**File:** `src/app/(payload)/admin/`

**Features:**

#### Content Management
- **Pages Editor** - Create/edit pages with block-based builder
- **Posts Editor** - Publish blog articles with SEO
- **Media Library** - Browse, upload, delete media files
- **Collections** - Manage all data models

#### Admin Features
- **User Management** - Create admins, set permissions
- **Version Control** - Track changes, restore versions
- **Scheduling** - Schedule posts for future publication
- **Preview** - Live preview before publishing
- **Webhooks** - Trigger external services

#### Customization
- **Before Login** - Custom branding on login page
- **Before Dashboard** - Custom welcome message
- **Import Map** - TypeScript path resolution

**Admin Components:**
```typescript
// src/components/BeforeLogin
// Renders before admin panel loads

// src/components/BeforeDashboard
// Welcome screen after login

// src/components/AdminBar
// Top navigation with branding
```

### 7.2 SSH University Admin Portal

**Location:** `/ssh-app/admin` (within SPA)

**Features:**

#### Admin Dashboard
- **User Management** - Create/edit students, teachers, parents
- **Gurukul (School) Management** - Multi-school support
- **Course Management** - Create courses, assign teachers
- **Reports** - Enrollment, attendance, performance analytics
- **System Settings** - Configuration, email templates

#### Teacher Dashboard (`/ssh-app/teacher`)
- **Class Management** - View assigned students
- **Attendance** - Mark attendance, track participation
- **Assignment Grading** - Review and grade submissions
- **Course Materials** - Upload lessons, resources
- **Grade Book** - Track student performance

#### Student Dashboard (`/ssh-app/student`)
- **Enrolled Courses** - View active courses
- **Assignments** - Submit work, track grades
- **Attendance** - View attendance record
- **Certificates** - Download earned certificates
- **Profile** - Update personal information

#### Parent Dashboard (`/ssh-app/parent`)
- **Child Progress** - Monitor child's performance
- **Attendance** - View attendance records
- **Grades** - Check course grades
- **Announcements** - Receive updates

### 7.3 Dashboard Architecture

**State Management:** Zustand (lightweight store)

```typescript
// src/SSH/src/contexts/
// Global state management

// Example stores:
- userStore      // Current user profile
- courseStore    // Enrolled courses
- enrollmentStore // Enrollment data
```

**Component Structure:**
```
App.tsx
├── Router (React Router)
├── Contexts (Zustand stores)
├── Pages (Route components)
│   ├── StudentDashboard
│   ├── TeacherDashboard
│   ├── ParentDashboard
│   └── AdminDashboard
└── Components (Reusable UI)
    ├── Forms
    ├── Tables
    ├── Cards
    └── Navigation
```

**Authentication Guard:**
```typescript
// Protected routes check JWT token
// Redirect to login if unauthorized
// Role-based conditional rendering
```

---

## 8. Project Dependencies & Technology Stack

### 8.1 Main Website Stack

**Core Framework:**
```json
{
  "next": "15.1.9",
  "react": "^18 (compatible with 19)",
  "typescript": "^5",
  "tailwindcss": "^4"
}
```

**CMS & Database:**
```json
{
  "payload": "3.9.0",
  "@payloadcms/db-postgres": "3.9.0",
  "@payloadcms/richtext-lexical": "3.9.0",
  "@payloadcms/storage-uploadthing": "3.9.0"
}
```

**Plugins:**
```json
{
  "@payloadcms/plugin-form-builder": "3.9.0",
  "@payloadcms/plugin-nested-docs": "3.9.0",
  "@payloadcms/plugin-redirects": "3.9.0",
  "@payloadcms/plugin-search": "3.9.0",
  "@payloadcms/plugin-seo": "3.9.0"
}
```

**UI & Components:**
```json
{
  "@radix-ui/*": "latest",
  "framer-motion": "^12",
  "lucide-react": "^0.378",
  "embla-carousel-react": "^8"
}
```

**Media & Upload:**
```json
{
  "@payloadcms/storage-uploadthing": "3.9.0",
  "sharp": "latest"  // Image optimization
}
```

**Email & Communication:**
```json
{
  "@microsoft/microsoft-graph-client": "^3.0.7",
  "@azure/identity": "^4.13.0",
  "nodemailer": "^7.0.10"
}
```

### 8.2 SSH University Stack

**Frontend:**
```json
{
  "vite": "^7.2.2",
  "react": "^18.3.1",
  "react-router-dom": "^6.25.1",
  "zustand": "^5.0.0",
  "tailwindcss": "^4.1.12"
}
```

**Database & Backend:**
```json
{
  "@supabase/supabase-js": "^2.57.4",
  "express": "^5.1.0",
  "multer": "^2.0.2"
}
```

**Forms & Validation:**
```json
{
  "react-hook-form": "^7.54.2",
  "@hookform/resolvers": "^3.9.1",
  "zod": "^3.24.1"
}
```

**UI & Data Visualization:**
```json
{
  "recharts": "^2.12.7",
  "react-quill": "^2.0.0",
  "@tanstack/react-query": "^5.59.0"
}
```

**File & Media:**
```json
{
  "@uploadthing/react": "^7.3.3",
  "pdfjs-dist": "^5.4.394",
  "@react-pdf/renderer": "^4.3.0"
}
```

---

## 9. Build & Deployment Process

### 9.1 Build Scripts

**Main Build:**
```bash
yarn build
# Runs: yarn build:next && yarn build:ssh
# Output: .next/ folder + public/ssh-app/
```

**Next.js Build:**
```bash
yarn build:next
# Compiles React components
# Generates static pages
# Creates optimized bundles
# Duration: 2-5 minutes
```

**SSH Build:**
```bash
yarn build:ssh
# 1. cd src/SSH && npm install
# 2. npx vite build (outputs to dist/)
# 3. copy-ssh-files.js copies dist/ to public/ssh-app/
# 4. Returns to root directory
```

**Development:**
```bash
yarn dev
# Starts Next.js dev server with Turbo mode
# Port: 3000
# SSH app requires separate: npm run dev (Port: 5174)
```

### 9.2 Build Configuration

**next.config.js - Build Optimizations:**
```javascript
// Experimental features for speed
- turbo build system
- webpack build workers
- parallel CPU usage
- web assembly optimizations

// Caching
- onDemandEntries for page retention
- Production source maps disabled

// Image optimization
- Remote pattern configuration for CDNs
```

### 9.3 Deployment

**Target:** Vercel (Next.js platform)

**Vercel Configuration** (`vercel.json`):
```json
{
  "framework": "nextjs",
  "buildCommand": "yarn build",
  "installCommand": "yarn install",
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "functions": {
    "src/app/api/**/*.js": { "maxDuration": 60 }
  },
  "rewrites": [
    { "/ssh-app": "/ssh-app/index.html" },
    { "/ssh-app/**": "/ssh-app/index.html" }
  ]
}
```

**Environment Variables Required:**
```env
# Database
DATABASE_URI=postgresql://...
PAYLOAD_SECRET=...

# UploadThing
UPLOADTHING_TOKEN=...

# Email
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_FROM_EMAIL=...

# SSH University (Supabase)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Next.js
NEXT_PUBLIC_SERVER_URL=...
```

### 9.4 SSH App Integration

**Build Output Structure:**
```
.next/                    # Next.js build
public/
  └── ssh-app/           # SSH Vite build output
      ├── index.html
      ├── assets/
      │   ├── *.js
      │   └── *.css
      ├── Images/
      └── data/
```

**Rewrite Rules** (Vercel):
```
/ssh-app          → public/ssh-app/index.html
/ssh-app/*        → public/ssh-app/index.html (SPA routing)
/admin            → Payload admin panel
/api/*            → API routes
```

---

## 10. Environment Configuration

### 10.1 Environment Files

**Type Definitions:** `src/environment.d.ts`

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      // ... additional vars
    }
  }
}
```

### 10.2 Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compiler options |
| `tailwind.config.mjs` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS plugins (Tailwind) |
| `eslint.config.mjs` | ESLint rules |
| `components.json` | shadcn/ui component configuration |

### 10.3 CSS Variables

**File:** `src/cssVariables.js`

- Centralized design tokens
- Theme colors, spacing, typography
- Used by Tailwind CSS

---

## 11. Key Architectural Decisions

### 11.1 Separation of Concerns

**Decision:** Two separate applications integrated at build time

**Rationale:**
- Main website: Content-focused, SEO-optimized (Next.js SSG/SSR)
- SSH app: Interactive, real-time (SPA with Vite)
- Each optimized for its use case
- Independent deployment possible (if needed)

### 11.2 Storage Strategy

**Decision:** UploadThing for main site, Supabase for SSH app

**Rationale:**
- UploadThing: Simple, Payload CMS integrated, public CDN
- Supabase: Integrated with auth/DB, row-level security for SSH

### 11.3 Database Separation

**Decision:** PostgreSQL for Payload, Supabase for SSH

**Rationale:**
- Independent scaling
- Different schema requirements
- SSH needs RLS for multi-tenant
- Payload needs simpler, flat structure

### 11.4 Authentication

**Decision:** Payload Auth for main site, Supabase Auth for SSH

**Rationale:**
- Payload auth built-in, simpler for CMS users
- Supabase auth better for complex role-based access
- Can eventually unify with federated auth if needed

### 11.5 UI Component Strategy

**Main Site:** shadcn/ui + Radix UI (complex interactions)
**SSH App:** Custom React components + Tailwind (performance)

---

## 12. Performance Considerations

### 12.1 Build Optimizations

```javascript
// next.config.js optimizations
- Turbo build system (faster compilation)
- Webpack build workers (parallel builds)
- Disable source maps in production
- Skip CSS optimization for speed
- Reduce bundle analyzer overhead
```

### 12.2 Image Optimization

```javascript
// Next.js Image component
- WebP format conversion
- Responsive sizes
- Lazy loading by default
- Remote pattern whitelist for CDNs
- Sharp for backend optimization
```

### 12.3 Database Performance

- Connection pooling (PostgreSQL)
- Index optimization in Supabase
- RLS policies for security without performance penalty
- GraphQL query optimization (Payload)

### 12.4 Frontend Performance

- Code splitting via React Router
- Lazy component loading
- Zustand for minimal state management overhead
- React Query for efficient data fetching

---

## 13. Security Measures

### 13.1 Database Security

- SSL connections in production
- Row-level security (Supabase SSH)
- Connection pooling to prevent abuse
- Secrets not exposed in code

### 13.2 Authentication Security

- JWT tokens with expiration
- HTTP-only cookies (Payload)
- Password hashing (bcrypt)
- Email verification support

### 13.3 API Security

- CORS configured to specific domains
- Rate limiting via API routes
- File upload validation (UploadThing)
- Webhook signature verification (Payload)

### 13.4 Content Security

- Access control on all collections
- Role-based permissions
- Draft/publish workflow
- Admin audit logging (Payload)

---

## 14. File Organization Summary

```
eyogi-main/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (frontend)/         # Public pages
│   │   ├── (payload)/          # Admin panel
│   │   └── api/                # Backend routes
│   ├── collections/            # Payload CMS data models
│   ├── components/             # React components
│   ├── blocks/                 # Page builder blocks
│   ├── fields/                 # Custom field types
│   ├── access/                 # Access control logic
│   ├── lib/                    # Utilities (email, uploads)
│   ├── hooks/                  # Revalidation, hooks
│   ├── providers/              # React context providers
│   ├── SSH/                    # SSH University (Vite SPA)
│   ├── payload.config.ts       # CMS configuration
│   └── payload-types.ts        # Generated types
├── public/
│   ├── ssh-app/                # SSH build output
│   ├── icons/
│   └── Images/
├── next.config.js              # Next.js configuration
├── vercel.json                 # Deployment configuration
├── tailwind.config.mjs          # Tailwind configuration
├── package.json                # Main dependencies
└── copy-ssh-files.js           # Build script
```

---

## 15. Development Workflow

### 15.1 Local Development

```bash
# Terminal 1: Start main website
yarn dev
# Port: 3000, Payload admin: /admin

# Terminal 2: Start SSH app (inside src/SSH)
cd src/SSH
npm run dev
# Port: 5174 (accessed via src/SSH/index.html)

# Note: SSH app requires separate server for uploads
npm run dev:uploadthing
# Port: 3001 (Express server)
```

### 15.2 Making Changes

**Main Website Changes:**
1. Edit in `src/app/` or collections
2. Changes hot-reload in dev mode
3. Test at http://localhost:3000

**SSH App Changes:**
1. Edit in `src/SSH/src/`
2. Changes hot-reload in Vite dev mode
3. Test at http://localhost:5174

**CMS Changes:**
1. Edit collections or globals
2. Restart dev server if schema changes
3. Access at http://localhost:3000/admin

### 15.3 Building for Production

```bash
# Full build (recommended)
yarn build
# Builds Next.js + SSH app + copies SSH to public/

# Individual builds
yarn build:next    # Next.js only
yarn build:ssh     # SSH only

# Clean build
yarn build:clean   # Remove .next and rebuild
```

---

## 16. Known Issues & Considerations

### 16.1 Build Dependencies

- **Database Required During Build:** Payload CMS introspects DB schema at build time
- **SSL Configuration:** PostgreSQL SSL settings must match build environment
- **Node Memory:** Increased to 8GB for large builds (`NODE_OPTIONS=--max-old-space-size=8192`)

### 16.2 SSH App Deployment

- Built as static SPA, served from Next.js public folder
- Real-time features require persistent connection to Express server
- Upload handler needs CORS configuration for cross-origin requests

### 16.3 Multi-Database Complexity

- Two separate databases means two sets of migrations
- Synchronization between user tables required
- Consider federated auth for unified user management

---

## 17. Future Improvements & Recommendations

### 17.1 Short Term

1. **Unify Authentication** - Use Supabase or Auth0 for both platforms
2. **Single Database** - Consolidate to one PostgreSQL with RLS policies
3. **Shared User Model** - Link Payload users to SSH users
4. **API Documentation** - Generate OpenAPI/GraphQL documentation

### 17.2 Medium Term

1. **Mobile Apps** - React Native apps using shared APIs
2. **Real-time Features** - WebSocket support for live notifications
3. **Analytics** - Comprehensive usage tracking
4. **Multitenancy** - Support multiple organizations

### 17.3 Long Term

1. **Microservices** - Extract payment, email, analytics to services
2. **AI Integration** - Course recommendations, grading assistance
3. **Mobile Learning** - Progressive web app capabilities
4. **Internationalization** - Multi-language support

---

## 18. Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates for custom domain
- [ ] Vercel deployment configured
- [ ] Email service credentials working
- [ ] UploadThing token valid
- [ ] Supabase project created
- [ ] RLS policies enabled in Supabase
- [ ] DNS records pointing to Vercel
- [ ] Build completes without errors
- [ ] All tests passing
- [ ] Admin panel accessible
- [ ] SSH app accessible
- [ ] File uploads working
- [ ] Email notifications sending

---

## Conclusion

The eYogi project is a well-architected dual-platform system that effectively separates concerns while maintaining integration. The use of Payload CMS for content management and a custom Vite SPA for the learning management system provides the flexibility needed for both use cases. With proper database management and authentication unification, this system can scale effectively to serve a large user base.

The architecture supports:
- **Content Management** - Easy updates via CMS admin
- **Interactive Learning** - Real-time features in SSH app
- **Media Distribution** - Efficient CDN delivery via UploadThing
- **User Management** - Role-based access control
- **Scalability** - Separate scaling for each component
- **Maintainability** - Clear separation of concerns
