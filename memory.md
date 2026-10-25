# 🧠 Project Memory (`memory.md`)
> **eYogi Ecosystem Architecture, Context, and State Memory**  
> *Last Updated: October 20, 2026*

---

## 1. Project Overview & Dual-Project Architecture

This repository contains a **dual-project educational ecosystem** consisting of two interconnected applications living in a single repository:

```
eyogi-main/
├── (Root: eyogi)                # Project 1: Next.js 15 + PayloadCMS 3.9 + PostgreSQL
│   ├── src/
│   │   ├── app/                # Next.js App Router (frontend, admin, api)
│   │   ├── collections/        # PayloadCMS Content Collections
│   │   ├── blocks/             # Layout and content builder blocks
│   │   ├── globals/            # Global CMS data (Header, Footer, About, Donation)
│   │   ├── components/         # React 19 components & UI primitives
│   │   └── SSH/                # Project 2: Vite + React 18 + Supabase LMS
│   │       ├── src/            # SSH Portal code (Student, Teacher, Parent, Admin)
│   │       ├── migrations/     # Supabase SQL migrations & RLS scripts
│   │       ├── vite.config.ts  # Vite build configuration (base: '/ssh-app/')
│   │       └── package.json    # Independent dependencies for SSH
│   ├── public/
│   │   └── ssh-app/            # Target directory where built SSH dist is copied
│   ├── copy-ssh-files.js       # Sync script moving src/SSH/dist -> public/ssh-app
│   └── package.json            # Root configuration, build scripts, orchestrator
```

### High-Level Roles of the Two Projects

| Dimension | Project 1: **eyogi** (Root) | Project 2: **ssh** (`src/SSH`) |
| :--- | :--- | :--- |
| **Name** | eYogi Main Platform & CMS | SSH (Spiritual & Scriptural Hub) Gurukul University |
| **Primary Role** | Public marketing website, blogs, pages, forms, PayloadCMS admin | Full-featured Learning Management System (LMS) with 4 user portals |
| **Framework** | Next.js 15.1.9 (App Router) | Vite 7.2.2 + React Router v6.25.1 |
| **React Version** | **React 19.0.0** | **React 18.3.1** |
| **Database** | PostgreSQL (Neon serverless) | Supabase PostgreSQL + Auth + Realtime + Storage |
| **ORM / Data Access** | `@payloadcms/db-postgres` (PayloadCMS 3.9) | `@supabase/supabase-js` v2.57.4 |
| **File Storage** | UploadThing CDN | Supabase Storage + UploadThing |
| **Styling** | Tailwind CSS 3.4.3 + Radix UI + Framer Motion | Tailwind CSS 4.1.12 + Headless UI + Framer Motion |
| **Deployment URL** | Root domain (`/`) | Sub-path (`/ssh-app/`) served through Next.js rewrite |

---

## 2. Interconnection & Integration Pipeline

The two projects are built and served cohesively through a multi-stage integration:

### 1. Build Orchestration (`package.json`)
The root `yarn build` triggers both systems:
```bash
yarn build
# Executes:
# 1. cross-env NODE_OPTIONS='--no-deprecation --max-old-space-size=8192' next build
# 2. yarn build:ssh
```

### 2. SSH Build & Asset Sync (`copy-ssh-files.js`)
`yarn build:ssh` executes:
1. `cd src/SSH && npm install && npx vite build`
2. Generates the static single-page application into `src/SSH/dist/` with base path `/ssh-app/`.
3. Returns to root and runs `node copy-ssh-files.js`.
4. `copy-ssh-files.js` recursively copies all contents from `src/SSH/dist/` to `public/ssh-app/`.

### 3. Next.js Routing & Rewrites (`next.config.js`)
Next.js handles requests for the SSH portal by rewriting URL paths to the static HTML bundle:
```javascript
async rewrites() {
  return [
    {
      source: '/ssh-app',
      destination: '/ssh-app/index.html',
    },
    {
      source: '/ssh-app/:path*',
      destination: '/ssh-app/index.html',
      has: [{ type: 'header', key: 'accept', value: '(text/html.*)' }],
    },
    {
      source: '/ssh-app/((?!assets|Images|.*\\..*).*)',
      destination: '/ssh-app/index.html',
    },
  ]
}
```

---

## 3. Project 1: eyogi (Root Next.js + PayloadCMS)

