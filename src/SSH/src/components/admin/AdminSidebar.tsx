import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CogIcon,
  AcademicCapIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { profile, canAccess, user, signOut } = useAuth()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      permission: null,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      permission: { resource: 'users', action: 'read' },
    },
    {
      name: 'Courses',
      href: '/admin/courses',
      icon: BookOpenIcon,
      permission: { resource: 'courses', action: 'read' },
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
      icon: AcademicCapIcon,
      permission: { resource: 'certificates', action: 'read' },
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: DocumentDuplicateIcon,
      permission: { resource: 'content', action: 'read' },
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      permission: { resource: 'analytics', action: 'read' },
    },
    {
      name: 'Permissions',
      href: '/admin/permissions',
      icon: ShieldCheckIcon,
      permission: { resource: 'permissions', action: 'read' },
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: CogIcon,
      permission: { resource: 'settings', action: 'read' },
    },
  ]

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true
    return canAccess(item.permission.resource, item.permission.action)
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
          <div className="space-y-1">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
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
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role || 'Admin'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar
