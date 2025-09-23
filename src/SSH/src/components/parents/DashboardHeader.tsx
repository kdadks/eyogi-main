import React from 'react'
import { Mail, Calendar, Award, TrendingUp, Clock, Target, BookOpen, Flame } from 'lucide-react'
import { Child } from '../../data/mockParentsData'

interface DashboardHeaderProps {
  child: Child
}

export default function DashboardHeader({ child }: DashboardHeaderProps) {
  return (
    <div className="bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Child Profile Info */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl mr-4 shadow-lg">
              {child.avatar || child.fullName.charAt(0)}
            </div>

            {/* Child Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{child.fullName}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500">
                  {child.grade} • Age {child.age}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Target className="h-4 w-4 mr-1" />
                  <span className="font-mono">{child.studentId}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{child.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Progress Circle */}
          <div className="mt-4 lg:mt-0">
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - child.overallProgress / 100)}`}
                    className="text-indigo-500 transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{child.overallProgress}%</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">Overall Progress</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Enrolled Courses */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Courses</p>
                <p className="text-2xl font-bold text-blue-600">{child.enrolledCourses.length}</p>
              </div>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <Flame className="h-6 w-6 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900">Streak</p>
                <p className="text-2xl font-bold text-orange-600">{child.streakDays}</p>
              </div>
            </div>
          </div>

          {/* Daily Learning Time */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Daily Time</p>
                <p className="text-2xl font-bold text-green-600">{child.learningTime.daily}m</p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Badges</p>
                <p className="text-2xl font-bold text-purple-600">{child.achievements.length}</p>
              </div>
            </div>
          </div>

          {/* Pending Assignments */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {child.assignments.filter((a) => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          {/* Average Grade */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-rose-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-rose-900">Avg Grade</p>
                <p className="text-2xl font-bold text-rose-600">
                  {child.enrolledCourses.length > 0
                    ? Math.round(
                        child.enrolledCourses.reduce(
                          (sum, course) => sum + course.currentGrade,
                          0,
                        ) / child.enrolledCourses.length,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievement Badge */}
        {child.achievements.length > 0 && (
          <div className="mt-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
              <Award className="h-4 w-4 mr-2" />
              Latest: {child.achievements[child.achievements.length - 1].title}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
