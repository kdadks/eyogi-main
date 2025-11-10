import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import SEOHead from '../components/seo/SEOHead'
import { generateCourseSchema, generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Course, PrerequisiteCheckResult } from '../types'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
import { getEnrolledCount, getCourseBySlug } from '../lib/api/courses'
import { enrollInCourse } from '../lib/api/enrollments'
import { getChildrenByParentId } from '../lib/api/children'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, getAgeGroupLabel, getLevelColor, generateCourseUrl } from '../lib/utils'
import PrerequisiteChecker from '../components/courses/PrerequisiteChecker'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import ChatBotTrigger from '../components/chat/ChatBotTrigger'
import { sanitizeHtml } from '../utils/sanitize'

/**
 * Parse learning outcomes to handle both HTML lists and plain text
 * If an outcome contains HTML list tags, extract individual list items
 * Otherwise, return the outcome as-is
 */
function parseLearningOutcomes(outcomes: string[]): string[] {
  const parsedOutcomes: string[] = []

  outcomes.forEach((outcome) => {
    // Check if outcome contains HTML list tags
    if (outcome.includes('<ul>') || outcome.includes('<ol>') || outcome.includes('<li>')) {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = sanitizeHtml(outcome)

      // Extract all list items
      const listItems = tempDiv.querySelectorAll('li')
      if (listItems.length > 0) {
        listItems.forEach((li) => {
          const text = li.textContent?.trim()
          if (text) {
            parsedOutcomes.push(text)
          }
        })
      } else {
        // If no list items found, strip HTML tags and add as plain text
        const textContent = tempDiv.textContent?.trim()
        if (textContent) {
          parsedOutcomes.push(textContent)
        }
      }
    } else {
      // Plain text outcome
      const trimmed = outcome.trim()
      if (trimmed) {
        parsedOutcomes.push(trimmed)
      }
    }
  })

  return parsedOutcomes
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useWebsiteAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [prerequisiteResult, setPrerequisiteResult] = useState<PrerequisiteCheckResult | null>(null)
  const [children, setChildren] = useState<Profile[]>([])
  const [showChildSelectionModal, setShowChildSelectionModal] = useState(false)
  const loadCourseData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      const [courseData, enrolledCountData] = await Promise.all([
        getCourseBySlug(id),
        getEnrolledCount(id),
      ])
      setCourse(courseData)
      setEnrolledCount(enrolledCountData)
    } catch {
      toast.error('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    if (id) {
      loadCourseData()
    }
  }, [id, loadCourseData])

  useEffect(() => {
    // Scroll to top when component mounts or course ID changes
    window.scrollTo(0, 0)
  }, [id])

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll in courses')
      return
    }

    if (user.role === 'student') {
      // Direct enrollment for students
      setEnrolling(true)
      try {
        await enrollInCourse(course!.id, user.id)
        toast.success('Enrollment request submitted! You will receive confirmation once approved.')
      } catch {
        toast.error('Failed to enroll in course')
      } finally {
        setEnrolling(false)
      }
    } else if (user.role === 'parent') {
      // For parents, load children and show selection modal
      try {
        const parentChildren = await getChildrenByParentId(user.id)
        if (parentChildren.length === 0) {
          toast.error('You need to add children to your account before enrolling them in courses')
          return
        }
        setChildren(parentChildren)
        setShowChildSelectionModal(true)
      } catch {
        toast.error('Failed to load your children. Please try again.')
      }
    } else {
      toast.error('Only students and parents can enroll in courses')
    }
  }

  const handleChildSelection = async (childId: string) => {
    const selectedChild = children.find((child) => child.id === childId)
    if (!selectedChild) return

    setEnrolling(true)
    setShowChildSelectionModal(false)
    try {
      await enrollInCourse(course!.id, selectedChild.id)
      toast.success(`${selectedChild.full_name} has been enrolled in ${course!.title}!`)
    } catch {
      toast.error('Failed to enroll child in course')
    } finally {
      setEnrolling(false)
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    )
  }
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-8">The course you're looking for doesn't exist.</p>
          <Link to="/courses">
            <Button>Browse All Courses</Button>
          </Link>
        </div>
      </div>
    )
  }
  const syllabus = course?.syllabus as
    | {
        classes?: Array<{ number: number; title: string; topics: string[]; duration: string }>
      }
    | undefined
  return (
    <>
      <SEOHead
        title={
          course
            ? `${course.title} - Hindu Course | ${course.gurukul?.name}`
            : 'Hindu Course Details'
        }
        description={
          course
            ? `${course.description} Learn authentic Hindu traditions and Vedic wisdom in this ${course.level} level course. Duration: ${course.duration_weeks} weeks. Ages ${course.age_group_min}-${course.age_group_max}.`
            : 'Explore detailed Hindu course information and enroll in authentic Vedic education.'
        }
        keywords={
          course
            ? [
                `${course.title} Online`,
                `Hindu ${course.title}`,
                `Vedic ${course.title}`,
                `${course.gurukul?.name} Course`,
                `Hindu ${course.level} Course`,
                `Sanatan Dharma ${course.title}`,
                `Traditional Hindu ${course.title}`,
                `${course.course_number} Course`,
                `Hindu Education ${course.level}`,
                'Hindu Course Online',
                'Vedic Learning Course',
                'Sanatan Dharma Education',
              ]
            : []
        }
        canonicalUrl={course ? generateCourseUrl(course) : '/courses'}
        structuredData={
          course
            ? [
                generateCourseSchema(course),
                generateBreadcrumbSchema([
                  { name: 'Home', url: '/' },
                  { name: 'Hindu Courses', url: '/courses' },
                  { name: course.title, url: generateCourseUrl(course) },
                ]),
              ]
            : []
        }
      />
      <div className="bg-gray-50 pb-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50">
          <div className="max-w-[1200px] mx-auto py-12 px-6 sm:px-8 lg:px-10">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  <Link to="/courses" className="text-orange-600 hover:text-orange-700">
                    ← Back to Courses
                  </Link>
                  <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                  <span className="text-sm text-gray-500">{course.course_number}</span>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    {course.title}
                  </h1>
                  <div
                    className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-gray-600">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    <span>Ages {getAgeGroupLabel(course.age_group_min, course.age_group_max)}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>{course.duration_weeks} weeks</span>
                  </div>
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    <span>{enrolledCount} enrolled</span>
                  </div>
                </div>
                {course.gurukul && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <BookOpenIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.gurukul.name}</h3>
                        <div
                          className="text-sm text-gray-600"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(course.gurukul.description),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Enrollment Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatCurrency(course.price)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {course.delivery_method === 'remote' && '🌐 Online Course'}
                        {course.delivery_method === 'physical' && '🏫 In-person Course'}
                        {course.delivery_method === 'hybrid' && '🔄 Hybrid Course'}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{course.duration_weeks} weeks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Students:</span>
                        <span className="font-medium">{course.max_students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrolled:</span>
                        <span className="font-medium">{enrolledCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium">{course.max_students - enrolledCount}</span>
                      </div>
                    </div>
                    {user ? (
                      user.role === 'student' || user.role === 'parent' ? (
                        <div className="space-y-4">
                          {/* Prerequisites Checker - only for students */}
                          {user.role === 'student' && (
                            <PrerequisiteChecker
                              courseId={course.id}
                              studentId={user.id}
                              onPrerequisiteCheck={setPrerequisiteResult}
                              showFullDetails={false}
                            />
                          )}
                          <Button
                            className="w-full"
                            onClick={handleEnroll}
                            loading={enrolling}
                            disabled={
                              enrolledCount >= course.max_students ||
                              !!(prerequisiteResult && !prerequisiteResult.canEnroll)
                            }
                          >
                            {enrolledCount >= course.max_students
                              ? 'Course Full'
                              : prerequisiteResult && !prerequisiteResult.canEnroll
                                ? 'Prerequisites Not Met'
                                : user.role === 'parent'
                                  ? 'Enroll Child'
                                  : 'Enroll Now'}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-600">
                          Only students and parents can enroll in courses
                        </div>
                      )
                    ) : (
                      <div className="space-y-2">
                        <Link to="/auth/signin">
                          <Button className="w-full">Sign In to Enroll</Button>
                        </Link>
                        <p className="text-xs text-center text-gray-600">
                          Don't have an account?{' '}
                          <Link to="/auth/signup" className="text-orange-600 hover:text-orange-700">
                            Sign up
                          </Link>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        {/* Course Content */}
        <div className="container-max py-0 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              {/* Learning Outcomes */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">What You'll Learn</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {parseLearningOutcomes(course.learning_outcomes).map((outcome, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Course Syllabus */}
              {syllabus?.classes && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Course Syllabus</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {syllabus.classes.map((classItem, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">
                              Class {classItem.number}: {classItem.title}
                            </h3>
                            <span className="text-sm text-gray-500">{classItem.duration}</span>
                          </div>
                          <ul className="space-y-1">
                            {classItem.topics.map((topic, topicIndex) => (
                              <li key={topicIndex} className="text-gray-600 text-sm">
                                • {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Prerequisites */}
              {user && user.role === 'student' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Prerequisites</h2>
                  </CardHeader>
                  <CardContent>
                    <PrerequisiteChecker
                      courseId={course.id}
                      studentId={user.id}
                      onPrerequisiteCheck={setPrerequisiteResult}
                      showFullDetails={true}
                    />
                  </CardContent>
                </Card>
              )}
              {/* Prerequisites (for non-students or non-authenticated users) */}
              {(!user || user.role !== 'student') && course.prerequisites && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Prerequisites</h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{course.prerequisites}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Teacher Info */}
              {course.teacher && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Your Instructor</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {course.teacher.full_name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{course.teacher.full_name || 'Teacher'}</p>
                        <p className="text-sm text-gray-600">Certified Instructor</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Course Details */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Course Details</h3>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level:</span>
                    <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age Group:</span>
                    <span>{getAgeGroupLabel(course.age_group_min, course.age_group_max)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{course.duration_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="capitalize">{course.delivery_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Certificate:</span>
                    <span>Yes</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {/* AI Chat Assistant */}
        <ChatBotTrigger
          initialMessage={course ? `Tell me more about ${course.title}` : undefined}
        />
      </div>

      {/* Child Selection Modal for Parents */}
      {showChildSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Child to Enroll</h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose which child you want to enroll in {course?.title}:
              </p>
              <div className="space-y-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildSelection(child.id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900">{child.full_name}</div>
                    <div className="text-sm text-gray-600">
                      Age: {child.age || 'N/A'} | Grade: {child.grade || 'N/A'}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowChildSelectionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
