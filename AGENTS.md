# eYogi Gurukul - AI Agent Context Guide

**Last Updated**: October 1, 2025  
**Project Version**: 1.0  
**Purpose**: Comprehensive project context for AI coding agents

---

## 🎯 Project Overview

eYogi Gurukul is a dual-architecture educational platform consisting of:

1. **eyogi-main**: Primary Next.js + PayloadCMS application (content management & public website)
2. **ssh-app**: Nested React + Vite application (student management system & learning portal)

### Key Architecture Decision
The project uses a **nested architecture** where `ssh-app` is embedded within `eyogi-main` and served at the `/ssh-app/` route after build.

---

## 📁 Project Structure

```
eyogi-main/                           # Root project (Next.js + PayloadCMS)
├── src/
│   ├── app/                          # Next.js 15 app directory
│   │   ├── (frontend)/              # Public-facing pages
│   │   ├── (payload)/               # PayloadCMS admin
│   │   └── api/                     # API routes
│   ├── collections/                  # PayloadCMS collections
│   │   ├── Pages.ts
│   │   ├── Posts.ts
│   │   ├── Media.ts
│   │   ├── Users.ts
│   │   ├── membership/
│   │   └── faq/
│   ├── components/                   # Reusable React components
│   ├── blocks/                       # PayloadCMS blocks
│   ├── payload.config.ts             # PayloadCMS configuration
│   └── SSH/                          # ⚠️ NESTED ssh-app PROJECT
│       ├── src/
│       │   ├── App.tsx              # Main SSH app entry
│       │   ├── AdminApp.tsx         # Admin app entry
│       │   ├── components/
│       │   │   ├── admin/           # Admin components
│       │   │   ├── auth/            # Authentication
│       │   │   ├── teacher/         # Teacher components
│       │   │   └── layout/          # Layout components
│       │   ├── pages/
│       │   │   ├── auth/
│       │   │   │   ├── SignInPage.tsx
│       │   │   │   └── SignUpPage.tsx
│       │   │   └── dashboard/
│       │   │       ├── StudentDashboard.tsx
│       │   │       ├── TeacherDashboard.tsx
│       │   │       ├── AdminDashboard.tsx
│       │   │       └── parents/ParentsDashboard.tsx
│       │   ├── lib/
│       │   │   ├── supabase.ts      # Supabase client
│       │   │   └── auth.ts          # Auth utilities
│       │   └── types/index.ts       # TypeScript types
│       ├── package.json             # SSH-app dependencies
│       ├── vite.config.ts           # Vite configuration (base: '/ssh-app/')
│       └── dist/                    # Build output (gitignored)
├── public/
│   ├── ssh-app/                     # ⚠️ SSH build files copied here
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   └── ssh/                         # Legacy location (deprecated)
├── copy-ssh-files.js                # Post-build script
├── package.json                     # Root dependencies
├── next.config.js                   # Next.js configuration
└── tsconfig.json                    # TypeScript configuration
```

---

## 🔧 Technology Stack

### eyogi-main (Main Application)
- **Framework**: Next.js 15.1.0 (App Router, React Server Components)
- **CMS**: PayloadCMS 3.9.0
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Payload's Postgres adapter
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 3.4.3
- **File Storage**: UploadThing
- **Email**: Resend
- **Package Manager**: Yarn

### ssh-app (Nested Application)
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.4.2
- **Database**: Supabase (PostgreSQL)
- **UI Library**: Headless UI, Heroicons
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS 4.1.12
- **Routing**: React Router DOM 6.25.1
- **Forms**: React Hook Form + Zod
- **PDF Generation**: @react-pdf/renderer, jsPDF
- **Package Manager**: npm

---

## 🚀 Build Process & Critical Workflow

### ⚠️ CRITICAL: Build Order & File Copying

**The ssh-app MUST be built and its files copied to `public/ssh-app/` for the application to function correctly.**

### Build Commands

