# 🧪 Quality Assurance & Testing Suite (`Test.md`)
> **Comprehensive Test Strategy, Test Scenarios, and Verification Matrix for eYogi Ecosystem**  
> *Last Updated: October 20, 2026*

---

## 1. Testing Architecture Overview

Due to the dual-project nature of this repository, testing is segregated across both distinct applications and the overarching integration pipeline:

```
Testing Matrix:
├── [1] Root Project (eyogi: Next.js 15 + PayloadCMS 3.9)
│   ├── Static Analysis & Type Checking (TypeScript 5.7, ESLint 9)
│   ├── PayloadCMS Admin & Collections Integrity
│   ├── Next.js App Router Page & Block Rendering
│   └── API Routes & Form Submissions
│
├── [2] Sub-Project (ssh: Vite 7 + React 18 + Supabase)
│   ├── Unit & Integration Tests (Vitest, React Testing Library)
│   ├── TypeScript Type Checking (TypeScript 5.9 `tsc --noEmit`)
│   ├── Role-Based Workflow Validation (Student, Parent, Teacher, Admin)
│   ├── Supabase Row-Level Security (RLS) & Auth Policies
│   └── Encryption & PDF / Certificate Generation
│
└── [3] Cross-Project Integration & Deployment Build
    ├── Full Build Orchestration (`yarn build`)
    ├── Asset Syncing (`copy-ssh-files.js`)
    └── Static Routing & Rewrites (`/ssh-app/` under Next.js)
```

---

## 2. Command Cheat Sheet

### Root Project (`eyogi`) Commands
Run from the repository root `/Users/prashant/Documents/Application directory/eyogi-main`:

```bash
# 1. Type Check Next.js & Payload types
npx tsc --noEmit

# 2. Run ESLint across Next.js project
yarn lint

# 3. Automatically fix ESLint issues
yarn lint:fix

# 4. Generate Payload types if schema modified
yarn generate:types

# 5. Build Next.js application only (skipping SSH)
yarn build:next

# 6. Full production build (Next.js + SSH build + file copy)
yarn build
```

### SSH Portal (`src/SSH`) Commands
Run from the `src/SSH` directory:

```bash
# Navigate to SSH directory
cd src/SSH

# 1. Run Vitest Unit Tests
npm test
# OR
npm run test -- --run

# 2. Run Vitest with Interactive UI
npm run test:ui

# 3. Run Vitest with Code Coverage Report
npm run test:coverage

# 4. TypeScript Type Checking
npm run type-check

# 5. Lint SSH codebase
npm run lint

# 6. Check Supabase Row-Level Security (RLS) status
npm run rls:check

# 7. Generate RLS security scripts
npm run rls:generate

# 8. Build Vite application
npm run build
```

---

## 3. Test Suites & Verification Checklists

### Suite A: Root Project (`eyogi`) - Next.js & PayloadCMS

#### TC-EY-01: PayloadCMS Admin & Authentication
- [ ] Access `/admin` in local environment (`http://localhost:3000/admin`).
- [ ] Verify `BeforeLogin` custom view renders correctly.
- [ ] Successfully authenticate with admin credentials.
- [ ] Verify `BeforeDashboard` component renders.
- [ ] Verify all registered collections are visible:
  - `Pages`, `Posts`, `Media`, `Categories`, `CategoriesFaq`, `Faq`, `Users`, `Membership`, `FormLinks`.
- [ ] Verify globals are accessible: `AboutUs`, `PrivacyPolicy`, `Donation`.

#### TC-EY-02: CMS Dynamic Page & Block Rendering
- [ ] Create/Edit a Page containing `ArchiveBlock`. Verify posts display with correct filtering.
- [ ] Verify `CallToAction` block renders configured buttons and styles.
- [ ] Verify `Content` block renders Lexical rich-text components without hydration errors.
- [ ] Verify `MediaBlock` displays UploadThing media with responsive sizing and captions.
- [ ] Verify `Code` block formats and syntax-highlights code snippets properly.