### Tech Stack & Dependencies
- **Runtime / Engine**: Node.js 22.x - 24.x (`package.json` engines specify `node: 24.x`)
- **Package Manager**: Yarn (v1.22+)
- **Core Frameworks**: Next.js 15.1.9, React 19.0.0, React DOM 19.0.0
- **CMS**: PayloadCMS 3.9.0 (`payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/db-postgres`)
- **Rich Text**: `@payloadcms/richtext-lexical`
- **Plugins**:
  - `@payloadcms/plugin-form-builder`
  - `@payloadcms/plugin-seo`
  - `@payloadcms/plugin-search`
  - `@payloadcms/plugin-redirects`
  - `@payloadcms/plugin-nested-docs`
  - `@payloadcms/storage-uploadthing`
- **Database**: PostgreSQL on Neon serverless (`DATABASE_URI`)
- **Styling**: Tailwind CSS 3.4.3, Radix UI primitives, Lucide React, Framer Motion, Lenis smooth scroll

### Directory Structure
```
src/
├── app/
│   ├── (frontend)/           # Public-facing Next.js pages
│   │   ├── [slug]/           # Dynamic CMS page renderer
│   │   ├── about/            # About Us page
│   │   ├── contact/          # Contact page
│   │   ├── donation/         # Donation page
│   │   ├── faq/              # FAQ listing
│   │   ├── forms/            # Dynamic form renderers
│   │   ├── membership/       # Membership page
│   │   ├── privacy-policy/   # Privacy policy page
│   │   ├── search/           # Global search page
│   │   ├── layout.tsx        # Root HTML layout with providers
│   │   └── page.tsx          # Homepage
│   ├── (payload)/            # PayloadCMS admin interface (`/admin`)
│   │   ├── admin/            # Admin route handler
│   │   └── layout.tsx        # Payload admin layout
│   └── api/                  # Next.js API route handlers
├── collections/              # Payload CMS Collections
│   ├── Pages/                # Static & dynamic page models
│   ├── Posts/                # Blog posts with lexical editor
│   ├── Media.ts              # Media uploads via UploadThing
│   ├── Categories.ts         # Categories taxonomy
│   ├── Users/                # CMS admin accounts
│   ├── faq/                  # FAQs and FAQ categories
│   ├── forms/                # Form links
│   ├── membership/           # Memberships
│   ├── PrivacyPolicy/        # Privacy policy configs
│   ├── aboutUs/              # About us details
│   ├── donation/             # Donation records
│   └── Menu/                 # Header & footer dynamic menus
├── blocks/                   # Reusable CMS page builder blocks
│   ├── ArchiveBlock/         # Filterable content archives
│   ├── CallToAction/         # Action prompts with buttons
│   ├── Content/              # Rich text content columns
│   ├── FormBlock/            # Dynamic form embed
│   ├── MediaBlock/           # Images/videos with captions
│   └── Code/                 # Syntax-highlighted code block
├── fields/                   # Reusable Payload field definitions
├── globals/                  # Global collections (Header, Footer)
└── payload.config.ts         # Central Payload configuration
```

### Key Environment Variables (`.env`)
```bash
DATABASE_URI=postgresql://<user>:<password>@<neon-host>/neondb?sslmode=require
PAYLOAD_SECRET=<secure-random-32-char-string>
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
UPLOADTHING_TOKEN=<uploadthing-token>
MICROSOFT_TENANT_ID=<azure-tenant-id>
MICROSOFT_CLIENT_ID=<azure-client-id>
MICROSOFT_CLIENT_SECRET=<azure-client-secret>
MICROSOFT_FROM_EMAIL=noreply@eyogigurukul.com
```

---

## 4. Project 2: ssh (`src/SSH` Gurukul University LMS)

### Tech Stack & Dependencies
- **Build Tool**: Vite 7.2.2
- **Core Library**: React 18.3.1, React DOM 18.3.1 (isolated from root React 19)
- **Routing**: `react-router-dom` 6.25.1 with `base: '/ssh-app/'`
- **Styling**: Tailwind CSS 4.1.12 (`@tailwindcss/postcss`), Headless UI 2.1.9, Lucide React 0.454.0
- **State Management**: Zustand 5.0.0, TanStack React Query 5.59.0
- **Database / Backend**: Supabase (PostgreSQL, Auth, RLS, Storage buckets, Realtime)
- **Local Server**: Express 5.1.0 (`server.mjs`) for UploadThing and API routing
- **Document / PDF Processing**: jsPDF 3.0.3, html2canvas 1.4.1, `@react-pdf/renderer` 4.3.0, `pdfjs-dist`
- **Security & Encryption**: `crypto-js` 4.2.0 for field-level encryption of sensitive child/parent data
- **Rich Text**: Quill 2.0.3, React Quill 2.0.0
- **Testing**: Vitest 4.0.8, `@testing-library/react`, `@testing-library/jest-dom`

