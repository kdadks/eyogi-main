import React from 'react'
import { useRoleBasedUI } from '../../contexts/PermissionContext'
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

const StudentDashboard: React.FC = () => {
  const { isStudent, shouldShowAnalytics, canAccess, getUserRole } = useRoleBasedUI()

  const role = getUserRole()

  // Student-specific navigation items
  const studentNavigation = [
    {
      name: 'My Courses',
      icon: BookOpenIcon,
      description: 'View enrolled courses and progress',
      available: canAccess('courses', 'read'),
    },
    {
      name: 'My Enrollments',
      icon: ClipboardDocumentListIcon,
      description: 'Track enrollment status and history',
      available: canAccess('enrollments', 'read'),
    },
    {
      name: 'My Certificates',
      icon: AcademicCapIcon,
      description: 'Download earned certificates',
      available: canAccess('certificates', 'read'),
    },
  ]

  // Items that should be hidden from students
  const adminOnlyItems = [
    {
      name: 'Analytics Dashboard',
      icon: ChartBarIcon,
      description: 'System analytics and reports',
      available: shouldShowAnalytics(),
    },
    {
      name: 'System Settings',
      icon: CogIcon,
      description: 'Configure system settings',
      available: canAccess('settings', 'read'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isStudent() ? 'Student Portal' : `${role.replace('_', ' ').toUpperCase()} Dashboard`}
          </h1>
          <p className="text-gray-600 mt-2">
            {isStudent()
              ? 'Access your courses, assignments, and academic progress'
              : 'Manage your academic responsibilities and access tools'}
          </p>
        </div>

        {/* Role Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Access Level</h2>
          <div className="flex items-center space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isStudent() ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {role.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-gray-600">
              {isStudent()
                ? 'Students have access to learning materials and personal progress tracking'
                : 'You have extended permissions for academic management'}
            </span>
          </div>
        </div>

        {/* Available Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
            <div className="space-y-3">
              {studentNavigation
                .filter((item) => item.available)
                .map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <item.icon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Restricted Features (only show if user has any admin permissions) */}
          {!isStudent() && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Features</h3>
              <div className="space-y-3">
                {adminOnlyItems
                  .filter((item) => item.available)
                  .map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <item.icon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Restricted Notice for Students */}
          {isStudent() && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Restricted Access</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <ChartBarIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Analytics Dashboard</p>
                    <p className="text-xs text-yellow-600">Not available for students</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CogIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">System Settings</p>
                    <p className="text-xs text-yellow-600">Requires administrative access</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Permission Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {studentNavigation.filter((item) => item.available).length}
              </div>
              <div className="text-sm text-gray-500">Available Features</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {studentNavigation.filter((item) => !item.available).length}
              </div>
              <div className="text-sm text-gray-500">Restricted Features</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{role.toUpperCase()}</div>
              <div className="text-sm text-gray-500">Your Role</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {canAccess('admin', 'access') ? 'YES' : 'NO'}
              </div>
              <div className="text-sm text-gray-500">Admin Access</div>
            </div>
          </div>
        </div>

        {/* Demo Note */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🎯 Permission System Demo</h3>
          <p className="text-blue-700 text-sm">
            This demonstrates how the UI adapts based on user roles. Students only see their
            permitted features, while administrators and teachers see additional options based on
            their specific permissions. The analytics dashboard and system settings are hidden from
            students automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