#### TC-EY-03: Media Upload & UploadThing Storage
- [ ] Upload test image (PNG/JPEG) through PayloadCMS Media collection.
- [ ] Confirm asset is uploaded to UploadThing and returns valid CDN URL.
- [ ] Verify image loads in frontend components with Next.js `<Image />` optimization.
- [ ] Verify non-image files (PDFs) can be uploaded and linked.

#### TC-EY-04: Dynamic Forms & Email Dispatch
- [ ] Submit a contact form from frontend page.
- [ ] Verify form validation prevents invalid submissions (Zod / React Hook Form).
- [ ] Confirm form submission entry is stored in database.
- [ ] If email notifications configured, verify Microsoft Graph / SMTP dispatch executes without unhandled errors.

---

### Suite B: SSH Portal (`src/SSH`) - Gurukul University LMS

#### TC-SSH-01: Student Workflow
- [ ] **Registration & Auth**: Sign up new student; verify email/password validation.
- [ ] **Participation Consent**: Verify student participation consent prompt appears and records status upon registration.
- [ ] **Course Catalog**: Navigate `/courses`, filter by category/gurukul, view course details (`/courses/:id`).
- [ ] **Enrollment**: Request enrollment into an open batch; verify prerequisite validation.
- [ ] **Course Progress**: Open enrolled course modules and mark lessons complete; check progress bar calculation.
- [ ] **Assessments & Quizzes**: Submit quiz answers; check `/quiz-answer` view.
- [ ] **Certificate**: Upon 100% course completion, verify certificate is unlocked and downloadable as PDF.

#### TC-SSH-02: Parent Workflow & COPPA/GDPR Compliance
- [ ] **Parent Registration**: Register new parent account.
- [ ] **Child Registration**: Add child profile under Parent Dashboard.
- [ ] **Data Consent**: Verify GDPR/COPPA consent form displays required disclosures before registration succeeds.
- [ ] **Parent-Student Binding**: Verify parent code / student code links the parent to the student record (`ParentStudentBinding`).
- [ ] **Child Course Enrollment**: Parent enrolls child into a course batch; verify child appears in batch roster.
- [ ] **Progress Monitoring**: Parent views child attendance, quiz grades, and certificate achievements.

#### TC-SSH-03: Teacher Workflow & Batch Operations
- [ ] **Teacher Dashboard**: Verify assigned batches and courses render on `/dashboard`.
- [ ] **Teacher Code**: Verify `teacher_code` displays in teacher profile and management views.
- [ ] **Content Management**: Teacher adds/edits module lessons and attaches PDF / video resources.
- [ ] **Attendance**: Mark daily attendance for batch students (`attendance_tables.sql`).
- [ ] **Grading**: Grade assignments and provide textual feedback to students.
- [ ] **Completion Approval**: Approve student course completion and trigger certificate eligibility.

#### TC-SSH-04: Admin & Business Admin Workflow
- [ ] **Admin Authentication**: Access `/admin` route via `AdminLogin` component.
- [ ] **User Management**:
  - Filter users by role (Student, Teacher, Parent, Admin).
  - Verify `teacher_code`, `parent_code`, and `admin_code` display in listing and modals.
  - Test role modification and permission assignment.
- [ ] **Course & Batch Management**:
  - Create new course and assign instructors.
  - Create new batch with seat limit, dates, and pricing.
  - Bulk transfer students between batches.
- [ ] **Gurukul Management**: Create and configure local learning center (Gurukul).
- [ ] **Compliance & GDPR**:
  - Process GDPR data deletion request (`GDPRDeletionManagement`).
  - Verify audit logs capture critical user actions (`AuditTrailManagement`).
- [ ] **Invoicing & Finance**: Generate invoice for enrollment; verify payment status tracking.

#### TC-SSH-05: Security, Encryption & Storage
- [ ] **Field Encryption**: Verify sensitive user data (address, phone, DOB) is encrypted in Supabase using `src/SSH/src/lib/encryption.ts`.
- [ ] **Supabase RLS**: Run `npm run rls:check` in `src/SSH` to ensure no unprotected tables are exposed.
- [ ] **Certificate PDF Generation**: Test jsPDF + html2canvas generation across desktop and mobile viewports.

---

### Suite C: Cross-Project Integration & Build Validation

