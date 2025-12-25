# eYogi Gurukul - Comprehensive Education Platform

A dual-platform educational ecosystem combining **PayloadCMS-powered main website** with a **full-featured SSH (Spiritual and Scriptural Hub) University management system**. Built with Next.js 15, React 19, and PostgreSQL.

## 🌟 Platform Overview

This project consists of two integrated platforms:

1. **Main eYogi Website** - Public-facing content management system built with PayloadCMS
2. **SSH University** - Complete learning management system with student, teacher, parent, and admin portals

---

## 📦 Main eYogi Website Features (PayloadCMS)

### Content Management System
- **Dynamic Pages** - Create and manage pages with flexible block-based layouts
- **Blog System** - Full-featured blogging with categories, tags, and rich text editor
- **Media Library** - Centralized media management with UploadThing integration
- **Rich Text Editor** - Lexical-based editor with syntax highlighting, embedded media, and custom blocks

### Page Builder Blocks
- **Archive Block** - Display posts by collection or manual selection with filtering
- **Call-to-Action** - Customizable CTA sections with links and styling
- **Content Block** - Rich text content with advanced formatting
- **Media Block** - Image/video embeds with captions and layouts
- **Form Block** - Dynamic form builder with custom fields
- **Code Block** - Syntax-highlighted code snippets for documentation

### Content Collections
- **Pages** - Static pages (About, Contact, Services, etc.)
- **Posts** - Blog articles with SEO optimization
- **Media** - File uploads (images, videos, PDFs)
- **Categories** - Post categorization with hierarchical structure
- **FAQ** - Frequently Asked Questions with categories
- **Membership** - Membership information and pricing
- **Form Links** - External form integration

### Global Content Management
- **About Us** - Global about page with gallery and team info
- **Privacy Policy** - Legal documentation management
- **Donation** - Donation page with payment integration
- **Dynamic Menus** - Header and footer menu management through CMS

### Built-in Plugins
- **Form Builder** - Create custom forms with validation and submissions
- **SEO Plugin** - Automated meta tags, Open Graph, and XML sitemap
- **Redirects** - Manage URL redirects with pattern matching
- **Search** - Full-text search across content collections
- **Nested Docs** - Hierarchical document structures

### Admin Features (PayloadCMS)
- **User Management** - Role-based access control (Admin, Editor, Viewer)
- **Media Management** - Upload, organize, and optimize media files
- **Version Control** - Track changes with draft/publish workflows
- **Live Preview** - Real-time content preview before publishing
- **Access Control** - Granular permissions per collection/field
- **Webhooks** - Trigger external services on content changes
- **Admin UI Customization** - Branded admin panel with custom views

---

## 🎓 SSH University Platform Features

### Student Portal
**Dashboard & Overview**
- Personal learning dashboard with progress tracking
- Course enrollment and registration system
- Certificate showcase and downloads
- Learning streak tracking and achievements
- Real-time progress analytics
- Personalized course recommendations

**Course Management**
- Browse available courses with filters and search
- View course details (syllabus, prerequisites, duration)
- Enroll in courses with prerequisite validation
- Access course materials (videos, documents, assignments)
- Track module and lesson completion
- Submit assignments and projects
- Take quizzes and assessments

**Progress & Performance**
- Overall progress percentage per course
- Module-wise completion tracking
- Batch performance insights
- Learning analytics and time spent
- Grade history and feedback
- Attendance records
- Certificate generation upon completion

**Interactive Features**
- AI-powered chatbot for assistance
- Discussion forums per course
- Peer collaboration tools
- Teacher messaging system
- Notifications for deadlines and updates

### Teacher Portal
**Dashboard & Analytics**
- Teacher performance dashboard
- Student engagement metrics
- Course analytics and insights
- Attendance tracking and reports
- Assessment statistics

**Course Management**
- Create and edit courses with rich content
- Organize courses into modules and lessons
- Upload course materials (videos, PDFs, links)
- Set prerequisites and requirements
- Create assignments with rubrics
- Design quizzes and assessments
- Schedule course batches

**Student Management**
- View enrolled students per course/batch
- Track individual student progress
- Grade assignments and provide feedback
- Approve/reject enrollment requests
- Manage student attendance
- Issue certificates upon completion
- Communicate with students

