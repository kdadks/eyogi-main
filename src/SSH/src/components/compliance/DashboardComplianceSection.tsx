import React from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import ComplianceChecklist from './ComplianceChecklist'
import ComplianceNotifications from './ComplianceNotifications'
import type { UserRole } from '../../types/compliance'

interface DashboardComplianceSectionProps {
  userId: string
  userRole: UserRole
  className?: string
  showNotifications?: boolean
  maxNotifications?: number
  compactView?: boolean
}

export default function DashboardComplianceSection({
  userId,
  userRole,
  className = '',
  showNotifications = true,
  compactView = false,
}: DashboardComplianceSectionProps) {
  if (compactView) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Compact Compliance Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ComplianceQuickStats _userId={userId} _userRole={userRole} />
          </CardContent>
        </Card>

        {showNotifications && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Updates</h3>
              </div>
            </CardHeader>
            <CardContent>
              <ComplianceNotifications userId={userId} className="border-0 shadow-none p-0" />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Full Compliance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Center</h2>
        </div>

        {/* Full-width Compliance Checklist */}
        <ComplianceChecklist userId={userId} userRole={userRole} className="h-fit" />
      </motion.div>
    </div>
  )
}

// Quick stats component for compact view
function ComplianceQuickStats({ _userId, _userRole }: { _userId: string; _userRole: UserRole }) {
  // This would typically fetch real stats from the API
  // For now, showing placeholder data
  const mockStats = {
    total: 6,
    completed: 4,
    pending: 2,
    overdue: 0,
  }

  const completionPercentage = Math.round((mockStats.completed / mockStats.total) * 100)

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Completion Progress</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              completionPercentage >= 80
                ? 'bg-green-500'
                : completionPercentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-1" />
            <span className="text-lg font-bold text-green-600">{mockStats.completed}</span>
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ClockIcon className="h-5 w-5 text-blue-600 mr-1" />
            <span className="text-lg font-bold text-blue-600">{mockStats.pending}</span>
          </div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>

        {mockStats.overdue > 0 && (
          <div className="text-center col-span-2">
            <div className="flex items-center justify-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-1" />
              <span className="text-lg font-bold text-red-600">{mockStats.overdue}</span>
            </div>
            <div className="text-xs text-red-600">Overdue Items</div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for role-specific compliance messaging
export function ComplianceWelcomeMessage({ userRole }: { userRole: UserRole }) {
  const getMessage = () => {
    switch (userRole) {
      case 'teacher':
        return {
          title: 'Teacher Compliance Center',
          description:
            'Complete your professional requirements and certifications to maintain your teaching status.',
          priority: 'Ensure all mandatory items are completed before the academic term begins.',
        }
      case 'parent':
        return {
          title: 'Parent Compliance Center',
          description:
            "Complete required forms and provide necessary information for your child's enrollment and safety.",
          priority:
            'Emergency contact information and consent forms are required for student participation.',
        }
      case 'student':
        return {
          title: 'Student Compliance Center',
          description:
            'Complete your enrollment requirements and provide necessary information for your studies.',
          priority:
            'Health information and emergency contacts help ensure your safety and wellbeing.',
        }
      default:
        return {
          title: 'Compliance Center',
          description: 'Complete your required compliance items.',
          priority: 'Please complete all mandatory items.',
        }
    }
  }

  const message = getMessage()

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message.title}</h3>
        <p className="text-gray-600 mb-3">{message.description}</p>
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">{message.priority}</p>
        </div>
      </CardContent>
    </Card>
  )
}