#### TC-INT-01: Full Production Build & Distribution Check
- [ ] Run `yarn build` at project root.
- [ ] Verify Next.js completes build into `.next/`.
- [ ] Verify Vite completes build into `src/SSH/dist/`.
- [ ] Verify `copy-ssh-files.js` executes and copies output to `public/ssh-app/`.
- [ ] Verify `public/ssh-app/index.html` exists and contains valid script/link tags pointing to `/ssh-app/assets/`.
- [ ] Run `yarn start` and confirm `/ssh-app` loads the SSH SPA without 404 or MIME type errors.

### Suite D: Phase 2 Revamp Test Suites & Acceptance Verification

#### TC-P2-01: SumUp Automated Donation & Tax Receipt Dispatch
- [ ] **Hosted Checkout Creation**: Trigger `/api/donations/checkout` with amount ($50, $100, custom) and frequency; verify valid SumUp `checkout_id` returns.
- [ ] **Webhook Signature Verification**: Send test webhook payload to `/api/donations/sumup-webhook`; verify rejection if HMAC header invalid.
- [ ] **Payment Status Transition**: Confirm webhook with valid signature updates `donation_records` in Supabase to `PAID`.
- [ ] **Receipt PDF & Email**: Verify automated PDF receipt generation with sequential tax ID and delivery via email within 60s.
- [ ] **Gift Aid / Tax Exemption**: Verify donor tax declaration flags persist in database.


#### TC-P2-02: Multi-Role Engine & Role Switcher
- [ ] **Role Association**: Link multiple roles (`['parent', 'teacher', 'student']`) to a single user in `user_roles`.
- [ ] **Nav Dropdown**: Verify top navigation renders Role Switcher when `roles.length > 1`.
- [ ] **Context Switching**: Switch from `parent` to `teacher`; verify UI morphs to Teacher Dashboard without page reload or relogin.
- [ ] **Route Guarding**: Verify non-teacher role cannot access `/dashboard/teacher-tools` even when typed in address bar.

#### TC-P2-03: Embedded Onboarding & Document Verification Modal
- [ ] **Modal PDF Reader**: Verify documents (Safeguarding Policy, Code of Conduct) render directly in modal via PDF.js.
- [ ] **Digital E-Signature**: Verify "I agree" checkbox requires scrolling to bottom and captures timestamp + IP address.
- [ ] **Document Upload**: Test drag-and-drop of photo ID/certifications to Supabase `onboarding-secure-docs` bucket.
- [ ] **Admin Approval**: Verify Teacher Admin / Super Admin can review uploaded docs and approve/reject with notes.

#### TC-P2-04: Academic Enhancements (Library, Guru's Page, Schedule, Policies)
- [ ] **Digital Library**: Test keyword search, language filter (Sanskrit/English), and playback in `ChantAudioPlayer`.
- [ ] **Guru Directory & Profile**: Verify teacher bio, lineage, and linked courses render on `/gurus/:id` and in modal overlay.
- [ ] **Unified Timetable**: Verify local timezone auto-detection and collision prevention algorithm.
- [ ] **Policy Center**: Verify versioned policies display on `/policies` and track mandatory acceptance.

#### TC-P2-05: Quiz Management & Taking Engine
- [ ] **Active Batch Enforcement**: Attempt to publish quiz to inactive batch; verify system blocks with error: "Quizzes can only be sent to active batches".
- [ ] **Publish Notification**: Verify publishing quiz to active batch triggers email notification to students and parents with direct quiz link.
- [ ] **Unauthenticated Deep Link**: Click quiz link while logged out; verify redirection to login page and automatic forwarding to quiz on successful authentication.
- [ ] **Draft Saving**: Student clicks "Save and submit later"; verify draft status commits without alerting teacher.
- [ ] **Submission Flow**: Student clicks "Save & Submit"; verify submitted status commits and teacher receives notification.
- [ ] **Grading & Percentage**: Teacher marks answers correct/incorrect; verify automated percentage score calculation and feedback display.
- [ ] **Badge Awarding (>80%)**: For scores strictly $>80\%$, verify motivational badge is auto-assigned to student profile and displays on student & parent dashboards.
- [ ] **Quiz Cloning**: Teacher selects existing quiz and clicks "Clone"; verify duplicate draft created with unique ID and editable questions.