**Batch Management**
- Create and manage course batches
- Set batch schedules (start/end dates)
- Assign students to batches
- Monitor batch progress
- Track batch-specific metrics

**Content Creation**
- Rich text lesson editor
- Video embedding and hosting
- Interactive coding exercises
- Quiz builder with multiple question types
- Assignment templates
- Resource library management

### Parent Portal
**Child Management**
- Register and manage multiple children
- View children's profiles and progress
- Manage consent for data processing (COPPA/GDPR compliant)
- Monitor learning activities
- Access performance reports

**Enrollment & Courses**
- Browse courses for children
- Enroll children in courses
- Track enrollment status and approvals
- View course details and requirements
- Monitor course completion

**Progress Monitoring**
- Real-time progress tracking per child
- Certificate achievements
- Attendance reports
- Performance analytics
- Learning insights and recommendations

**Communication**
- Receive enrollment confirmations via email
- Get progress notifications
- Access teacher feedback
- View important announcements

### Admin/Business Admin Portal
**User Management**
- Create and manage all user types (Students, Teachers, Parents, Admins)
- Role-based access control with granular permissions
- Bulk user operations (import, export, deactivate)
- User profile management with field-level encryption
- Account activation/deactivation
- Password reset and security management
- User audit trails

**Course Management**
- Create and edit courses with full control
- Manage course assignments to teachers
- Set course visibility and availability
- Configure prerequisites and dependencies
- Monitor course enrollments
- Archive/restore courses
- Course analytics and reporting

**Batch Management**
- Create batch instances for courses
- Assign teachers to batches
- Set batch capacity and pricing
- Schedule batch timelines
- Assign students to batches (individual or bulk)
- Track batch performance and completion rates
- Batch-level analytics

**Enrollment Management**
- View all enrollment requests with filters
- Approve/reject enrollments with notifications
- Bulk enrollment operations
- Transfer students between batches
- Monitor enrollment statistics
- Handle enrollment disputes
- Prerequisite validation override

**Gurukul Management**
- Create and manage multiple gurukuls (learning centers)
- Assign courses to specific gurukuls
- Track gurukul-specific metrics
- Manage gurukul administrators
- Monitor performance by location
- Gurukul-wise student and teacher allocation

**Certificate Management**
- Auto-generate certificates on course completion
- Custom certificate templates with Supabase storage
- Certificate verification system with unique IDs
- Bulk certificate operations
- Download and email certificates
- Certificate analytics and reports
- PDF generation and delivery

**Content Management**
- Manage all course content system-wide
- Review and approve teacher submissions
- Version control for course materials
- Media library management
- Content publishing workflows
- Bulk content operations

**Analytics & Reporting**
- System-wide analytics dashboard
- Student performance reports
- Teacher effectiveness metrics
- Course completion statistics
- Revenue and enrollment trends
- Attendance analytics
- Certificate issuance reports
- Export data to CSV/Excel
- Custom report generation

**Compliance & Security**
- GDPR compliance management
- Data deletion requests handling (right to be forgotten)
- Consent management (COPPA/GDPR)
- Audit trail for all system actions
- User data encryption (CryptoJS)
- Privacy policy enforcement
- Data export capabilities
- Compliance reporting

**Financial Management**
- Invoice generation and management
- Payment tracking and processing
- Revenue reports by course/batch
- Batch pricing management
- Refund handling
- Financial analytics

**Permission Management**
- Create custom roles with specific permissions
- Assign permissions by resource and action
- Role hierarchy and inheritance
- Per-user permission overrides
- Permission audit logs
- Fine-grained access control

**Media Management**
- Centralized media library
- File upload and organization
- Image optimization and compression
- Video hosting integration
- Storage analytics and quotas
- Bulk media operations

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 15.1.0 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4 + Radix UI primitives
- **Animations**: Framer Motion + Motion library
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: React Context + Custom hooks
- **Icons**: Heroicons + Lucide React

### Backend & CMS
- **CMS**: PayloadCMS 3.9.0 with TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: PayloadCMS Postgres Adapter
- **Authentication**: Supabase Auth + PayloadCMS Auth
- **File Storage**: UploadThing CDN + Supabase Storage
- **Rich Text**: Lexical Editor

### SSH University Tech
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage (buckets)
- **Email**: Microsoft Graph API + Nodemailer SMTP
- **AI**: OpenAI GPT integration for chatbot
- **Encryption**: CryptoJS for sensitive data
- **PDF Generation**: jsPDF for certificates

