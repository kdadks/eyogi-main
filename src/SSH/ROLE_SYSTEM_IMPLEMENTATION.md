# Role System Implementation

## Overview

This implementation adds two new roles to the SSH app: **Business Admin** and enhanced **Teacher** role with course assignment functionality. The system maintains backward compatibility with existing Admin and Student roles.

## New Roles

### 1. Business Admin Role

**Access Level**: Restricted Admin Access
**Access URL**: `/ssh-app/admin/login`

**Permissions**:
- ✅ AdminDashboard.tsx
- ✅ AdminSidebar.tsx
- ✅ CertificateManagement.tsx
- ✅ CourseManagement.tsx
- ✅ CourseAssignmentManagement.tsx (NEW)
- ✅ EnrollmentManagement.tsx
- ✅ StudentManagement.tsx
- ✅ GurukulManagement.tsx
- ✅ ContentManagement.tsx
- ❌ AdminUserManagementNew.tsx (Admin only)
- ❌ AdminPermissionManagement.tsx (Admin only)
- ❌ SiteAnalytics.tsx (Admin only)

**User Creation**: Only Admin can create Business Admin users via UserManagement.tsx

### 2. Enhanced Teacher Role

**Access Level**: Course-Specific Access
**Access URL**: `/ssh-app/login`

**Permissions**:
- ✅ TeacherDashboard.tsx (Shows only assigned courses)
- ✅ StudentManagement.tsx (Only students from assigned courses)
- ✅ EnrollmentManagement.tsx (Only enrollments from assigned courses)
- ✅ CourseManagement.tsx (Only assigned courses)

**Course Assignment**: Admin or Business Admin can assign teachers to specific courses. Once assigned, teachers can:
- Manage that course
- Manage students of that course
- Manage enrollment for that course

**User Creation**: Teacher accounts can be created via normal signup process

## Technical Implementation

### Database Changes

