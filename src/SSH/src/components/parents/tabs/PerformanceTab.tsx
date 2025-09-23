import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  Clock,
  Target,
  Star,
  Calendar,
} from 'lucide-react'
import { Child } from '../../../data/mockParentsData'

interface PerformanceTabProps {
  child: Child
}

export default function PerformanceTab({ child }: PerformanceTabProps) {
  const overallGrade =
    child.enrolledCourses.length > 0
      ? Math.round(
          child.enrolledCourses.reduce((sum, course) => sum + course.currentGrade, 0) /
            child.enrolledCourses.length,
        )
      : 0

  const completedAssignments = child.assignments.filter((a) => a.status === 'graded').length
  const averageAssignmentGrade =
    completedAssignments > 0
      ? Math.round(
          child.assignments
            .filter((a) => a.status === 'graded' && a.grade)
            .reduce((sum, a) => sum + (a.grade || 0), 0) / completedAssignments,
        )
      : 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Mock performance data for demonstration
  const monthlyProgress = [
    { month: 'Jan', progress: 65 },
    { month: 'Feb', progress: 72 },
    { month: 'Mar', progress: 78 },
    { month: 'Apr', progress: 85 },
    { month: 'May', progress: 82 },
  ]

  const subjectPerformance = [
    { subject: 'Philosophy', grade: 89, trend: 'up' },
    { subject: 'Language', grade: 82, trend: 'up' },
    { subject: 'Physical Ed', grade: 95, trend: 'stable' },
  ]

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{child.overallProgress}%</div>
          <div className="text-sm text-gray-500">Overall Progress</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{overallGrade}%</div>
          <div className="text-sm text-gray-500">Average Grade</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{child.achievements.length}</div>
          <div className="text-sm text-gray-500">Achievements</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{child.streakDays}</div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Progress Over Time</h3>
        <div className="relative">
          {/* Simple bar chart representation */}
          <div className="flex items-end justify-between h-64 px-4">
            {monthlyProgress.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center flex-1 mx-1">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-md transition-all duration-300 hover:opacity-80"
                  style={{ height: `${(data.progress / 100) * 200}px` }}
                />
                <div className="mt-2 text-sm text-gray-600">{data.month}</div>
                <div className="text-xs text-gray-500">{data.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Performance by Subject</h3>
        <div className="space-y-4">
          {child.enrolledCourses.map((course, index) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Target className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{course.subject}</h4>
                  <p className="text-sm text-gray-500">{course.title}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{course.currentGrade}%</div>
                  <div className="text-sm text-gray-500">Current Grade</div>
                </div>

                <div className="flex items-center">
                  {course.currentGrade >= 85 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : course.currentGrade >= 70 ? (
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${course.currentGrade}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-600" />
          Recent Achievements
        </h3>

        {child.achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {child.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
              >
                <div className="text-2xl mr-4">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Earned on {formatDate(achievement.earnedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No achievements yet</h3>
            <p className="mt-1 text-sm text-gray-500">Keep learning to earn your first badge!</p>
          </div>
        )}
      </div>

      {/* Learning Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Time Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Study Time Analysis
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily Average</span>
              <span className="font-medium text-gray-900">{child.learningTime.daily} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Weekly Total</span>
              <span className="font-medium text-gray-900">{child.learningTime.weekly} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Total</span>
              <span className="font-medium text-gray-900">
                {child.learningTime.monthly} minutes
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Consistency</span>
              <span className="font-medium text-green-600">{child.streakDays} day streak</span>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Performance Insights
          </h3>

          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Strong Performance</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {child.fullName} shows excellent consistency in learning with a {child.streakDays}
                -day streak.
              </p>
            </div>

            {child.enrolledCourses.some((c) => c.currentGrade >= 90) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">High Achiever</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Maintaining high grades across multiple subjects.
                </p>
              </div>
            )}

            {completedAssignments > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">Assignment Success</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  Average assignment grade: {averageAssignmentGrade}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
