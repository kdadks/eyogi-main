import React from 'react'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import { usePageTitle } from '../../hooks/usePageTitle'
import { HelpButton, adminDashboardHelpTopics } from '../help'
import RefreshButton from './RefreshButton'
import { useRefresh } from '../../contexts/RefreshContext'
import toast from 'react-hot-toast'

interface AdminHeaderProps {
  onMenuClick: () => void
}
const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { fullTitle } = usePageTitle()
  const { triggerRefresh } = useRefresh()

  const handleRefresh = async () => {
    triggerRefresh()
    toast.success('Page refreshed successfully')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center">
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="ml-4 lg:ml-0">
            <h1 className="text-2xl font-semibold text-gray-900">{fullTitle}</h1>
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <RefreshButton onRefresh={handleRefresh} />

          {/* Help Button */}
          <HelpButton
            topics={adminDashboardHelpTopics}
            title="Admin Dashboard Help"
            description="Learn how to manage users, courses, enrollments, analytics, and more"
            showKeyboardHint={true}
          />
          {/* Notifications */}
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative"
          >
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
export default AdminHeader