#### New Table: `course_assignments`
```sql
CREATE TABLE course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id VARCHAR(20) NOT NULL, -- References profiles.teacher_id
  course_id UUID NOT NULL REFERENCES courses(id),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Updated Profiles Table
- Added `business_admin` to role enum/constraint

### Authentication Flow

#### Dual Authentication System
1. **Supabase Auth**: For Super Admin users (full access)
2. **Website Auth**: For regular users (role-based access)

#### Role Hierarchy (Highest to Lowest)
1. **Super Admin** (Supabase Auth) - Full access to everything
2. **Admin** (Website Auth) - Full access except super admin functions
3. **Business Admin** (Website Auth) - Limited admin access
4. **Teacher** (Website Auth) - Course-specific access
5. **Student** (Website Auth) - Learning access

### New Components

#### 1. `usePermissions.ts` Hook
- Component-level access control
- Resource-level permissions
- Role detection utilities

#### 2. `CourseAssignmentManagement.tsx`
- Assign teachers to courses
- View all assignments
- Remove assignments
- Available to Admin and Business Admin

#### 3. `useCourseAssignments.ts` Hook
- Manage course assignments
- Load teacher courses
- Assignment CRUD operations

### Updated Components

#### 1. `WebsiteAuthContext.tsx`
- Added business_admin role support
- Enhanced permission system
- Component-level access control

#### 2. `getTeacherCourses()` API
- Now checks both direct assignment and course_assignments table
- Backward compatible with existing assignments

#### 3. `AdminSidebar.tsx`
- Role-based navigation filtering
- Added Course Assignments menu item
- Shows appropriate role label

#### 4. `ProtectedRoute.tsx`
- Support for business_admin role
- Enhanced role checking

## Access Control Matrix

| Resource | Super Admin | Admin | Business Admin | Teacher | Student |
|----------|-------------|--------|----------------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Permissions | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Courses | ✅ | ✅ | ✅ | ✅* | ✅* |
| Course Assignments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Enrollments | ✅ | ✅ | ✅ | ✅* | ✅* |
| Students | ✅ | ✅ | ✅ | ✅* | ❌ |
| Certificates | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gurukuls | ✅ | ✅ | ✅ | ❌ | ❌ |
| Content | ✅ | ✅ | ✅ | ❌ | ❌ |

*\* Only for assigned/enrolled courses*

## URL Routes

### Admin Routes
- `/ssh-app/admin/login` - Admin/Business Admin/Super Admin login
- `/ssh-app/admin/dashboard` - Admin dashboard
- `/ssh-app/admin/users` - User management (Admin only)
- `/ssh-app/admin/courses` - Course management
- `/ssh-app/admin/course-assignments` - Course assignment management (NEW)
- `/ssh-app/admin/enrollments` - Enrollment management
- `/ssh-app/admin/students` - Student management
- `/ssh-app/admin/certificates` - Certificate management
- `/ssh-app/admin/gurukuls` - Gurukul management
- `/ssh-app/admin/content` - Content management
- `/ssh-app/admin/analytics` - Site analytics (Admin only)
- `/ssh-app/admin/permissions` - Permission management (Admin only)

### User Routes
- `/ssh-app/login` - Student/Teacher login
- `/ssh-app/dashboard/student` - Student dashboard
- `/ssh-app/dashboard/teacher` - Teacher dashboard
- `/ssh-app/dashboard/business_admin` - Business Admin dashboard (redirects to admin)

## Migration Instructions

### 1. Database Migration
Run the migration script:
```bash
psql -d your_database -f role_system_migration.sql
```

### 2. Build and Deploy
```bash
cd src/SSH
yarn build
cp -r dist/* ../../public/ssh-app/
```

### 3. User Setup

#### Create Business Admin User
1. Login as Admin or Super Admin
2. Go to User Management
3. Create new user with role "Business Admin"

#### Assign Teachers to Courses
1. Login as Admin or Business Admin
2. Go to Course Assignments
3. Select teacher and course
4. Click Assign

## Security Considerations

### Row Level Security (RLS)
- All new tables have RLS enabled
- Policies enforce role-based access
- Teachers can only see their assigned data

### Authentication
- Dual auth system maintains separation of concerns
- Super admin privileges protected by Supabase Auth
- Website roles managed through custom auth

### Permission Validation
- Server-side permission checks in Supabase policies
- Client-side validation for UX
- Component-level access control

## Testing Checklist

### Business Admin Role
- [ ] Can login via admin portal
- [ ] Can access allowed components
- [ ] Cannot access admin-only components
- [ ] Can assign teachers to courses
- [ ] Can manage enrollments and certificates

### Teacher Role
- [ ] Can login via regular portal
- [ ] Sees only assigned courses
- [ ] Can manage assigned course students
- [ ] Can manage assigned course enrollments
- [ ] Cannot access admin functions

### Existing Functionality
- [ ] Admin retains all existing permissions
- [ ] Students retain all existing permissions
- [ ] Super admin retains all existing permissions
- [ ] Existing course assignments still work

## Troubleshooting

### Common Issues

#### Teachers not seeing courses
1. Check if teacher is assigned to courses in `course_assignments` table
2. Verify teacher_id matches between profiles and assignments
3. Check if assignments are active (`is_active = true`)

#### Business Admin cannot access components
1. Verify role is set to 'business_admin' in profiles table
2. Check if user is using admin login portal
3. Verify permissions in WebsiteAuthContext

#### Build failures
1. Ensure all UI components are properly imported
2. Check TypeScript types are correctly defined
3. Verify all dependencies are installed

### Database Queries

#### View all course assignments
```sql
SELECT
  ca.*,
  p.full_name as teacher_name,
  c.title as course_title
FROM course_assignments ca
JOIN profiles p ON p.teacher_id = ca.teacher_id
JOIN courses c ON c.id = ca.course_id
WHERE ca.is_active = true;
```

#### Check user roles
```sql
SELECT email, full_name, role, status FROM profiles ORDER BY role, full_name;
```

## Future Enhancements

1. **Course-specific permissions**: More granular teacher permissions
2. **Department management**: Group courses by departments
3. **Audit logging**: Track permission changes and assignments
4. **Bulk operations**: Assign multiple teachers to multiple courses
5. **Temporary assignments**: Time-limited course assignments