#### TC-P2-06: Teacher Onboarding NDA & Assignment Blocking
- [ ] **Mandatory NDA Prompt**: Register as teacher; verify immediate prompt for electronic NDA signing within embedded modal.
- [ ] **Pre-Approval Block**: Attempt to assign registered teacher who has not yet been approved by admin; verify system blocks assignment.
- [ ] **Admin Approval Flow**: Admin reviews credentials and signed NDA, clicks "Approve"; verify status updates to Active and teacher code generates.
- [ ] **Course Assignment Unlock**: Verify newly approved teacher is now eligible for course/batch assignment.

#### TC-P2-07: Course Schedule Management (Admin & Teacher)
- [ ] **Multi-View Rendering**: Test calendar across Day, Week, Month, and Year views in both Admin and Teacher portals.
- [ ] **Active Batch Auto-Generation**: Verify schedules automatically generate for active batches and appear on assigned teacher's calendar.
- [ ] **Conflict Detection**: Attempt to schedule a session when the teacher already has an overlapping session; verify system identifies conflict and blocks save.
- [ ] **Filters & Navigation**: Test filtering by Course, Batch, Teacher, Status, and navigating between Previous, Next, and Today.

#### TC-P2-08: Teacher Availability Management
- [ ] **Availability Calendar**: Teacher views availability calendar across Day, Week, and Month views.
- [ ] **Specific & Recurring Availability**: Teacher configures specific dates/times and recurring weekly slots; verify Admin can view availability.
- [ ] **Unavailability Marking**: Teacher marks date as unavailable; verify Admin is alerted if future session creates conflict.
- [ ] **Batch Assignment Warning**: Admin attempts to assign teacher to a batch outside their available time; verify availability warning displays.

#### TC-P2-09: Course Material Lifecycle & DRM Security
- [ ] **Template Definition**: Business Admin defines UI-based material template; verify availability for teachers when no materials exist.
- [ ] **Teacher Draft & Review**: Teacher drafts material using template and submits; verify status updates to "Pending Approval" and alerts Admins.
- [ ] **Approval & Rejection**: Admin approves submission (status "Published") or rejects with mandatory feedback (status "Changes Requested").
- [ ] **DRM Protection**: Open uploaded PDF/PPT material in portal; verify right-click context menu is disabled, and download/save buttons are suppressed.
- [ ] **External Video Embedding**: Admin adds YouTube/OneDrive video link; verify video streams in embedded frame without local download controls.

#### TC-P2-10: Bidirectional Feedback Engine
- [ ] **Teacher-to-Student Feedback**: Teacher submits performance feedback; verify visibility to Business Admin, Parent, and Student.
- [ ] **Parent-to-Course Feedback**: Post course completion, parent submits course feedback; verify visibility to Teachers and Business Admin.

#### TC-P2-11: Public Guru Directory & SEO Profiles
- [ ] **Tile Grid & Modal Overlay**: Navigate to `/gurus`; verify active teacher tiles display headshot and name. Click tile; verify modal overlay displays extended bio and credentials without page navigation.
- [ ] **Self-Service Update**: Teacher updates profile picture and bio; verify instant database save, in-portal notification, and immediate update on public page.
- [ ] **Admin Update**: Admin updates teacher details on their behalf; verify immediate database commit and reflection on public directory.

---

## 4. Test Execution Log & Status Matrix