#### Full Build (Recommended)
```bash
yarn build
```
**What it does:**
1. Builds Next.js application (`next build`)
2. Changes directory to `src/SSH`
3. Installs ssh-app dependencies (`npm install --include=dev`)
4. Builds ssh-app with Vite (`npx vite build`)
5. Returns to root directory
6. Runs `copy-ssh-files.js` script
7. Copies `src/SSH/dist/*` → `public/ssh-app/`

#### Next.js Only Build
```bash
yarn build:next
```

#### SSH-app Only Build
```bash
yarn build:ssh
```
**What it does:**
```bash
cd src/SSH && npm install --include=dev && npx vite build && cd ../.. && node copy-ssh-files.js
```

### copy-ssh-files.js Script
**Location**: `/copy-ssh-files.js`

**Purpose**: Copies ssh-app build output to Next.js public directory

**Source**: `src/SSH/dist/`  
**Destination**: `public/ssh-app/`

**Why This Matters**: 
- Next.js serves static files from the `public/` directory
- ssh-app is accessed at `https://yourdomain.com/ssh-app/`
- Vite builds with `base: '/ssh-app/'` in `vite.config.ts`
- Without this copy step, ssh-app routes will 404

### Development Workflow

#### Start Main App (Next.js)
```bash
yarn dev
# Runs on http://localhost:3000
```

#### Start SSH-app (Development Mode)
```bash
cd src/SSH
npm run dev
# Runs on http://localhost:5174
```

**⚠️ Important**: During development:
- Main app runs on port 3000
- SSH-app runs on port 5174 (separate Vite server)
- For production preview, always run full build

---

## 👥 User Roles & Access Control

### ssh-app Roles

#### 1. Super Admin
- **Login Route**: `/ssh-app/admin/login`
- **Dashboard**: Full system access
- **Permissions**: All features + role management

#### 2. Admin
- **Login Route**: `/ssh-app/admin/login`
- **Dashboard**: `/ssh-app/admin`
- **Permissions**: 
  - Certificate Management
  - Course Management
  - Enrollment Management
  - Student Management
  - Gurukul Management
  - Content Management
  - Batch Management

#### 3. Business Admin
- **Login Route**: `/ssh-app/admin/login`
- **Dashboard**: Business analytics & management
- **Permissions**: Same as Admin (business-focused features)

#### 4. Teacher
- **Login Route**: `/ssh-app/login`
- **Dashboard**: `/ssh-app/teacher`
- **Permissions**:
  - View assigned courses
  - Manage enrolled students
  - Grade assignments
  - Course content (limited)
  - Batch management (limited)

#### 5. Student
- **Login Route**: `/ssh-app/login`
- **Dashboard**: `/ssh-app/student`
- **Permissions**:
  - View enrolled courses
  - Access course materials
  - Submit assignments
  - View certificates
  - Track progress

#### 6. Parent
- **Login Route**: `/ssh-app/login`
- **Dashboard**: `/ssh-app/parent`
- **Permissions**:
  - View child's progress
  - View child's courses
  - Communicate with teachers
  - View certificates

### Role Hierarchy
```
super_admin
├── admin
│   └── business_admin
├── teacher
└── parent
    └── student
```

### Permission Matrix (usePermissions.ts)

| Component | super_admin | admin | business_admin | teacher | student | parent |
|-----------|-------------|-------|----------------|---------|---------|--------|
| AdminDashboard | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| CertificateManagement | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| CourseManagement | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| EnrollmentManagement | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| StudentManagement | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| GurukulManagement | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| TeacherDashboard | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| StudentDashboard | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| ParentDashboard | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 🗄️ Database Architecture

### Main Database (Neon PostgreSQL)
**Used by**: eyogi-main (PayloadCMS)

**Key Tables:**
- `pages` - CMS pages
- `posts` - Blog posts
- `media` - Uploaded files
- `users` - CMS users
- `categories` - Content categories
- `faq` - FAQ items
- `membership` - Membership types
- `forms` - Form submissions