### User Portals & Features
1. **Student Portal** (`/dashboard` or role route):
   - Learning dashboard, course catalog, batch enrollment, quiz answers.
   - Progress tracking, module/lesson completions, attendance logs.
   - Certificate viewing and PDF download.
   - Participation consent tracking.
2. **Teacher Portal** (`/dashboard`):
   - Teacher performance metrics, enrolled student lists.
   - Course creation and lesson editing (videos, assignments, quizzes).
   - Batch scheduling, attendance marking, student grading.
   - Teacher code display and management.
3. **Parent Portal** (`/dashboard`):
   - Child profile registration and multi-child management.
   - Parent-child binding with unique access codes.
   - COPPA / GDPR consent management (data processing and course participation).
   - Course discovery, child enrollment, real-time progress monitoring.
4. **Admin & Business Admin Portal** (`/admin/*`):
   - Complete User Management with role-specific codes (`teacher_code`, `parent_code`, `admin_code`).
   - Course Management, Course Assignments, Batch Allocations.
   - Gurukul learning centers management.
   - Enrollment approvals, student transfers, prerequisites overrides.
   - Certificate template generation, automated issuance, and verification.
   - Finance, batch pricing, invoices, and payment tracking.
   - Permission management with granular role-based access control.
   - GDPR deletion requests, audit trails, and compliance reports.

### Key Environment Variables (`src/SSH/.env`)
```bash
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
VITE_ENCRYPTION_KEY=<32-char-encryption-key>
VITE_OPENAI_API_KEY=<openai-api-key>
VITE_MICROSOFT_TENANT_ID=<tenant-id>
VITE_MICROSOFT_CLIENT_ID=<client-id>
VITE_MICROSOFT_CLIENT_SECRET=<client-secret>
VITE_MICROSOFT_FROM_EMAIL=noreply@eyogigurukul.com
```

---

## 5. Critical Gotchas & Architectural Rules

1. **React Version Separation**:
   - `eyogi` uses **React 19**, while `src/SSH` uses **React 18**.
   - **Never run `npm install` at root without understanding peer dependencies**, as packages like `lucide-react@0.378.0` and `@monaco-editor/react` have React 18 peer deps that conflict in npm unless `--legacy-peer-deps` or Yarn resolutions are used.
   - **Always use `yarn` at root** and `npm` or `yarn` within `src/SSH`.

2. **Public Directory Inviolability**:
   - The directory `public/ssh-app/` is **auto-generated** by `copy-ssh-files.js`.
   - **Never edit files in `public/ssh-app/` directly**. Any changes will be overwritten on the next build. Always edit in `src/SSH/`.

3. **Database Segregation**:
   - CMS content and static pages reside in **Neon PostgreSQL** via PayloadCMS.
   - LMS operations, student data, grades, and parent-child links reside in **Supabase PostgreSQL**.
   - Always review existing schema and RLS policies before adding columns or tables.

4. **Field Encryption in SSH**:
   - Sensitive user information (e.g. child DOB, address, parent phone) is encrypted using CryptoJS (`src/SSH/src/lib/encryption.ts`).
   - Always route changes through existing encryption/decryption utilities.

---

## 6. Recent Work & State Log

