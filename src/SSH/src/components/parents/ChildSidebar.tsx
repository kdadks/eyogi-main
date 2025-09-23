import React from 'react'
import { Plus, X, TrendingUp, Clock, Target } from 'lucide-react'
import { Child } from '../../data/mockParentsData'

interface ChildSidebarProps {
  children: Child[]
  selectedChildId: string
  onSelectChild: (childId: string) => void
  onAddChild: () => void
  onCloseSidebar: () => void
}

export default function ChildSidebar({
  children,
  selectedChildId,
  onSelectChild,
  onAddChild,
  onCloseSidebar,
}: ChildSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Children</h2>
          <p className="text-sm text-gray-500">
            {children.length} child{children.length !== 1 ? 'ren' : ''}
          </p>
        </div>
        <button
          onClick={onCloseSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Children List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => {
                onSelectChild(child.id)
                onCloseSidebar()
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedChildId === child.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Child Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg mr-3">
                    {child.avatar || child.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{child.fullName}</h3>
                    <p className="text-xs text-gray-500">
                      {child.grade} • Age {child.age}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-indigo-600">
                    {child.overallProgress}%
                  </div>
                  <div className="text-xs text-gray-500">Progress</div>
                </div>
              </div>

              {/* Student ID */}
              <div className="mb-3">
                <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md">
                  <Target className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-xs font-mono text-gray-700">{child.studentId}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Overall Progress</span>
                  <span className="text-xs text-gray-600">{child.overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${child.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="font-medium text-gray-900">
                      {child.enrolledCourses.length}
                    </span>
                  </div>
                  <div className="text-gray-500">Courses</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-3 w-3 text-orange-500 mr-1" />
                    <span className="font-medium text-gray-900">{child.streakDays}</span>
                  </div>
                  <div className="text-gray-500">Day Streak</div>
                </div>
              </div>

              {/* Active Indicator */}
              {selectedChildId === child.id && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Child Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onAddChild}
          className="w-full flex items-center justify-center px-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 group"
        >
          <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Add New Child</span>
        </button>
      </div>

      {/* Footer Stats */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {children.reduce((sum, child) => sum + child.enrolledCourses.length, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Courses</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-indigo-600">
              {Math.round(
                children.reduce((sum, child) => sum + child.overallProgress, 0) /
                  (children.length || 1),
              )}
              %
            </div>
            <div className="text-xs text-gray-500">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
}
