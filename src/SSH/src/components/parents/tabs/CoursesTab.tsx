import React, { useState } from 'react'
import {
  BookOpen,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  Star,
  Calendar,
} from 'lucide-react'
import { Child } from '../../../data/mockParentsData'

interface CoursesTabProps {
  child: Child
}

export default function CoursesTab({ child }: CoursesTabProps) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Course Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {child.enrolledCourses.length}
            </div>
            <div className="text-sm text-gray-500">Enrolled Courses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {child.enrolledCourses.filter((c) => c.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Math.round(
                child.enrolledCourses.reduce((sum, course) => sum + course.progress, 0) /
                  (child.enrolledCourses.length || 1),
              )}
              %
            </div>
            <div className="text-sm text-gray-500">Average Progress</div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      {child.enrolledCourses.length > 0 ? (
        <div className="space-y-4">
          {child.enrolledCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Course Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                      <button
                        onClick={() => toggleCourseExpansion(course.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedCourses.has(course.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <span className="text-sm text-gray-600">{course.subject}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(course.difficulty)}`}
                      >
                        {course.difficulty}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(course.status)}`}
                      >
                        {course.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Course Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                        <span>
                          {course.completedLessons}/{course.totalLessons} lessons
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-2" />
                        <span>Grade: {course.currentGrade}%</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                        <span>Started: {formatDate(course.enrollmentDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        <span>Est. completion: {formatDate(course.estimatedCompletionDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Course Details */}
              {expandedCourses.has(course.id) && (
                <div className="p-6 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">Lessons</h4>

                  {course.lessons.length > 0 ? (
                    <div className="space-y-3">
                      {course.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            lesson.completed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="mr-3">
                              {lesson.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Play className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{lesson.title}</h5>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{lesson.duration} minutes</span>
                                {lesson.completed && lesson.completedAt && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>Completed {formatDate(lesson.completedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {lesson.completed && lesson.grade && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">
                                {lesson.grade}%
                              </div>
                              <div className="text-xs text-gray-500">Grade</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No lessons available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* No Courses State */
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
          <p className="text-gray-500 mb-6">
            {child.fullName} hasn't enrolled in any courses yet. Explore our course catalog to get
            started!
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </button>
        </div>
      )}

      {/* Course Recommendations */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <h3 className="text-lg font-medium mb-4">Recommended Courses</h3>
        <p className="mb-4 opacity-90">
          Based on {child.fullName}'s age and current progress, here are some recommended courses:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all cursor-pointer">
            <h4 className="font-medium mb-2">Meditation for Kids</h4>
            <p className="text-sm opacity-90">
              Learn mindfulness and relaxation techniques designed for children
            </p>
            <div className="mt-2 text-xs opacity-75">Beginner • 8 lessons • 15 min each</div>
          </div>

          <div className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all cursor-pointer">
            <h4 className="font-medium mb-2">Yoga Poses for Beginners</h4>
            <p className="text-sm opacity-90">
              Introduction to basic yoga poses and breathing exercises
            </p>
            <div className="mt-2 text-xs opacity-75">Beginner • 12 lessons • 20 min each</div>
          </div>
        </div>
      </div>
    </div>
  )
}
