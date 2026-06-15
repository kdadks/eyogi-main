# eYogi Architecture - Quick Reference Guide

## 🎯 System Overview

**eYogi** = PayloadCMS Main Website + SSH University (Learning Management System)

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 Server                      │
├──────────────────────┬──────────────────────────────────────┤
│  Main Website        │  API Routes / Backend                │
│  (PayloadCMS)        │                                      │
│                      │  • Authentication                    │
│  • Pages/Posts       │  • Uploads (UploadThing)            │
│  • Media Library     │  • Email Service                    │
│  • Admin Panel       │  • Enrollments                      │
│  • SEO/Search        │  • Certificate Generation           │
└──────────────────────┴──────────────────────────────────────┘
                    ↓
        ┌───────────────────────┬─────────────────┐
        ↓                       ↓                 ↓
   PostgreSQL         SSH Supabase         UploadThing
   (Payload CMS)      (SSH App)            (Media CDN)
```

---

## 📁 Two Separate Applications

### 1. Main Website (Next.js + Payload CMS)
- **Location:** `src/` root level
- **Port:** 3000
- **Database:** PostgreSQL (Neon compatible)
- **Purpose:** Public website + CMS admin
- **Deploy:** Vercel
- **Routes:**
  - Public: `/`, `/about`, `/blogs`, `/faq`, etc.
  - Admin: `/admin` (PayloadCMS)
  - API: `/api/*`

### 2. SSH University (Vite + React SPA)
- **Location:** `src/SSH/`
- **Port:** 5174 (dev) | `/ssh-app` (production)
- **Database:** Supabase (PostgreSQL with RLS)
- **Purpose:** Learning management system
- **Build:** Independent Vite build → copied to `public/ssh-app/`
- **Routes:**
  - Student: `/ssh-app/student`
  - Teacher: `/ssh-app/teacher`
  - Parent: `/ssh-app/parent`
  - Admin: `/ssh-app/admin`

---

## 🗄️ Collections (Data Models)

### Content Collections
| Name | Slug | Stores | Access |
|------|------|--------|--------|
| Pages | `pages` | Website pages | Public (when published) |
| Posts | `posts` | Blog articles | Public (when published) |
| Media | `media` | Uploaded files | Public read |
| Categories | `categories` | Post categories | Public read |
| FAQ | `faq` | FAQ items | Public read |
| FAQ Categories | `categoriesfaq` | FAQ grouping | Public read |

### Business Collections
| Name | Slug | Stores | Access |
|------|------|--------|--------|
| Users | `users` | CMS admin accounts | Authenticated only |
| Membership | `membership` | Membership tiers | Authenticated |
| Form Links | `formLinks` | External forms | Authenticated |

### Global Content (Singletons)
| Name | Slug | Purpose |
|------|------|---------|
| About Us | `aboutUs` | Global about page |
| Privacy Policy | `privacyPolicy` | Legal docs |
| Donation | `donation` | Donation page |

---

## 🔧 Key Technologies

### Main Website
```
Framework:    Next.js 15.1.9
CMS:          Payload CMS 3.9.0
Editor:       Lexical (rich text)
Database:     PostgreSQL
Storage:      UploadThing
UI:           React 19 + Tailwind CSS + Radix UI
Email:        Microsoft Graph API
Deploy:       Vercel
```

### SSH University
```
Framework:    Vite + React 18.3.1
Database:     Supabase (PostgreSQL + RLS)
State:        Zustand
Routing:      React Router v6
UI:           React + Tailwind CSS
Upload:       UploadThing
Server:       Express.js
PDF:          jsPDF + React-PDF
```

---

## 📡 API Architecture

### Authentication Endpoints
```
POST   /api/auth/register                 - User signup
POST   /api/auth/login                    - User login
POST   /api/auth/reset-password           - Password reset
POST   /api/auth/password-reset-confirmation - Confirm reset
```

### Upload Endpoints
```
POST   /api/uploadthing/route             - File upload (UploadThing)
```

### SSH University Endpoints
```
POST   /api/enrollments                   - Enroll in course
POST   /api/certificate-issued            - Generate certificate
```

### Payload CMS API
```
GET/POST /admin/                          - Admin panel
GraphQL  /api/graphql                     - GraphQL endpoint
REST     /api/*                           - REST endpoints
```

---

## 🔐 Access Control Model

### Three-tier Access System

```typescript
anyone()                   // Public access
authenticated()            // Must be logged in
authenticatedOrPublished() // Admins see all, public sees published only
```

### Collection Permissions Example
```
Pages:
  - create:   authenticated (admin only)
  - read:     authenticatedOrPublished (published visible to all)
  - update:   authenticated (admin only)
  - delete:   authenticated (admin only)

Media:
  - create:   authenticated (admin only)
  - read:     anyone (public can download)
  - update:   authenticated (admin only)
  - delete:   authenticated (admin only)
```

---

## 🗄️ Database Setup

### Main Website (PostgreSQL)
```env
DATABASE_URI=postgresql://user:pass@host:5432/payload
```
- Schema: Payload CMS collections
- Connection pooling enabled
- SSL in production

### SSH University (Supabase)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```
- Row-level security (RLS) for multi-tenant
- Built-in authentication
- Real-time subscriptions support

### Tables in Each DB

**Payload (PostgreSQL):**
- users, pages, posts, media, categories, faq, membership, formlinks
- payload_locked_documents, payload_preferences, redirects, search

**Supabase (SSH):**
- users, students, teachers, parents, admins
- gurus_gurus (gurukulls), courses, lessons, enrollments
- assignments, submissions, attendance, certificates

---

## 📦 UploadThing Integration

### Configuration
```typescript
// Supported file types:
- Images:   8MB max, 10 files
- Videos:   32MB max, 5 files
- Audio:    16MB max, 5 files
- PDFs:     8MB max, 5 files
- Text:     2MB max, 5 files
- Blob:     8MB max, 10 files
```

### Access
- **Payload CMS:** Automatic handling via storage plugin
- **SSH App:** Express server handler + React upload component
- **CDN:** Served via `*.uploadthing.com` and `utfs.io`

### Image Optimization
```javascript
// Next.js automatically optimizes:
- WebP conversion
- Responsive sizing
- Lazy loading
```

---

## 🛠️ Build Process

### Complete Build
```bash
yarn build
# 1. Builds Next.js app
# 2. Builds SSH Vite app
# 3. Copies SSH dist/ → public/ssh-app/
# 4. Output: .next/ + public/ssh-app/
```

### Individual Builds
```bash
yarn build:next      # Next.js only
yarn build:ssh       # SSH only (with npm install)
yarn dev             # Dev server (port 3000)
```

### SSH Build Details
```bash
cd src/SSH
npm install
npx vite build       # Builds to dist/
cd ../..
node copy-ssh-files.js  # Copies to public/ssh-app/
```

---

## 🌐 Deployment (Vercel)

### Environment Variables Required
```env
# Database
DATABASE_URI=postgresql://...
PAYLOAD_SECRET=secret_key_here

# UploadThing
UPLOADTHING_TOKEN=...

# Microsoft Graph (Email)
MICROSOFT_TENANT_ID=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_FROM_EMAIL=...

# Supabase (SSH App)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Next.js
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

### Build Command
```json
{
  "buildCommand": "yarn build",
  "installCommand": "yarn install"
}
```

### Rewrites (URL Routing)
```json
{
  "/ssh-app": "/ssh-app/index.html",
  "/ssh-app/**": "/ssh-app/index.html",
  "/admin/**": "/admin/**",
  "/api/**": "/api/**"
}
```

---

## 👥 SSH User Roles

### Roles & Permissions
```typescript
Role              | Can View                    | Can Edit
-----------------|-----------------------------|--------------
student           | Own courses, grades, certs  | Own profile
teacher           | Assigned courses, students  | Grades, materials
parent            | Child's progress            | Own profile
admin             | All courses, all users      | Everything
business_admin    | Organization data           | Org settings
super_admin       | Full system access          | Full system
```

### User Fields
```typescript
- email, password_hash
- full_name, avatar_url
- role: 'student' | 'teacher' | 'parent' | 'admin' | etc.
- status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
- student_id, teacher_code, parent_id, admin_code
- created_at, updated_at
```

---

## 📋 Payload CMS Collections Config

### Example: Posts Collection
```typescript
{
  slug: 'posts',
  access: {
    create: authenticated,           // Admin only
    read: authenticatedOrPublished,  // Published visible to all
    update: authenticated,
    delete: authenticated
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText' },
    { name: 'categories', type: 'relationship', relationTo: 'categories' },
    { name: 'authors', type: 'relationship', relationTo: 'users' },
    { name: 'publishedAt', type: 'date' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    // + SEO fields from plugin
  ]
}
```

---

## 🔌 Payload CMS Plugins

| Plugin | Purpose | Config |
|--------|---------|--------|
| **Form Builder** | Create custom forms | Hidden from admin |
| **SEO Plugin** | Meta tags, Open Graph | Custom title/URL generation |
| **Redirects** | URL redirects | Applied to pages/posts |
| **Search** | Full-text search | Posts only |
| **UploadThing Storage** | File storage | Media collection |
| **Nested Docs** | Hierarchical docs | Optional |

---

## 📧 Email Service

### Configuration
```env
MICROSOFT_TENANT_ID=your_tenant
MICROSOFT_CLIENT_ID=your_client
MICROSOFT_CLIENT_SECRET=your_secret
MICROSOFT_FROM_EMAIL=sender@domain.com
```

### Service
```typescript
// src/lib/email/graphEmailService.ts
Uses Microsoft Graph API to send emails
Supports: To, CC, BCC, HTML body
Fallback: Nodemailer if Graph API unavailable
```

### Triggers
- User registration notification
- Password reset emails
- Welcome messages
- SSH enrollment confirmation

---

## 🚀 Local Development

### Terminal 1: Main Website
```bash
yarn dev
# http://localhost:3000      - Website
# http://localhost:3000/admin - Payload admin panel
```

### Terminal 2: SSH University
```bash
cd src/SSH
npm run dev
# http://localhost:5174 - SSH app (dev mode)
```

### Terminal 3: Upload Server (if needed)
```bash
cd src/SSH
npm run dev:uploadthing
# http://localhost:3001 - Upload handler
```

---

## 📊 Performance Features

### Build Optimizations
- Turbo build system for faster compilation
- Webpack build workers for parallel builds
- On-demand entries for faster dev reloads
- Disabled source maps in production

### Image Optimization
- WebP format with fallback
- Automatic resizing
- Lazy loading
- CDN distribution via UploadThing

### Database
- Connection pooling
- Supabase RLS for security
- Query optimization
- Caching where applicable

### Frontend
- Code splitting with React Router
- Lazy component loading
- Zustand for minimal state overhead
- React Query for efficient data fetching

---

## ⚠️ Important Considerations

### Build Requirements
- ✅ PostgreSQL must be running during build (Payload introspects schema)
- ✅ SSL configuration must match environment
- ✅ Node memory increased to 8GB for large builds

### Database Separation
- Two databases = two schema migrations
- User tables exist in both (Payload + Supabase)
- Consider future unification via federated auth

### SSH App Deployment
- Built as static SPA from Vite
- Copied to `public/ssh-app/` during Next.js build
- Served from Vercel as static files
- Real-time features require persistent API connection

---

## 🔍 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails on DB connection | Ensure PostgreSQL running, check SSL settings |
| SSH app not loading | Verify `public/ssh-app/` exists after build |
| File uploads failing | Check UploadThing token, verify CORS settings |
| Admin panel not accessible | Verify PAYLOAD_SECRET environment variable |
| Email not sending | Check Microsoft Graph credentials in .env |
| Supabase RLS errors | Verify RLS policies enabled, check auth token |

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `src/payload.config.ts` | CMS main configuration |
| `src/collections/` | Data model definitions |
| `src/app/(frontend)/` | Public pages/routing |
| `src/app/(payload)/` | Admin panel routes |
| `src/app/api/` | Backend API endpoints |
| `src/SSH/src/App.tsx` | SSH app entry point |
| `next.config.js` | Next.js build config |
| `vercel.json` | Deployment config |
| `package.json` | Dependencies + build scripts |
| `ARCHITECTURE_ANALYSIS.md` | Full architecture documentation |

---

## 🎓 Learning Path

1. **Start with:** Main website structure (`src/app/` and `src/collections/`)
2. **Then:** Understand Payload CMS admin panel and collections
3. **Next:** Study SSH University (`src/SSH/src/`)
4. **Advanced:** API routes, authentication, and deployment

---

Generated: 2026-06-15
For detailed information, see: `ARCHITECTURE_ANALYSIS.md`
