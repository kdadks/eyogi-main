import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { useSupabaseAuth } from './useSupabaseAuth'
import { useState, useEffect } from 'react'
import { supabaseAdmin } from '../lib/supabase'
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
  BatchManagement: ['admin', 'business_admin', 'super_admin'],
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
  const [menuVisibilityMap, setMenuVisibilityMap] = useState<Record<string, boolean>>({})
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, boolean>>({})
  const [isLoadingMenuVisibility, setIsLoadingMenuVisibility] = useState(false)

  // Load menu visibility and permissions for the current user's role
  useEffect(() => {
    const loadMenuVisibility = async () => {
      if (!authUser || !profile) return

      try {
        setIsLoadingMenuVisibility(true)

        // Fetch role permissions with menu visibility
        const { data, error } = await supabaseAdmin
          .from('role_permissions')
          .select('permission_id, menu_visible, permissions(resource, action)')
          .eq('role', profile.role)

        if (error) {
          console.error('Error loading menu visibility:', error)
          return
        }

        // Build maps for both menu visibility and permissions
        const visibilityMap: Record<string, boolean> = {}
        const permissionsMap: Record<string, boolean> = {}

        data?.forEach((rp: any) => {
          if (rp.permissions) {
            const key = `${rp.permissions.resource}.${rp.permissions.action}`
            visibilityMap[key] = rp.menu_visible ?? true
            permissionsMap[key] = true // This role has this permission
          }
        })

        console.log('[usePermissions] Loaded for role:', profile.role)
        console.log('[usePermissions] Menu visibility map:', visibilityMap)
        console.log('[usePermissions] Permissions map:', permissionsMap)
        console.log('[usePermissions] Raw data from database:', data)

        setMenuVisibilityMap(visibilityMap)
        setRolePermissionsMap(permissionsMap)
      } catch (error) {
        console.error('Failed to load menu visibility:', error)
      } finally {
        setIsLoadingMenuVisibility(false)
      }
    }

    loadMenuVisibility()
  }, [authUser, profile])
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
      // Admin roles have full access
      if (profile.role === 'super_admin') return true
      if (profile.role === 'admin') return true

      // For all other roles (including business_admin), check database permissions
      const key = `${resource.toLowerCase()}.${action}`
      const hasPermission = rolePermissionsMap[key] ?? false

      console.log(`[canAccessResource] Checking ${key}:`, hasPermission, { rolePermissionsMap })

      return hasPermission
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

  const canShowInMenu = (resource: string, action: string = 'read'): boolean => {
    // Super admins and admins always see all menu items
    if (authUser && profile) {
      if (profile.role === 'super_admin' || profile.role === 'admin') {
        return true
      }
    }

    // Check menu visibility from database
    const key = `${resource}.${action}`
    const visible = menuVisibilityMap[key] ?? false
    console.log(`[canShowInMenu] Checking ${key}: ${visible}`, { menuVisibilityMap })
    return visible
  }

  return {
    canAccessComponent,
    canAccessResource,
    canShowInMenu,
    getUserRole,
    isTeacher,
    isBusinessAdmin,
    isAdmin,
    isSuperAdminRole,
    isStudent,
    currentUser: authUser && profile ? profile : websiteUser,
    isSuperAdmin: isSuperAdminRole(),
    isLoadingMenuVisibility,
  }
}
