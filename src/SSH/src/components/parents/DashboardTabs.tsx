import React, { useState } from 'react'
import { BookOpen, Calendar, TrendingUp, Home } from 'lucide-react'
import { Child } from '../../data/mockParentsData'
import OverviewTab from './tabs/OverviewTab'
import CoursesTab from './tabs/CoursesTab'
import PerformanceTab from './tabs/PerformanceTab'
import AssignmentsTab from './tabs/AssignmentsTab'

interface DashboardTabsProps {
  child: Child
}

type TabType = 'overview' | 'courses' | 'performance' | 'assignments'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'assignments', label: 'Assignments', icon: Calendar },
]

export default function DashboardTabs({ child }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab child={child} />
      case 'courses':
        return <CoursesTab child={child} />
      case 'performance':
        return <PerformanceTab child={child} />
      case 'assignments':
        return <AssignmentsTab child={child} />
      default:
        return <OverviewTab child={child} />
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}

                  {/* Badge for pending items */}
                  {tab.id === 'assignments' &&
                    child.assignments.filter((a) => a.status === 'pending').length > 0 && (
                      <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {child.assignments.filter((a) => a.status === 'pending').length}
                      </span>
                    )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">{renderTabContent()}</div>
    </div>
  )
}
