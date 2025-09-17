import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface PermissionContextType {
  canAccess: (resource: string, action: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  getUserPermissions: () => string[]
  isLoading: boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

interface PermissionProviderProps {
  children: React.ReactNode
}

// Enhanced permission system with granular controls
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    // Full access to everything
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'courses.create',
    'courses.read',
    'courses.update',
    'courses.delete',
    'enrollments.read',
    'enrollments.update',
    'enrollments.approve',
    'certificates.read',
    'certificates.create',
    'certificates.delete',
    'analytics.read',
    'analytics.export',
    'settings.read',
    'settings.update',
    'permissions.read',
    'permissions.update',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'admin.access',
    'admin.dashboard',
  ],
  admin: [
    // Standard admin permissions
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'courses.create',
    'courses.read',
    'courses.update',
    'courses.delete',
    'enrollments.read',
    'enrollments.update',
    'certificates.read',
    'certificates.create',
    'analytics.read',
    'settings.read',
    'permissions.read',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'admin.access',
    'admin.dashboard',
  ],
  teacher: [
    // Teacher permissions - can manage courses and view students
    'courses.create',
    'courses.read',
    'courses.update',
    'enrollments.read',
    'enrollments.update',
    'certificates.read',
    'certificates.create',
    'users.read', // Can view student profiles
    'content.create',
    'content.read',
    'content.update',
    'admin.access', // Can access admin interface with limited features
  ],
  student: [
    // Student permissions - view only for own data
    'courses.read',
    'enrollments.read', // Own enrollments only
    'certificates.read', // Own certificates only
    'content.read',
    // No admin access
  ],
  parent: [
    // Parent permissions - view child's data
    'courses.read',
    'enrollments.read', // Child's enrollments
    'certificates.read', // Child's certificates
    'content.read',
    // No admin access
  ],
}

// Features that should be hidden from students on the main university page
const STUDENT_HIDDEN_FEATURES = [
  'analytics.read',
  'users.create',
  'users.update',
  'users.delete',
  'admin.dashboard',
  'settings.read',
  'permissions.read',
]

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, profile, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Permission loading is tied to auth loading
    setIsLoading(authLoading)
  }, [authLoading])

  const getUserRole = (): string => {
    // Admin console users without profiles are super admins
    if (user && !profile) {
      return 'super_admin'
    }

    // Users with profiles use their assigned role
    return profile?.role || 'student'
  }

  const getUserPermissions = (): string[] => {
    const userRole = getUserRole()
    return ROLE_PERMISSIONS[userRole] || []
  }

  const canAccess = (resource: string, action: string): boolean => {
    // Admin Console: Any Supabase authenticated user has full permissions
    if (user) {
      return true
    }

    // Website Dashboard: Use role-based permissions for profile users
    const permissionKey = `${resource}.${action}`
    const userPermissions = getUserPermissions()
    return userPermissions.includes(permissionKey)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    const userPermissions = getUserPermissions()
    return permissions.some((permission) => userPermissions.includes(permission))
  }

  // Special check for admin access
  const canAccessAdmin = (): boolean => {
    return canAccess('admin', 'access')
  }

  // Check if user should see analytics/admin features on university page
  const shouldHideFromStudent = (feature: string): boolean => {
    const userRole = getUserRole()
    return userRole === 'student' && STUDENT_HIDDEN_FEATURES.includes(feature)
  }

  const value: PermissionContextType = {
    canAccess,
    hasAnyPermission,
    getUserPermissions,
    isLoading,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

// Helper component for conditional rendering based on permissions
interface PermissionGateProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  children,
  fallback = null,
}) => {
  const { canAccess } = usePermissions()

  if (canAccess(resource, action)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

// Hook for role-based UI customization
export const useRoleBasedUI = () => {
  const { user, profile } = useAuth()
  const { canAccess, getUserPermissions } = usePermissions()

  const getUserRole = (): string => {
    if (user && !profile) return 'super_admin'
    return profile?.role || 'student'
  }

  const isStudent = (): boolean => {
    return getUserRole() === 'student'
  }

  const isTeacher = (): boolean => {
    return getUserRole() === 'teacher'
  }

  const isAdmin = (): boolean => {
    const role = getUserRole()
    return role === 'admin' || role === 'super_admin'
  }

  const canAccessAdminConsole = (): boolean => {
    return canAccess('admin', 'access')
  }

  const shouldShowAnalytics = (): boolean => {
    return canAccess('analytics', 'read')
  }

  return {
    getUserRole,
    isStudent,
    isTeacher,
    isAdmin,
    canAccessAdminConsole,
    shouldShowAnalytics,
    canAccess,
    getUserPermissions,
  }
}

export default PermissionProvider