| Test Suite / Area | Primary Tool | Command | Target Pass Criteria | Current Status | Last Verified |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Root NPM Audit** | npm audit | `npm audit` | 0 vulnerabilities | 🟢 PASSED (0 vulns) | Oct 25, 2026 |
| **SSH NPM Audit** | npm audit | `cd src/SSH && npm audit` | 0 vulnerabilities | 🟢 PASSED (0 vulns) | Oct 25, 2026 |
| **Root Type Check** | TypeScript | `npx tsc --noEmit` | 0 errors | 🟡 Pending Run | - |
| **Root Linting** | ESLint | `yarn lint` | 0 errors | 🟡 Pending Run | - |
| **Next.js Build** | Next.js | `yarn build:next` | Successful bundle | 🟢 PASSED | Oct 25, 2026 |
| **SSH Unit Tests** | Vitest | `cd src/SSH && npm test` | All passing | 🟡 Pending Run | - |
| **SSH Type Check** | TypeScript | `cd src/SSH && npm run type-check` | 0 errors | 🟡 Pending Run | - |
| **SSH Linting** | ESLint | `cd src/SSH && npm run lint` | 0 errors | 🟡 Pending Run | - |
| **SSH RLS Check** | TSX / Script | `cd src/SSH && npm run rls:check` | RLS enabled on all tables | 🟡 Pending Run | - |
| **SSH Vite Build** | Vite | `cd src/SSH && npm run build` | Dist output created | 🟢 PASSED | Oct 25, 2026 |
| **End-to-End Build**| Orchestrator | `yarn build` | Next + SSH + Assets copied | 🟢 PASSED | Oct 25, 2026 |
| **Sub-Phase 1: SumUp Donations** | Vitest / Next | `yarn test -- donations` | Automated receipts & webhooks | ⚪ Planned Sub-Phase 1 | - |
| **Sub-Phase 2: Teacher NDA & Roles** | Vitest / RTL | `cd src/SSH && npm test -- onboarding` | NDA signing & assignment locks | ⚪ Planned Sub-Phase 2 | - |
| **Sub-Phase 3: Gurus & Doc Library** | Vitest / RTL | `cd src/SSH && npm test -- gurus` | Modal overlay & document assignments | ⚪ Planned Sub-Phase 3 | - |
| **Sub-Phase 4: Schedule & Availability**| Vitest / RTL | `cd src/SSH && npm test -- schedule` | Conflict detection & calendar | ⚪ Planned Sub-Phase 4 | - |
| **Sub-Phase 5: Quiz & Badges (>80%)** | Vitest / RTL | `cd src/SSH && npm test -- quiz` | Score calc, badges & cloning | ⚪ Planned Sub-Phase 5 | - |
| **Sub-Phase 6: Materials DRM & Feedback**| Vitest / RTL | `cd src/SSH && npm test -- materials` | Secure viewer & feedback loops | ⚪ Planned Sub-Phase 6 | - |

*(Note: Agents must update this table after executing any test suites or validating fixes).*

---

## 5. Defect Reporting Template

When any test fails, document the failure using this standard format in agent output and update `Test.md`:

```markdown
### 🐞 Defect Report: [Short Title]
- **ID**: DEF-[YYYYMMDD]-[Index]
- **Target Subsystem**: [eyogi (root) | ssh (src/SSH) | Integration]
- **Severity**: [Critical / High / Medium / Low]
- **Test Case**: [e.g. TC-SSH-01]
- **Reproduction Steps**:
  1. ...
  2. ...
- **Expected Outcome**: ...
- **Actual Outcome**: ...
- **Root Cause Analysis**: ...
- **Resolution Plan**: ...
```

---

### 🐞 Resolved Build Defect Log (Oct 24 - 25, 2026)

#### DEF-20261024-01: Next.js Invariant `/_not-found` Page Missing
- **Target Subsystem**: `eyogi (root)` Next.js App Router
- **Severity**: High (Blocks `yarn build`)
- **Test Case**: TC-INT-01
- **Actual Outcome**: `[Error: Invariant: no direct app page entry found for /_not-found]` during static prerendering.
- **Root Cause**: Next.js 15 requires a root-level `src/app/not-found.tsx` containing `<html><body>` tags when route groups `(frontend)` and `(payload)` have segregated root layouts.
- **Resolution**: Created [src/app/not-found.tsx](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/app/not-found.tsx) returning standard 404 UI.

#### DEF-20261024-02: PayloadCMS Local PostgreSQL SSL Rejection During Production Build
- **Target Subsystem**: `eyogi (root)` PayloadCMS
- **Severity**: High (Blocks `yarn build`)
- **Test Case**: TC-INT-01
- **Actual Outcome**: `Error: cannot connect to Postgres. Details: The server does not support SSL connections`.
- **Root Cause**: `src/payload.config.ts` was setting `ssl: { rejectUnauthorized: false }` purely based on `process.env.NODE_ENV === 'production'` even when connecting to local PostgreSQL on `127.0.0.1`.
- **Resolution**: Added condition to ensure `ssl: false` when `DATABASE_URI` points to `localhost`, `127.0.0.1`, or is empty.

