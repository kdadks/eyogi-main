import React, { useState, useEffect } from 'react'
import { PrerequisiteCheckResult, Course } from '../../types'
import { checkCoursePrerequisites, getPrerequisiteCourses } from '../../lib/api/prerequisites'
import { CheckCircle, XCircle, AlertTriangle, BookOpen, Award, TrendingUp } from 'lucide-react'
interface PrerequisiteCheckerProps {
  courseId: string
  studentId: string
  onPrerequisiteCheck?: (result: PrerequisiteCheckResult) => void
  showFullDetails?: boolean
}
export const PrerequisiteChecker: React.FC<PrerequisiteCheckerProps> = ({
  courseId,
  studentId,
  onPrerequisiteCheck,
  showFullDetails = true,
}) => {
  const [prerequisiteResult, setPrerequisiteResult] = useState<PrerequisiteCheckResult | null>(null)
  const [prerequisiteCourses, setPrerequisiteCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const checkPrerequisites = async () => {
      try {
        setLoading(true)
        setError(null)
        const [result, prereqCourses] = await Promise.all([
          checkCoursePrerequisites(courseId, studentId),
          getPrerequisiteCourses(courseId),
        ])
        setPrerequisiteResult(result)
        setPrerequisiteCourses(prereqCourses)
        if (onPrerequisiteCheck) {
          onPrerequisiteCheck(result)
        }
      } catch {
        setError('Failed to check prerequisites')
      } finally {
        setLoading(false)
      }
    }
    if (courseId && studentId) {
      checkPrerequisites()
    }
  }, [courseId, studentId, onPrerequisiteCheck])
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking prerequisites...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="ml-2 text-sm text-red-700">{error}</span>
        </div>
      </div>
    )
  }
  if (!prerequisiteResult) {
    return null
  }
  return (
    <div className="space-y-4">
      {/* Main Status */}
      <div
        className={`border-2 rounded-lg p-4 relative overflow-hidden ${
          prerequisiteResult.canEnroll
            ? 'bg-green-50 border-green-400'
            : prerequisiteResult.message.includes('Already enrolled')
              ? 'bg-blue-50 border-blue-400'
              : 'bg-red-50 border-red-400'
        }`}
      >
        {/* Top colored bar */}
        <div
          className={`absolute top-0 left-0 h-1 w-full ${
            prerequisiteResult.canEnroll
              ? 'bg-green-500'
              : prerequisiteResult.message.includes('Already enrolled')
                ? 'bg-blue-500'
                : 'bg-red-500'
          }`}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start flex-1">
            {prerequisiteResult.canEnroll ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : prerequisiteResult.message.includes('Already enrolled') ? (
              <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="ml-3">
              <p
                className={`font-semibold text-base ${
                  prerequisiteResult.canEnroll
                    ? 'text-green-900'
                    : prerequisiteResult.message.includes('Already enrolled')
                      ? 'text-blue-900'
                      : 'text-red-900'
                }`}
              >
                {prerequisiteResult.canEnroll
                  ? 'Ready to Enroll'
                  : prerequisiteResult.message.includes('Already enrolled')
                    ? 'Already Enrolled'
                    : 'Prerequisites Not Met'}
              </p>
              <p
                className={`mt-1 text-sm ${
                  prerequisiteResult.canEnroll
                    ? 'text-green-700'
                    : prerequisiteResult.message.includes('Already enrolled')
                      ? 'text-blue-700'
                      : 'text-red-700'
                }`}
              >
                {prerequisiteResult.message}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Detailed Prerequisites (if there are any) */}
      {showFullDetails &&
        (prerequisiteCourses.length > 0 ||
          prerequisiteResult.missingPrerequisites.skills.length > 0) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Course Prerequisites</h4>
            {/* Required Courses */}
            {prerequisiteCourses.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="ml-2 text-sm font-medium text-gray-700">Required Courses</span>
                </div>
                <div className="space-y-2">
                  {prerequisiteCourses.map((course) => {
                    const missingCourse = prerequisiteResult.missingPrerequisites.courses.find(
                      (mc) => mc.id === course.id,
                    )
                    const isCompleted = !missingCourse
                    return (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCompleted
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{course.title}</p>
                            <p className="text-xs text-gray-500">
                              Level: {course.level} | Duration: {course.duration_weeks} weeks
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isCompleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {isCompleted
                              ? 'Completed'
                              : missingCourse?.completion_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Required Skills */}
            {prerequisiteResult.missingPrerequisites.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Award className="h-4 w-4 text-gray-500" />
                  <span className="ml-2 text-sm font-medium text-gray-700">Required Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prerequisiteResult.missingPrerequisites.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Required Level */}
            {prerequisiteResult.missingPrerequisites.level && (
              <div>
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="ml-2 text-sm font-medium text-gray-700">Minimum Level</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Required:{' '}
                    <span className="font-medium">
                      {prerequisiteResult.missingPrerequisites.level.required}
                    </span>
                    {' | '}
                    Current:{' '}
                    <span className="font-medium">
                      {prerequisiteResult.missingPrerequisites.level.current}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
export default PrerequisiteChecker