### Developer Tools
- **Language**: TypeScript 5.7
- **Linting**: ESLint 9 + Prettier
- **Package Manager**: Yarn
- **Deployment**: Vercel (Main Site + SSH)
- **Version Control**: Git + GitHub
- **Environment**: Node.js 22.x

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22.x (configured in package.json engines)
- **Package Manager**: yarn
- **Database**: PostgreSQL 13+ (Neon recommended)
- **Git**: For version control

### 1. Clone & Install

```bash
git clone https://github.com/YourUsername/eyogi.git
cd eyogi
yarn install
```

### 2. Environment Setup

Create `.env` file in the root directory:

```bash
# ===== DATABASE =====
DATABASE_URI=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# ===== PAYLOADCMS =====
PAYLOAD_SECRET=your-super-secret-key-minimum-32-characters-long

# ===== NEXT.JS =====
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# ===== FILE UPLOADS =====
UPLOADTHING_TOKEN=your-uploadthing-token

# ===== EMAIL (Microsoft Graph) =====
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_FROM_EMAIL=noreply@yourdomain.com

# ===== EMAIL (SMTP Alternative) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SSH University Environment

Create `src/SSH/.env` file:

```bash
# ===== SUPABASE =====
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===== ENCRYPTION =====
VITE_ENCRYPTION_KEY=your-32-character-encryption-key

# ===== OPENAI (Chatbot) =====
VITE_OPENAI_API_KEY=your-openai-api-key

# ===== EMAIL =====
VITE_MICROSOFT_TENANT_ID=your-tenant-id
VITE_MICROSOFT_CLIENT_ID=your-client-id
VITE_MICROSOFT_CLIENT_SECRET=your-client-secret
VITE_MICROSOFT_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Database Setup

The project uses Neon PostgreSQL (serverless). Migrations are in `migrations/` folder.

```bash
# Run migrations (if needed)
psql $DATABASE_URI < migrations/create_dynamic_menus.sql
```

### 4. Development

```bash
# Start main development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Build SSH University separately
yarn build:ssh
```

### 5. Access Points

- **Main Website**: http://localhost:3000
- **PayloadCMS Admin**: http://localhost:3000/admin
- **SSH University**: http://localhost:3000/ssh-app
- **API Routes**: http://localhost:3000/api

---

## 📁 Project Structure

```
eyogi-main/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (frontend)/          # Public pages
│   │   ├── (payload)/           # PayloadCMS admin
│   │   └── api/                 # API routes
│   ├── blocks/                   # PayloadCMS Blocks
│   ├── collections/              # PayloadCMS Collections
│   ├── components/               # React Components
│   ├── fields/                   # Custom PayloadCMS Fields
│   ├── globals/                  # PayloadCMS Globals
│   ├── hooks/                    # React & Payload Hooks
│   ├── lib/                      # Utility Functions
│   ├── plugins/                  # PayloadCMS Plugins
│   ├── providers/                # Context Providers
│   ├── SSH/                      # SSH University Platform
│   │   ├── src/
│   │   │   ├── components/      # SSH React Components
│   │   │   ├── pages/           # SSH Pages
│   │   │   ├── lib/             # SSH Utilities
│   │   │   ├── contexts/        # SSH Contexts
│   │   │   └── types/           # TypeScript Types
│   │   ├── migrations/          # SSH Database Migrations
│   │   └── public/              # SSH Static Assets
│   └── utilities/                # Helper Functions
├── public/                       # Public Assets
│   ├── ssh-app/                 # Built SSH App (generated)
│   └── docs/                    # Documentation
├── migrations/                   # Main DB Migrations
├── docs/                         # Project Documentation
├── scripts/                      # Utility Scripts
├── package.json                  # Dependencies
├── next.config.js               # Next.js Config
├── payload.config.ts            # PayloadCMS Config
├── tailwind.config.mjs          # Tailwind Config
└── tsconfig.json                # TypeScript Config
```

---

## 📚 Key Features in Detail

### Dynamic Menu System
- Create and manage header/footer menus through PayloadCMS
- Support for submenus and nested navigation
- Icon integration (300+ Lucide icons)
- Badge support ("New", "Beta", etc.)
- Sort order and visibility controls
- No code changes required