- **Participation Consent Feature**: Integrated participation consent flows in child and student registration.
- **Teacher Dashboard Batch Handling**: Updated batch handling for enrollments and certificate calculations.
- **Enhanced UI Inputs**: Added `rightIcon` prop support to Input component in SSH.
- **User Management Codes**: Exposed `teacher_code`, `parent_code`, and `admin_code` in User Management tables and modal dialogs.
- **Phase 2 Enterprise Architecture Established**: Created comprehensive [Phase 2 PRD.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20PRD.md), [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md), and [Phase 2 Implementation Plan.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Implementation%20Plan.md) covering:
  - **Single Unified Backend**: Decommissioning of Neon PostgreSQL and PayloadCMS in favor of a single unified Supabase backend powering both `eyogi` and `ssh`.
  - **Custom CMS in SSH Admin Portal**: Consolidating all website CMS operations (Pages, Dynamic Menus, Blogs, FAQs, Media, Donations, Memberships) into the custom CMS inside the SSH Admin Portal.
  - **Next.js 15 App Router Frontend**: Public pages consume content directly from Supabase via server components and ISR caching.
  - Removal of Contact Us page in favor of an omnipresent WhatsApp floating action button on bottom right.
  - Automated SumUp / Stripe donation engine collecting First Name, Last Name, Email, and Phone with webhook verification and PDF tax receipt dispatch.
  - Teacher automated onboarding with Admin-uploaded default/specific documents and mandatory electronic NDA signing flow enforcing pre-approval assignment locks.
  - Public-facing Guru / Teachers directory & SEO profiles with modal overlays, 150-200 word active-voice bios, credentials, and JSON-LD Person schema.
  - Enterprise Document Library supporting DOCX, PPT, PDF with tagging, version control, dynamic entity association, and workflow triggers.
  - Bidirectional feedback engine: Teacher-to-student feedback and Parent-to-course feedback post-completion.
  - Comprehensive Quiz Management with active-batch enforcement, automatic score calculation, and motivational badge awarding for scores $>80\%$.
  - Master Schedule and Teacher Availability Management across Day/Week/Month/Year views with automatic batch schedule generation and proactive conflict prevention.
  - Course Material lifecycle (admin templates, review queue, secure viewer with disabled context menu and download controls).
  - Structured 6-Sub-Phase Implementation Roadmap.
- **Full NPM Vulnerability Remediation (Zero Vulnerabilities Achieved)**:
  - Eliminated all 90 vulnerabilities in root (`eyogi`) and all 42 vulnerabilities in `src/SSH`, achieving `found 0 vulnerabilities` across both projects.
  - Removed obsolete, unused `react-matter-js` dependency that was injecting vulnerable legacy packages (`src`, `underscore`, unpatched `uuid`).
  - Upgraded PayloadCMS dependencies (`payload`, `@payloadcms/*`) to `3.92.0` patch release resolving critical RCE advisory in Form Builder and transitive vulnerabilities.
  - Upgraded `next` to `15.5.28` and `eslint-config-next` to `15.5.28` within Next.js 15 App Router line, eliminating internal PostCSS and Image Optimization vulnerabilities.
  - Added `.npmrc` (`legacy-peer-deps=true`) and `.yarnrc` (`--ignore-engines true`) in root and `src/SSH/.npmrc` to guarantee seamless dependency resolution across Node 24 and dual React versions (React 19 at root, React 18 in SSH).
  - Configured matching `"overrides"` (for npm) and `"resolutions"` (for Yarn) for transitive libraries including `picomatch@4.0.7`, `postcss@8.5.31`, `source-map-js@1.2.2`, `ws@8.22.0`, `yaml@2.9.1`, `tar@7.5.22`, `uuid@11.1.1`, `nanoid@3.3.18`, `effect@3.22.4`, `axios@1.20.0`, `drizzle-orm@0.45.4`, `esbuild@0.28.2`, `image-size@2.0.4`, `file-type@22.2.0`, `@azure/msal-node@7.1.1`, `happy-dom@21.0.4`, `fast-xml-parser@5.11.2`, `immutable@5.1.9`, `js-cookie@3.0.8`, and `ajv@6.14.0`.
  - Pinned `quill` to `2.0.2` and upgraded `react-router-dom` to `^7.18.4` in `src/SSH`.
  - Fixed `tsconfig.json` compiler option `ignoreDeprecations` from `6.0` to `5.0` for TypeScript 5.7+ compatibility.
  - Rebuilt and synchronized both `package-lock.json` and `yarn.lock`.