#### DEF-20261024-03: Disk Exhaustion `ENOSPC` During Production Cache Write
- **Target Subsystem**: Build Environment (macOS filesystem)
- **Severity**: Critical (Blocks all writes)
- **Test Case**: TC-INT-01
- **Actual Outcome**: `[Error: ENOSPC: no space left on device, write]`.
- **Root Cause**: A stale, gitignored `.yarn/cache` directory left behind from an earlier Yarn Berry migration was occupying 11 GB of storage on a full 228 GB APFS container, leaving only 119 MB free.
- **Resolution**: Deleted `.yarn/cache` and reset `.next`, freeing 14 GB of storage on `/System/Volumes/Data`.

#### DEF-20261025-01: PostgreSQL errorMissingColumn on `/(frontend)/privacy-policy` during Production Build
- **Target Subsystem**: `eyogi (root)` Next.js Static Export & PayloadCMS
- **Severity**: Critical (Blocks Vercel & Production `yarn build`)
- **Test Case**: TC-INT-01
- **Actual Outcome**: `Export encountered an error on /(frontend)/privacy-policy/page: /privacy-policy, exiting the build. parse_relation.c line 3716 errorMissingColumn: column "thumbnail_url" does not exist`.
- **Root Cause**: Next.js static prerendering export evaluated `/privacy-policy` at build time. Lexical richText content in the privacy policy global referenced media elements. PayloadCMS 3.92.0 queried the PostgreSQL `media` table for `thumbnail_url`, but in the database the column was created as `thumbnail_u_r_l`.
- **Resolution**: 
  1. Configured `export const dynamic = 'force-dynamic'` and `depth: 0` on [src/app/(frontend)/privacy-policy/page.tsx](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/app/(frontend)/privacy-policy/page.tsx) and [src/app/(frontend)/donation/page.tsx](file:///Users/prashant/Documents/Application%20directory/eyogi-main/src/app/(frontend)/donation/page.tsx).
  2. Implemented resilient `try...catch` blocks with complete fallback UI containing full official text.
  3. Verified `yarn build` produces exit code 0.

#### DEF-20261025-02: Vite Terser Not Found, Circular Chunks & forwardRef Undefined during SSH Production Build
- **Target Subsystem**: `ssh (src/SSH)` Vite & Rollup Bundler
- **Severity**: Critical (Blocks Vercel & Production `yarn build`)
- **Test Case**: TC-INT-01
- **Actual Outcome**: `error during build: [vite:terser] terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.` accompanied by `Circular chunk: vendor-misc -> vendor-react -> vendor-misc` and browser runtime error `Uncaught TypeError: Cannot read properties of undefined (reading 'forwardRef') at vendor-ui.js`.
- **Root Cause**: 
  1. `src/SSH/vite.config.ts` explicitly set `minify: !isDev ? 'terser' : false`, while `terser` was only in `devDependencies`. During Vercel's production install, devDependencies were excluded, causing Vite to fail finding Terser.
  2. Forcing React UI components (`@headlessui/react`, `lucide-react`) into `vendor-ui` while `vendor-react` imported from `admin-misc` created a circular chunk execution cycle where `React` was not yet initialized when `vendor-ui` invoked `React.forwardRef`.
- **Resolution**:
  1. Switched minifier in `src/SSH/vite.config.ts` to Vite's native `esbuild` (`minify: !isDev ? 'esbuild' : false`), cutting build time to ~6s.
  2. Moved `terser` to `dependencies` in `src/SSH/package.json` and added `--include=dev` to root `package.json`'s `build:ssh`.
  3. Simplified `manualChunks` to strictly isolate heavy standalone libraries (`pdfjs-dist`, `jspdf`, `html2canvas`, `quill`, `@supabase`). Let Rollup bundle React with its immediate UI primitives and keep application pages code-split on demand via `React.lazy()`.
  4. Verified full production `yarn build` passes cleanly with 0 circular chunk warnings, no minifier errors, and exit code 0.

