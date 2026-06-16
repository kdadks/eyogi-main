# eYogi Gurukul - Comprehensive Education Platform

A dual-platform educational ecosystem combining a **modern Next.js marketing website** with a **full-featured SSH (Spiritual and Scriptural Hub) University management system**. Built with Next.js 15.1.9, React 19, Supabase PostgreSQL, and Vite.

## 🌟 Platform Overview

This project consists of two independent, integrated platforms:

1. **Main eYogi Website** (http://localhost:3000) - Public-facing marketing site with blog and content
2. **SSH University** (http://localhost:5174) - Complete learning management system with student/teacher/parent/admin portals

---

## 📱 Main eYogi Website Features

### Public Content
- **Blog System** - Posts with categories, search, and filtering
- **Static Pages** - About, Contact, Donation, FAQ, Membership, Donation
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **SEO Optimized** - Meta tags, Open Graph, structured data
- **Fast Performance** - Static generation for public pages, ISR for blog

### Navigation
- **Main Menu** - Header navigation to all public pages
- **Footer** - Links, social media, legal pages
- **University Link** - Opens SSH platform in new tab

### Admin Dashboard (`/admin`)
**Authentication**
- Single admin user via Supabase Auth
- JWT-based session management
- Secure cookie-based auth tokens
- Role-based access control

**Content Management**
- **Posts** - Create, edit, publish blog posts
  - Rich text editor with Lexical
  - SEO metadata (title, slug, excerpt)
  - Publish/unpublish workflow
  - Full CRUD operations
  
- **Pages** - Manage static pages
  - Same rich text editing as posts
  - Custom URL slugs
  - Draft/publish workflow
  
- **Media Library** - File uploads and management
  - Drag-drop upload interface
  - File size validation (50MB limit)
  - Supabase storage integration
  - Public URL generation

- **Categories** - Organize blog content
  - Category naming and descriptions
  - Slug generation
  - Posts per category tracking

- **Settings** - Site configuration
  - Site name and description
  - Contact email and phone
  - Maintenance mode toggle

**Analytics Dashboard**
- Post count statistics
- Media files count
- Categories count
- Monthly content activity charts
- Quick action buttons

### Admin Interface Design
- **Sidebar Navigation** - Fixed left sidebar with all menu items
- **Clean Layout** - No header/footer in admin area
- **Responsive Tables** - DataTable component with sorting/pagination
- **Form Validation** - Client-side validation on all inputs
- **Success Feedback** - Toast notifications for actions
- **Loading States** - Proper UX during API calls

---

## 🎓 SSH University Platform (Vite-based SPA)

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
- Student progress tracking
- Class performance metrics
- Course statistics and insights
- Assignment submission tracking
- Quiz performance analysis

**Course & Assignment Management**
- Create and manage courses
- Upload and organize materials
- Create and grade assignments
- Develop and grade quizzes
- Track assignment deadlines
- View submission analytics

**Student Management**
- Batch creation and enrollment
- Attendance tracking
- Performance monitoring
- Grade management and recording
- Communication with students
- Feedback and annotations

**Grading & Assessment**
- Multiple grading schemes
- Rubric-based evaluation
- Bulk grade uploads
- Grade history tracking
- Performance reports
- Grade justification notes

### Parent Portal
**Student Progress Monitoring**
- View child's course enrollment
- Monitor overall progress
- Track grades and performance
- View attendance records
- Communication history with teachers

**Performance Insights**
- Subject-wise performance breakdown
- Learning analytics and trends
- Comparative performance data
- Achievement and certificate tracking
- Detailed progress reports

### Admin Portal
**System Administration**
- User management (students, teachers, parents, admins)
- Role and permission management
- Batch and course management
- Academic calendar configuration
- Holiday and schedule management

**Analytics & Reporting**
- Platform-wide analytics dashboard
- User activity reports
- Course enrollment statistics
- Performance analytics
- System health monitoring

---

## 🛠 Technology Stack

### Frontend
- **Next.js 15.1.9** - React framework with App Router
- **React 19.0.0** - UI library with hooks
- **Vite 7.2.2** - SSH platform bundler
- **Tailwind CSS 3.4.3** - Utility-first CSS
- **Radix UI** - Accessible component library
- **Lucide React** - Icon library
- **Recharts** - Charts and analytics

### Backend & Database
- **Supabase** - PostgreSQL database + Auth
- **Supabase SSR Client** - Server-side data fetching
- **Supabase Storage** - File uploads
- **Supabase Auth** - JWT-based authentication

### Rich Text Editing
- **Lexical** - Modern rich text editor
- **@lexical/react** - React bindings

### Dev Tools
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## 📁 Project Structure

```
eyogi-main/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Authentication pages
│   │   │   └── login/
│   │   ├── (frontend)/          # Public pages
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── donation/
│   │   │   ├── faq/
│   │   │   ├── forms/
│   │   │   ├── hinduism/        # Blog posts
│   │   │   └── membership/
│   │   ├── admin/               # Admin dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── posts/
│   │   │   ├── pages/
│   │   │   ├── media/
│   │   │   ├── categories/
│   │   │   └── settings/
│   │   ├── api/                 # API routes
│   │   │   ├── auth/
│   │   │   ├── content/
│   │   │   ├── media/
│   │   │   ├── users/
│   │   │   └── courses/
│   │   ├── layout.tsx           # Root layout
│   │   ├── error.tsx            # Error boundary
│   │   └── not-found.tsx        # 404 page
│   ├── components/
│   │   ├── admin/               # Admin UI components
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   └── RichTextEditor.tsx
│   │   ├── ui/                  # Radix UI components
│   │   └── LayoutWrapper.tsx    # Conditional layout wrapper
│   ├── lib/
│   │   ├── supabase/            # Supabase clients & utils
│   │   │   ├── server.ts
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   └── storage.ts
│   │   └── api-utils.ts         # API response utilities
│   ├── middleware.ts            # Route auth middleware
│   ├── Header/                  # Main site header
│   ├── Footer/                  # Main site footer
│   └── utilities/               # Helper functions
├── SSH/                         # Vite-based university app
│   ├── src/
│   ├── vite.config.ts
│   ├── index.html
│   └── package.json
├── public/                      # Static assets
├── .env.local                   # Environment variables
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kdadks/eyogi-main.git
cd eyogi-main
```

2. **Install dependencies**
```bash
yarn install
# or
npm install --legacy-peer-deps
```

3. **Configure environment variables**
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

Environment variables needed:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SSH_URL=http://localhost:5174
```

4. **Start development servers**

```bash
# Terminal 1: Next.js main site
yarn dev

# Terminal 2: Vite SSH app (from SSH directory)
cd SSH && npm run dev
```

Access:
- **Main Site:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Admin:** http://localhost:3000/admin
- **SSH University:** http://localhost:5174

---

## 🔐 Authentication Flow

### Main Site Admin
1. User navigates to `/login`
2. Enters email and password
3. Supabase Auth validates credentials
4. JWT token returned and stored in httpOnly cookie
5. Redirected to `/admin` dashboard
6. Middleware verifies token on protected routes
7. Logout clears cookie and redirects to `/login`

### SSH University
- Independent authentication system
- Uses Supabase Auth with student/teacher roles
- Separate login flow from main site
- Role-based access to portals

---

## 📊 Database Schema

### Main Database (gurukul_main)
```
users table:
- id (UUID)
- email (string)
- full_name (string)
- avatar_url (string)
- created_at (timestamp)

posts table:
- id (UUID)
- title (string)
- slug (string)
- excerpt (text)
- content (JSON/text)
- published_at (timestamp)
- created_at (timestamp)

pages table:
- id (UUID)
- title (string)
- slug (string)
- content (JSON/text)
- created_at (timestamp)

categories table:
- id (UUID)
- name (string)
- slug (string)
- description (text)

media table:
- id (UUID)
- filename (string)
- url (string)
- size (integer)
- type (string)
- created_at (timestamp)
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Current user info

### Content Management
- `GET /api/content/posts` - List posts
- `GET /api/content/posts/:id` - Get post details
- `POST /api/content/posts` - Create post
- `PUT /api/content/posts/:id` - Update post
- `DELETE /api/content/posts/:id` - Delete post

- `GET /api/content/pages` - List pages
- `POST /api/content/pages` - Create page
- `PUT /api/content/pages/:id` - Update page
- `DELETE /api/content/pages/:id` - Delete page

### Media
- `POST /api/media/upload` - Upload files

### Users
- `GET /api/users/profile` - Get user profile

---

## 🎨 Admin Dashboard Features

### Dashboard Home
- **Statistics Cards** - Posts, Media, Categories count
- **Activity Chart** - Monthly content activity
- **Quick Actions** - Create new posts/pages

### Posts Management
- **List View** - Sortable table with search
- **Editor** - Rich text editor with Lexical
- **Publishing** - Draft/publish toggle
- **Pagination** - Limit and offset pagination

### Pages Management
- Similar to posts management
- Static page creation and updates

### Media Library
- **Upload Interface** - Drag-drop file upload
- **File Validation** - Size limits and type checking
- **URL Generation** - Public URLs for uploaded files
- **Grid View** - Thumbnail preview of media

### Categories
- **Management Table** - Create/edit/delete categories
- **Slug Auto-Generation** - From category name

### Settings
- **Site Configuration** - Name, description, contact info
- **Maintenance Mode** - Toggle site maintenance

---

## 🔒 Security

- **Authentication** - Supabase Auth with JWT
- **Protected Routes** - Middleware validates tokens
- **httpOnly Cookies** - Secure auth token storage
- **RLS Policies** - Row-level security on database
- **Environment Variables** - Sensitive data in .env.local
- **CORS** - Configured for same-origin requests

---

## 📦 Build & Deployment

### Building
```bash
# Next.js build
yarn build

# SSH app build
cd SSH && npm run build
```

### Production Deployment
```bash
# Next.js main site
vercel deploy

# SSH app (static hosting)
# Deploy SSH/dist to your hosting
```

---

## 📝 Development Guidelines

### Adding New Admin Pages
1. Create folder: `src/app/admin/[feature]/`
2. Create `page.tsx` component
3. Add navigation link in Sidebar
4. Implement API endpoints as needed

### Adding New API Routes
1. Create route: `src/app/api/[resource]/route.ts`
2. Implement GET/POST/PUT/DELETE as needed
3. Use Supabase client for database access
4. Return proper JSON responses

### Styling
- Use Tailwind CSS for all styling
- Follow existing color scheme (orange/blue)
- Maintain consistent component design

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "Add feature"`
3. Push branch: `git push origin feature/feature-name`
4. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.

---

## 🗂 Project Status

**Phase 1** ✅ - Foundation, Supabase setup, authentication
**Phase 2** ✅ - API layer with 13+ endpoints
**Phase 3** ✅ - Admin CMS with complete interface
**Phase 4** 🚀 - SSH University platform refinement

Current Version: **1.0.0**
Last Updated: June 2026
