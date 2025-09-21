import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { useSupabaseAuth } from './useSupabaseAuth'

// Component permissions mapping
const COMPONENT_PERMISSIONS = {
  // Admin components
  AdminDashboard: ['admin', 'business_admin', 'super_admin'],
  AdminSidebar: ['admin', 'business_admin', 'super_admin'],
  CertificateManagement: ['admin', 'business_admin', 'super_admin'],
  CourseManagement: ['admin', 'business_admin', 'teacher', 'super_admin'],
  EnrollmentManagement: ['admin', 'business_admin', 'teacher', 'super_admin'],
  StudentManagement: ['admin', 'business_admin', 'teacher', 'super_admin'],
  GurukulManagement: ['admin', 'business_admin', 'super_admin'],
  ContentManagement: ['admin', 'business_admin', 'super_admin'],
  SiteAnalytics: ['admin', 'super_admin'],
  AdminPermissionManagement: ['admin', 'super_admin'],
  AdminUserManagementNew: ['admin', 'super_admin'],

  // Teacher components
  TeacherDashboard: ['teacher', 'admin', 'super_admin'],

  // Student components
  StudentDashboard: ['student', 'admin', 'super_admin'],
} as const

type ComponentName = keyof typeof COMPONENT_PERMISSIONS
type UserRole = 'student' | 'teacher' | 'admin' | 'business_admin' | 'super_admin' | 'parent'

export function usePermissions() {
  const { user: websiteUser, canAccess: websiteCanAccess } = useWebsiteAuth()
  const { profile, user: authUser } = useSupabaseAuth()

  const canAccessComponent = (componentName: ComponentName): boolean => {
    // For admin routes, use AuthContext profile
    if (authUser && profile) {
      const allowedRoles = COMPONENT_PERMISSIONS[componentName]
      return (allowedRoles as readonly string[]).includes(profile.role)
    }

    // For website routes, use WebsiteAuth user
    if (websiteUser) {
      const allowedRoles = COMPONENT_PERMISSIONS[componentName]
      return (allowedRoles as readonly string[]).includes(websiteUser.role)
    }

    return false
  }

  const canAccessResource = (resource: string, action: string = 'read'): boolean => {
    // For admin routes, use AuthContext profile
    if (authUser && profile) {
      // Admin roles have different resource access levels
      if (profile.role === 'super_admin') return true
      if (profile.role === 'admin') return true
      if (profile.role === 'business_admin') {
        // Business admin has limited resource access
        const businessAdminResources = [
          'dashboard',
          'courses',
          'enrollments',
          'students',
          'gurukuls',
          'content',
          'certificates',
          'assignments',
        ]
        return businessAdminResources.includes(resource.toLowerCase())
      }
      return false
    }

    // For website routes, use WebsiteAuth permissions
    if (websiteUser) {
      return websiteCanAccess(resource, action)
    }

    return false
  }

  const getUserRole = (): UserRole | null => {
    // For admin routes, use AuthContext profile
    if (authUser && profile) {
      return profile.role as UserRole
    }
    // For website routes, use WebsiteAuth user
    return (websiteUser?.role as UserRole) || null
  }

  const isTeacher = (): boolean => {
    return getUserRole() === 'teacher'
  }

  const isBusinessAdmin = (): boolean => {
    return getUserRole() === 'business_admin'
  }

  const isAdmin = (): boolean => {
    return getUserRole() === 'admin'
  }

  const isSuperAdminRole = (): boolean => {
    return getUserRole() === 'super_admin'
  }

  const isStudent = (): boolean => {
    return getUserRole() === 'student'
  }

  return {
    canAccessComponent,
    canAccessResource,
    getUserRole,
    isTeacher,
    isBusinessAdmin,
    isAdmin,
    isSuperAdminRole,
    isStudent,
    currentUser: authUser && profile ? profile : websiteUser,
    isSuperAdmin: isSuperAdminRole(),
  }
}
