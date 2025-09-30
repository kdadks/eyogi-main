import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  BuildingLibraryIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
import { usePermissions } from '../../hooks/usePermissions'
interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}
const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth()
  const { canAccessResource, getUserRole, currentUser, isSuperAdminRole } = usePermissions()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent double-clicks
    setIsSigningOut(true)
    try {
      await signOut()
    } catch {
      setIsSigningOut(false) // Reset if there's an error
    }
  }
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      permission: { resource: 'dashboard', action: 'read' },
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      permission: { resource: 'users', action: 'read' },
      adminOnly: true, // Only admin and super_admin can manage users
    },
    {
      name: 'Students',
      href: '/admin/students',
      icon: AcademicCapIcon,
      permission: { resource: 'users', action: 'read' },
    },
    {
      name: 'Courses',
      href: '/admin/courses',
      icon: BookOpenIcon,
      permission: { resource: 'courses', action: 'read' },
    },
    {
      name: 'Course Assignments',
      href: '/admin/course-assignments',
      icon: UserGroupIcon,
      permission: { resource: 'assignments', action: 'read' },
    },
    {
      name: 'Gurukuls',
      href: '/admin/gurukuls',
      icon: BuildingLibraryIcon,
      permission: { resource: 'gurukuls', action: 'read' },
    },
    {
      name: 'Enrollments',
      href: '/admin/enrollments',
      icon: ClipboardDocumentListIcon,
      permission: { resource: 'enrollments', action: 'read' },
    },
    {
      name: 'Certificates',
      href: '/admin/certificates',
      icon: DocumentDuplicateIcon,
      permission: { resource: 'certificates', action: 'read' },
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: DocumentDuplicateIcon,
      permission: { resource: 'content', action: 'read' },
    },
    {
      name: 'Batch Management',
      href: '/admin/batches',
      icon: QueueListIcon,
      permission: { resource: 'batches', action: 'read' },
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      permission: { resource: 'analytics', action: 'read' },
      adminOnly: true, // Only admin and super_admin can view analytics
    },
    {
      name: 'Permissions',
      href: '/admin/permissions',
      icon: ShieldCheckIcon,
      permission: { resource: 'permissions', action: 'read' },
      adminOnly: true, // Only admin and super_admin can manage permissions
    },
  ]
  const filteredNavigation = navigation.filter((item) => {
    // Check if item requires admin-only access
    if (item.adminOnly) {
      const role = getUserRole()
      if (role !== 'admin' && role !== 'super_admin') {
        return false
      }
    }
    // Check resource-level permissions
    if (item.permission) {
      return canAccessResource(item.permission.resource, item.permission.action)
    }
    return true
  })
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">eYogi Admin</h2>
          </div>
          <button
            type="button"
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
        {/* User info */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {currentUser?.full_name?.charAt(0) ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {currentUser?.full_name || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {(() => {
                    if (isSuperAdminRole()) return 'Super Admin'
                    const role = getUserRole()
                    return role ? role.replace('_', ' ') : 'Admin'
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`p-1 rounded-md transition-colors ${
                isSigningOut
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title={isSigningOut ? 'Signing out...' : 'Sign out'}
            >
              {isSigningOut ? (
                <div className="h-5 w-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
export default AdminSidebar