**Connection**: `DATABASE_URI` environment variable

### SSH Database (Supabase)
**Used by**: ssh-app

**Key Tables:**
- `users` - SSH app users (students, teachers, admin)
  - Columns: id, email, password_hash, full_name, role, status, student_id, teacher_id, parent_id, etc.
- `gurukuls` - Educational institutions
- `courses` - Course catalog
- `enrollments` - Student-course relationships
- `batches` - Course batches
- `batch_students` - Student-batch assignments
- `certificates` - Course completion certificates
- `assignments` - Course assignments
- `grades` - Student grades

**Connection**: 
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY` (admin operations)

**Auth Strategy**: Custom auth with local storage (no Supabase auth session persistence)

---

## 🔐 Authentication & Authorization

### eyogi-main Authentication
- **System**: PayloadCMS built-in auth
- **Location**: `/admin` route
- **Session**: JWT-based
- **Users**: Stored in PayloadCMS `users` collection

### ssh-app Authentication
- **System**: Custom authentication with Supabase
- **Login Routes**:
  - Admin: `/ssh-app/admin/login`
  - Users: `/ssh-app/login`
- **Session Management**: Custom (localStorage: `eyogi-ssh-app-auth-v2`)
- **Protection**: 
  - `ProtectedRoute` component (students, teachers, parents)
  - `AdminProtectedRoute` component (admin, business_admin, super_admin)
- **Auth State**: Managed in `lib/auth.ts`

**⚠️ Important**: Supabase client configured with `persistSession: false` to prevent auth conflicts

---

## 🌐 Routing Structure

### Main App Routes (Next.js)
```
/                           # Homepage
/about                      # About page
/blog                       # Blog listing
/blog/[slug]               # Blog post detail
/membership                 # Membership info
/faq                       # FAQ page
/admin                     # PayloadCMS admin
/api/*                     # API routes
/ssh-app/*                 # SSH-app (static files from public/ssh-app/)
```

### SSH-app Routes (React Router)
```
/ssh-app/                           # Homepage
/ssh-app/about                      # About
/ssh-app/courses                    # Course listing
/ssh-app/courses/:slug              # Course detail
/ssh-app/gurukul                    # Gurukul listing
/ssh-app/gurukul/:id                # Gurukul detail
/ssh-app/contact                    # Contact page

# Authentication
/ssh-app/login                      # User login (student/teacher/parent)
/ssh-app/signup                     # User registration
/ssh-app/admin/login                # Admin login

# Dashboards
/ssh-app/student                    # Student dashboard
/ssh-app/teacher                    # Teacher dashboard
/ssh-app/parent                     # Parent dashboard
/ssh-app/admin                      # Admin dashboard
/ssh-app/admin/*                    # Admin sub-routes
```

---

## 📦 Environment Variables

### eyogi-main (.env in root)
```bash
# Database
DATABASE_URI=postgresql://user:pass@host/db?sslmode=require

# PayloadCMS
PAYLOAD_SECRET=your-secret-key-min-32-chars

# Next.js
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# File Uploads
UPLOADTHING_TOKEN=your-uploadthing-token

# Email
RESEND_API_KEY=your-resend-api-key

# Optional
DISABLE_IMAGE_OPTIMIZE=1
```

### ssh-app (.env in src/SSH/)
```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🛠️ Development Commands

### Root Project (eyogi-main)
```bash
# Install dependencies
yarn install

# Development server
yarn dev                    # Next.js dev server (port 3000)

# Build
yarn build                  # Full build (Next.js + ssh-app)
yarn build:next            # Next.js only
yarn build:ssh             # ssh-app only

# Start production server
yarn start

# Linting
yarn lint
yarn lint:fix

# PayloadCMS
yarn payload               # Payload CLI
yarn generate:types        # Generate TypeScript types

# Deployment
yarn deploy                # Run deploy.js script
```

### SSH-app (src/SSH/)
```bash
# Install dependencies
npm install

# Development
npm run dev                # Vite dev server (port 5174)
npm run dev:admin         # Admin mode (port 5174)

# Build
npm run build             # Production build

# Preview
npm run preview           # Preview production build

# Type checking
npm run type-check

# Testing
npm run test
npm run test:ui
npm run test:coverage

# Database types
npm run db:generate-types
```

---

## 🎨 UI Component Libraries

### Main App
- **Radix UI**: Headless components
  - Accordion, Dialog, Navigation Menu, Select, Tabs, Toast, etc.
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **shadcn/ui patterns**: Custom component architecture

### SSH-app
- **Headless UI**: Unstyled accessible components
- **Heroicons**: Icon library
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animations
- **React Quill**: Rich text editor
- **Recharts**: Data visualization

---

## 🚨 Common Issues & Solutions

### Issue 1: 404 on /ssh-app routes after deployment
**Cause**: Build files not copied to `public/ssh-app/`

**Solution**:
```bash
yarn build:ssh
# Or full rebuild
yarn build
```

**Verify**: Check that `public/ssh-app/index.html` exists

### Issue 2: SSH-app assets 404 (CSS, JS)
**Cause**: Vite base path mismatch

**Solution**: Verify `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/ssh-app/', // Must match Next.js route
  // ...
})
```

### Issue 3: Authentication not persisting in ssh-app
**Cause**: Session storage conflicts

**Solution**: Check `lib/supabase.ts`:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: 'eyogi-ssh-app-auth-v2',
  },
})
```

### Issue 4: Build fails with "Cannot find module"
**Cause**: Dependencies not installed in ssh-app

**Solution**:
```bash
cd src/SSH
npm install --include=dev
cd ../..
yarn build:ssh
```

### Issue 5: Role-based access not working
**Cause**: Permission check failing

**Solution**: Verify user role in database and check `usePermissions.ts` hook

---

## 📝 Code Patterns & Best Practices

### Naming Conventions
- **Components**: PascalCase (`StudentDashboard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase with Interface prefix (`interface User {}`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_STUDENTS`)

### File Organization
```
component/
├── ComponentName.tsx       # Component logic
├── ComponentName.test.tsx  # Tests
├── index.ts               # Re-exports
└── types.ts               # Component-specific types
```

### Import Order
1. React & external libraries
2. Internal components
3. Utilities & helpers
4. Types
5. Styles

### TypeScript
- **Strict mode enabled**
- Always define types for props
- Use interfaces over types for objects
- Avoid `any` - use `unknown` if necessary

### State Management
- **Local state**: `useState` for component state
- **Global state**: Zustand (ssh-app)
- **Server state**: TanStack Query (ssh-app)
- **Form state**: React Hook Form

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Context:', error)
  toast.error('User-friendly message')
}
```

---

## 🔄 Deployment Workflow

### Vercel Deployment (Recommended)
**Configuration**:
```json
// vercel.json (optional - Vercel auto-detects Next.js)
{
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "yarn install"
}
```

**Process**:
1. Push to GitHub (main branch)
2. Vercel auto-deploys
3. ssh-app built and copied automatically via build script
4. Environment variables set in Vercel dashboard

**Vercel Setup Steps**:
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - **Build Command**: `yarn build`
   - **Output Directory**: `.next`
   - **Install Command**: `yarn install`
   - **Node Version**: 20.x
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URI`
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL`
   - `UPLOADTHING_TOKEN`
   - `RESEND_API_KEY`
4. Deploy

**Important**: Vercel automatically runs the build command which includes `yarn build:ssh`, ensuring ssh-app files are copied to `public/ssh-app/`.

### Manual Deployment
```bash
# 1. Build
yarn build

# 2. Verify ssh-app files
ls public/ssh-app/  # Should see index.html, assets/

# 3. Deploy to Vercel
vercel --prod
```

### Post-Deployment Checklist
- [ ] Main site loads (`/`)
- [ ] Admin panel accessible (`/admin`)
- [ ] SSH-app loads (`/ssh-app/`)
- [ ] SSH-app authentication works
- [ ] Database connections successful
- [ ] File uploads working
- [ ] API routes responding
- [ ] Environment variables configured correctly
- [ ] Check Vercel build logs for errors

---

## 🧪 Testing

### Main App
- Manual testing recommended
- PayloadCMS has built-in validation

### SSH-app
- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Coverage**: Available via `npm run test:coverage`

---

## 📚 Key Files Reference

### Configuration Files
| File | Purpose | Location |
|------|---------|----------|
| `next.config.js` | Next.js configuration | Root |
| `payload.config.ts` | PayloadCMS configuration | `src/` |
| `vite.config.ts` | SSH-app Vite config | `src/SSH/` |
| `tailwind.config.mjs` | Main Tailwind config | Root |
| `tsconfig.json` | Main TypeScript config | Root |
| `copy-ssh-files.js` | Build copy script | Root |

### Entry Points
| File | Purpose | Location |
|------|---------|----------|
| `src/app/layout.tsx` | Next.js root layout | Main app |
| `src/SSH/src/main.tsx` | SSH-app entry | SSH-app |
| `src/SSH/src/App.tsx` | SSH-app main component | SSH-app |
| `src/SSH/src/AdminApp.tsx` | SSH-app admin entry | SSH-app |

### Key Type Definitions
| File | Purpose | Location |
|------|---------|----------|
| `src/payload-types.ts` | PayloadCMS types (generated) | Main app |
| `src/SSH/src/types/index.ts` | SSH-app types | SSH-app |

---

## 🎓 Learning Resources

### Documentation
- **Next.js 15**: https://nextjs.org/docs
- **PayloadCMS 3.9**: https://payloadcms.com/docs
- **React 19**: https://react.dev
- **Vite 5**: https://vitejs.dev
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Project-Specific Docs
- `README.md` - Developer onboarding
- `PRD.md` - Product requirements
- `DEPLOYMENT.md` - Deployment guide
- `src/SSH/README.md` - SSH-app specific guide

---

## 🤝 Contributing Guidelines

### Before Making Changes
1. Read this AGENTS.md file completely
2. Understand the dual-architecture pattern
3. Check existing code patterns
4. Review related components

### Making Changes to eyogi-main
1. Create feature branch from `main`
2. Make changes in `src/` directory
3. Test with `yarn dev`
4. Run `yarn lint:fix`
5. Build with `yarn build`
6. Commit with descriptive message
7. **Update AGENTS.md** if changes affect architecture

### Making Changes to ssh-app
1. Navigate to `src/SSH/`
2. Make changes in `src/` directory
3. Test with `npm run dev`
4. Run type check: `npm run type-check`
5. Build with `npm run build`
6. **CRITICAL**: Run `node ../../copy-ssh-files.js` from SSH directory
7. Test in production mode: `cd ../.. && yarn build && yarn start`
8. **Update AGENTS.md** if changes affect architecture

### ⚠️ CRITICAL: When to Update AGENTS.md

**ALWAYS update this file when making:**

#### Major Changes (Required)
- [ ] New user roles or permission changes
- [ ] Database schema changes (new tables, columns)
- [ ] New authentication methods
- [ ] Routing changes (new routes or route structure)
- [ ] Build process modifications
- [ ] Deployment workflow changes
- [ ] New external services or APIs
- [ ] Technology stack changes (new libraries, frameworks)
- [ ] Environment variable changes

#### Medium Changes (Strongly Recommended)
- [ ] New feature modules or components
- [ ] New API endpoints
- [ ] Configuration file changes
- [ ] New pages or dashboards
- [ ] State management changes
- [ ] New development commands
- [ ] File structure reorganization
- [ ] New common issues discovered

#### Minor Changes (Optional)
- [ ] Bug fixes that don't affect architecture
- [ ] UI/styling updates
- [ ] Content updates
- [ ] Minor refactoring

**How to Update AGENTS.md:**
1. Locate the relevant section(s)
2. Update with clear, concise information
3. Add to "Common Issues & Solutions" if applicable
4. Update version number and last updated date at top
5. Test that your documentation is accurate
6. Commit AGENTS.md with your feature branch

**Example Commit Message:**
```
feat: Add parent dashboard feature

- Implemented parent dashboard with student progress tracking
- Added new route /ssh-app/parent/progress
- Updated AGENTS.md with new route and permission info
```

### Code Review Checklist
- [ ] Code follows existing patterns
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] No console.logs in production code
- [ ] Component is reusable/maintainable
- [ ] Mobile-responsive (if UI component)
- [ ] Accessibility considered
- [ ] Performance optimized
- [ ] **AGENTS.md updated (if major/medium changes)**

---

## 🚧 Known Limitations & Future Enhancements

### Current Limitations
1. **Single Language**: English only (i18n not implemented)
2. **Build Time**: ssh-app adds ~30s to build time
3. **Development UX**: Requires two dev servers for full testing
4. **SSR for SSH**: ssh-app is SPA (no server-side rendering)

### Planned Enhancements
1. Implement i18n for multi-language support
2. Optimize build process (parallel builds)
3. Integrate ssh-app into Next.js app directory
4. Add comprehensive test coverage
5. Implement CI/CD pipelines
6. Add monitoring & analytics

---

## 📞 Support & Maintenance

### Getting Help
1. Check this AGENTS.md file
2. Review README.md files
3. Check GitHub Issues
4. Review code comments
5. Contact project maintainer

### Maintenance Tasks
- **Weekly**: Dependency updates (security patches)
- **Monthly**: Full dependency audit
- **Quarterly**: Architecture review
- **As Needed**: Performance optimization

---

## ✅ Quick Reference Checklist

### When Starting New Feature
- [ ] Understand which part (main/ssh-app) is affected
- [ ] Review related components
- [ ] Check existing patterns
- [ ] Create types if needed
- [ ] Plan component structure

### Before Committing
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Manual testing completed
- [ ] Build succeeds

### Before Deployment
- [ ] Full build successful
- [ ] ssh-app files copied to public/ssh-app/
- [ ] Environment variables configured
- [ ] Database migrations applied (if any)
- [ ] Test all user roles
- [ ] Test critical user flows
- [ ] **AGENTS.md updated with any new changes**

---

## 🔑 Critical Reminders for AI Agents

1. **ALWAYS run full build** (`yarn build`) before deployment
2. **ssh-app changes require** running `copy-ssh-files.js`
3. **Two separate databases**: Neon (main) and Supabase (ssh-app)
4. **Role-based access**: Check permissions before implementing features
5. **Base path is critical**: Vite config must have `base: '/ssh-app/'`
6. **No session persistence**: Custom auth in ssh-app
7. **TypeScript strict mode**: Always type everything
8. **Mobile-first**: All UI components must be responsive
9. **⚠️ UPDATE AGENTS.md**: When making major/medium changes, AI agents MUST update this file with:
   - New routes, roles, or permissions
   - Database schema changes
   - Build process modifications
   - New environment variables
   - Common issues encountered
   - Architecture changes

---

## 📝 Document Maintenance

**Last Updated**: October 1, 2025  
**Document Version**: 1.0  
**Next Review**: Update with every major/medium feature change

### Update History
- **v1.0** (Oct 1, 2025): Initial comprehensive documentation
  - Documented dual-architecture pattern
  - Added all user roles and permissions
  - Documented build process and deployment workflow
  - Added common issues and solutions

### Maintenance Responsibilities
- **AI Agents**: Must update this file when making major/medium code changes
- **Developers**: Review and update quarterly or when architecture changes
- **Project Lead**: Approve significant documentation changes

---

**End of Document**

*🚨 IMPORTANT: AI agents must treat this document as a living guide and update it whenever making significant changes to the codebase. This ensures all future agents and developers have accurate, up-to-date information about the project.*
