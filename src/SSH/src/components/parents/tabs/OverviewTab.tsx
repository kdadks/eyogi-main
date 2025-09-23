import React from 'react'
import {
  Clock,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { Child, getUpcomingAssignments, getRecentActivities } from '../../../data/mockParentsData'

interface OverviewTabProps {
  child: Child
}

export default function OverviewTab({ child }: OverviewTabProps) {
  const upcomingAssignments = getUpcomingAssignments(child.assignments)
  const recentActivities = getRecentActivities(child.recentActivity).slice(0, 5)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'assignment_submitted':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'quiz_passed':
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      case 'badge_earned':
        return <Award className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Course Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
          Course Progress
        </h3>

        {child.enrolledCourses.length > 0 ? (
          <div className="space-y-4">
            {child.enrolledCourses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-500">
                      {course.subject} • {course.difficulty}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-indigo-600">
                      {course.progress}%
                    </span>
                    <p className="text-sm text-gray-500">Grade: {course.currentGrade}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {course.completedLessons}/{course.totalLessons} lessons completed
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      course.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses enrolled</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by enrolling in a course.</p>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
            Upcoming Assignments
          </h3>

          {upcomingAssignments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{assignment.title}</h4>
                    <p className="text-xs text-gray-500">{assignment.courseName}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-600">
                        Due {formatDate(assignment.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        assignment.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : assignment.difficulty === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {assignment.difficulty}
                    </span>
                  </div>
                </div>
              ))}

              {child.assignments.filter((a) => a.status === 'pending').length >
                upcomingAssignments.length && (
                <button className="w-full text-sm text-indigo-600 hover:text-indigo-500 flex items-center justify-center py-2">
                  View all assignments
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No pending assignments</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Recent Activity
          </h3>

          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          Learning Statistics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Progress */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-3">
              <Clock className="h-8 w-8 text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{child.learningTime.weekly} min</h4>
            <p className="text-sm text-gray-500">This Week</p>
          </div>

          {/* Monthly Progress */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-3">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              {child.learningTime.monthly} min
            </h4>
            <p className="text-sm text-gray-500">This Month</p>
          </div>

          {/* Achievements */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mb-3">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{child.achievements.length}</h4>
            <p className="text-sm text-gray-500">Achievements</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all">
            <BookOpen className="h-6 w-6 mb-2" />
            <div className="font-medium">Browse Courses</div>
            <div className="text-sm opacity-90">Find new learning opportunities</div>
          </button>

          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all">
            <Calendar className="h-6 w-6 mb-2" />
            <div className="font-medium">Set Study Schedule</div>
            <div className="text-sm opacity-90">Plan learning sessions</div>
          </button>

          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all">
            <TrendingUp className="h-6 w-6 mb-2" />
            <div className="font-medium">View Reports</div>
            <div className="text-sm opacity-90">Detailed progress analysis</div>
          </button>
        </div>
      </div>
    </div>
  )
}