- **Full Production Build Resolution (`yarn build` Exit Code 0)**:
  - **Next.js App Router Invariant (`/_not-found`)**: Created root [src/app/not-found.tsx](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/app/not-found.tsx) returning `<html><body>` structure to satisfy Next.js 15 route group segregation between `(frontend)` and `(payload)`.
  - **Local PostgreSQL SSL Incompatibility Fix**: In [src/payload.config.ts](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/payload.config.ts), guarded `db.pool.ssl` logic so that when `NODE_ENV=production` during static site generation, SSL is not enforced against `localhost` / `127.0.0.1` unless connecting to a remote Neon instance.
  - **Next.js Turbopack Modernization**: Migrated deprecated `experimental.turbo` configuration in [next.config.js](file:///Users/prashant/Documents/Application%20directory/eyogi-main/next.config.js) to top-level `turbopack`.
  - **Disk Space Exhaustion (`ENOSPC`) Remediation**: Resolved an unexpected disk space error (`ENOSPC: no space left on device`) during Next.js cache writing by purging 11 GB of stale, gitignored `.yarn/cache` from an old Yarn Berry migration, freeing 14 GB of storage on the volume.
  - **Resilient Route Generation & Database Schema Drift Fix (`parse_relation.c errorMissingColumn`)**:
  - Resolved production export failure on `/(frontend)/privacy-policy`: in PostgreSQL `media` table, the column was created as `thumbnail_u_r_l`, whereas `@payloadcms/drizzle@3.92.0` queries `thumbnail_url`. During Next.js static prerendering export, PayloadCMS resolved Lexical richText media links at default depth 2, querying `media` and triggering PostgreSQL `errorMissingColumn` (parse_relation.c:3716).
  - Set `export const dynamic = 'force-dynamic'` and `depth: 0` on both [src/app/(frontend)/privacy-policy/page.tsx](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/app/(frontend)/privacy-policy/page.tsx) and [src/app/(frontend)/donation/page.tsx](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/app/(frontend)/donation/page.tsx) to decouple build-time static exports from database relational lookups.
  - **Vite Build & Minification Optimization (`[vite:terser]` & Circular Chunk Remediation)**:
    - Resolved Vercel build failure where Vite failed with `[vite:terser] terser not found. Since Vite v3, terser has become an optional dependency`:
      1. Switched `minify` from `'terser'` to Vite's high-performance built-in `'esbuild'` in [src/SSH/vite.config.ts](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/SSH/vite.config.ts), cutting SSH client build time in half (from ~12s down to ~6s).
      2. Moved `terser` from `devDependencies` to `dependencies` in [src/SSH/package.json](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/SSH/package.json) and added `--include=dev` to `build:ssh` in root [package.json](file:///Users/prashant/Documents/Application%20directory/eyogi-main/package.json).
    - Eliminated all Rollup circular chunks and chunk-ordering runtime crashes (`Cannot read properties of undefined (reading 'forwardRef')`):
      1. Identified that artificially separating `@headlessui/react` and `lucide-react` into `vendor-ui` while `vendor-react` imported from `admin-misc` created a circular execution graph where React was not initialized when `vendor-ui` invoked `React.forwardRef`.
      2. Removed fragile manual chunks for application components and React UI primitives. Application pages and admin modules are already cleanly code-split on demand via `React.lazy()`.
      3. Restricted `manualChunks` strictly to massive, standalone libraries (`pdfjs-dist`, `jspdf`, `html2canvas`, `quill`, `@supabase`), allowing Rollup to bundle React and its direct component primitives in deterministic evaluation order.
    - Verified full production `yarn build` passes end-to-end with 0 circular chunk warnings, no minifier errors, and exit code 0.


---

## 7. Phase 2 Architectural Blueprint Reference

| Component / Subsystem | Primary Document | Key Technical Artifacts |
| :--- | :--- | :--- |
| **Product Requirements & User Flows** | [Phase 2 PRD.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20PRD.md) | Personas, Gherkin scenarios, acceptance criteria |
| **Technical Design & Schemas** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md) | Database schemas, SumUp API, Multi-Role state machine |
| **WhatsApp Action Button** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#2-public-portal-architecture--whatsapp-action-component) | Fixed bottom-right sticky button, contact page deprecation |
| **Teacher Onboarding & NDA** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#4-teacher-automated-onboarding--mandatory-nda-workflow) | Electronic signature ledger, assignment block trigger |
| **Public Guru Directory & SEO** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#5-public-guru--teachers-directory--seo-profile-architecture) | Tile grid, modal overlay, JSON-LD Person schema |
| **Document Library & Triggers** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#6-enterprise-document-library-architecture) | `document_library`, `document_assignments`, audit trail |
| **Bidirectional Feedback** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#7-bidirectional-feedback-engine) | `student_course_feedback`, `parent_course_feedback` |
| **Quiz Engine & Badges (>80%)** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#8-quiz-engine-grading--motivation-badge-architecture) | `student_badges`, automated badge assignment trigger |
| **Schedule & Availability** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#9-course-schedule--teacher-availability-architecture) | `course_schedules`, `teacher_availability`, conflict function |
| **Course Materials & DRM** | [Phase 2 Design.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Design.md#10-course-material-creation--drm-security-architecture) | `course_materials`, canvas viewer, right-click disabled |
| **6-Stage Implementation Plan**| [Phase 2 Implementation Plan.md](file:///Users/prashant/Documents/Application%20directory/eyogi-main/Phase%202%20Implementation%20Plan.md) | 6 Sub-Phases, tasks, schemas, test gates |