### Role-Based Access Control
**Main Site Roles:**
- Super Admin - Full system access
- Admin - Content management
- Editor - Content creation
- Viewer - Read-only access

**SSH University Roles:**
- Super Admin - Full system control
- Business Admin - User and content management
- Teacher - Course and student management
- Student - Course access and learning
- Parent - Child management and monitoring

### Security Features
- Field-level encryption for sensitive data (CryptoJS)
- GDPR/COPPA compliance with consent management
- Audit trail for all administrative actions
- Rate limiting on API endpoints
- Secure authentication with JWT tokens
- Password hashing with bcrypt
- CSRF protection
- SQL injection prevention

### Performance Optimizations
- Next.js 15 App Router with React Server Components
- Incremental Static Regeneration (ISR)
- Image optimization with Next/Image
- Code splitting and lazy loading
- PostgreSQL connection pooling
- Query result caching (5-minute TTL)
- CDN delivery for media (UploadThing)
- Bundle size optimization

### Email System
- Microsoft Graph API integration
- SMTP fallback support
- Template-based emails
- Enrollment confirmations
- Certificate delivery
- Progress notifications
- Parent-child communication
- Admin notifications

### Certificate System
- Auto-generation on course completion
- Custom templates with branding
- Unique verification IDs
- PDF download capability
- Email delivery
- Certificate verification portal
- Batch certificate generation

---

## 🔧 Configuration

### PayloadCMS Collections

```typescript
// Main Collections
- Pages: Dynamic page builder
- Posts: Blog system
- Media: File management
- Categories: Post categories
- FAQ: Question & Answer system
- Users: Admin users
- Membership: Membership tiers
- Form Links: External forms

// Globals
- About Us: About page content
- Privacy Policy: Legal docs
- Donation: Donation page
- Header Menu: Navigation
- Footer Menu: Footer links
```

### SSH University Database Tables

```
// Core Tables
- profiles: User profiles (encrypted)
- courses: Course information
- batches: Course batch instances
- enrollments: Student enrollments
- certificates: Issued certificates
- gurukuls: Learning centers
- progress: Student progress tracking
- attendance: Attendance records
- consent_records: GDPR consent

// Content Tables
- lessons: Course lessons
- modules: Course modules
- assignments: Student assignments
- quizzes: Assessments
- media_files: Course media

// Admin Tables
- permissions: Role permissions
- audit_trail: System audit logs
- invoices: Financial records
- payments: Payment tracking
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

**Main Site:**
```bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration
# Push to main branch → auto-deploy
```

**Environment Variables on Vercel:**
- Add all `.env` variables in Vercel dashboard
- Set `NODE_VERSION` to `22.x`
- Configure `NEXT_PUBLIC_SERVER_URL` to production domain

**SSH University:**
- Built during main build process
- Served as static files from `public/ssh-app/`
- No separate deployment needed

### Build Commands

```bash
# Full production build
yarn build

# Build only main site
yarn build:next

# Build only SSH University
yarn build:ssh

# Clean build (remove cache)
yarn build:clean
```

---

## 📖 Documentation

Comprehensive documentation available in `/docs/`:

- **START_HERE.md** - Dynamic menu system overview
- **BUSINESS_ADMIN_ACCESS_GUIDE.md** - Admin access guide
- **CERTIFICATE_EMAIL_IMPLEMENTATION.md** - Certificate system
- **DYNAMIC_MENUS_SUMMARY.md** - Menu system details
- **EMAIL_AUTO_GENERATION_FIX.md** - Email configuration
- **ENCRYPTION_SETUP_GUIDE.md** - Data encryption setup
- **MICROSOFT_GRAPH_EMAIL_SETUP.md** - Microsoft Graph setup
- **MEDIA_UPLOAD_URL_FIX.md** - Media troubleshooting

---

## 🧪 Testing

```bash
# Run linter
yarn lint

# Fix lint issues
yarn lint:fix

# Type check
tsc --noEmit
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions:
- Check documentation in `/docs/`
- Review existing GitHub issues
- Create new issue with detailed description
- Contact development team

---

## 🎯 Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Gamification system
- [ ] Video conferencing integration
- [ ] Advanced AI tutoring
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Social learning features

---

**Built with ❤️ by the eYogi Gurukul Team**
