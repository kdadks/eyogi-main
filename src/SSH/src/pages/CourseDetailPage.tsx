import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import SEOHead from '../components/seo/SEOHead'
import { generateCourseSchema, generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Course, PrerequisiteCheckResult } from '../types'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
import { getEnrolledCount, getCourseBySlug } from '../lib/api/courses'
import { enrollInCourse, getStudentEnrollments } from '../lib/api/enrollments'
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
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import ChatBotTrigger from '../components/chat/ChatBotTrigger'
import { sanitizeHtml } from '../utils/sanitize'

/**
 * Parse learning outcomes to handle both HTML and plain text
 * Extracts content from list items while preserving inline formatting (bold, italic, links, etc.)
 * Removes list wrapper tags and Quill-specific classes
 */
function parseLearningOutcomes(outcomes: string[]): Array<{ content: string; isHtml: boolean }> {
  const parsedOutcomes: Array<{ content: string; isHtml: boolean }> = []

  outcomes.forEach((outcome) => {
    let trimmed = outcome.trim()
    if (!trimmed) return

    // Check if outcome contains HTML tags
    if (trimmed.includes('<')) {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = trimmed

      // Extract content from list items if present
      const listItems = tempDiv.querySelectorAll('li')
      if (listItems.length > 0) {
        listItems.forEach((li) => {
          // Remove Quill classes from the li element itself
          li.removeAttribute('class')

          // Get the innerHTML to preserve inline formatting (bold, italic, links, etc.)
          let content = li.innerHTML.trim()

          // Remove any Quill-specific classes from child elements
          const childElements = li.querySelectorAll('[class*="ql-"]')
          childElements.forEach((el) => {
            const classes = el.className.split(' ').filter((c) => !c.startsWith('ql-'))
            if (classes.length > 0) {
              el.className = classes.join(' ')
            } else {
              el.removeAttribute('class')
            }
          })

          content = li.innerHTML.trim()

          if (content) {
            // Check if content has HTML formatting
            const hasHtml = /<\w+[^>]*>/.test(content)
            parsedOutcomes.push({ content, isHtml: hasHtml })
          }
        })
      } else {
        // No list items, just extract the content
        // Remove wrapping ul/ol tags if present
        let content = tempDiv.innerHTML.trim()
        content = content.replace(/^<ul[^>]*>|<\/ul>$/gi, '')
        content = content.replace(/^<ol[^>]*>|<\/ol>$/gi, '')
        content = content.trim()

        if (content) {
          const hasHtml = /<\w+[^>]*>/.test(content)
          parsedOutcomes.push({ content, isHtml: hasHtml })
        }
      }
    } else {
      // It's plain text
      parsedOutcomes.push({ content: trimmed, isHtml: false })
    }
  })

  return parsedOutcomes
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useWebsiteAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [prerequisiteResult, setPrerequisiteResult] = useState<PrerequisiteCheckResult | null>(null)
  const [children, setChildren] = useState<Profile[]>([])
  const [showChildSelectionModal, setShowChildSelectionModal] = useState(false)
  const [allChildrenEnrolled, setAllChildrenEnrolled] = useState(false)

  // Check if all children are enrolled when page loads (for parents)
  useEffect(() => {
    const checkChildrenEnrollment = async () => {
      if (user?.role === 'parent' && course?.id) {
        try {
          const parentChildren = await getChildrenByParentId(user.id)
          if (parentChildren.length === 0) {
            setAllChildrenEnrolled(false)
            return
          }

          const childrenWithEnrollmentStatus = await Promise.all(
            parentChildren.map(async (child) => {
              const enrollments = await getStudentEnrollments(child.id)
              const isEnrolled = enrollments.some(
                (enrollment) => enrollment.course_id === course.id,
              )
              return isEnrolled
            }),
          )

          // Check if ALL children are enrolled
          const allEnrolled = childrenWithEnrollmentStatus.every((isEnrolled) => isEnrolled)
          setAllChildrenEnrolled(allEnrolled)
        } catch (error) {
          console.error('Failed to check children enrollment:', error)
          setAllChildrenEnrolled(false)
        }
      }
    }

    checkChildrenEnrollment()
  }, [user, course])

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
        // Redirect student to dashboard after enrollment
        navigate('/dashboard/student')
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

        // Filter out children who are already enrolled in this course
        const childrenWithEnrollmentStatus = await Promise.all(
          parentChildren.map(async (child) => {
            const enrollments = await getStudentEnrollments(child.id)
            const isEnrolled = enrollments.some((enrollment) => enrollment.course_id === course!.id)
            return { ...child, isEnrolled }
          }),
        )

        const unenrolledChildren = childrenWithEnrollmentStatus.filter((child) => !child.isEnrolled)

        if (unenrolledChildren.length === 0) {
          toast.error('All your children are already enrolled in this course')
          return
        }

        setChildren(unenrolledChildren)
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

      // Re-check if all children are now enrolled
      if (user?.role === 'parent' && course?.id) {
        const parentChildren = await getChildrenByParentId(user.id)
        const childrenWithEnrollmentStatus = await Promise.all(
          parentChildren.map(async (child) => {
            const enrollments = await getStudentEnrollments(child.id)
            const isEnrolled = enrollments.some((enrollment) => enrollment.course_id === course.id)
            return isEnrolled
          }),
        )
        const allEnrolled = childrenWithEnrollmentStatus.every((isEnrolled) => isEnrolled)
        setAllChildrenEnrolled(allEnrolled)
      }
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
        <div className="relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden hero-section min-h-[400px]">
          {/* Sunrise Effect Background */}
          <div className="sunrise-bg"></div>
          <div className="sunrise-horizon-glow"></div>
          <div className="sunrise-sun"></div>
          <div className="sunrise-rays">
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
            <div className="sunrise-ray"></div>
          </div>
          <div className="sunrise-cloud sunrise-cloud-1"></div>
          <div className="sunrise-cloud sunrise-cloud-2"></div>
          <div className="sunrise-cloud sunrise-cloud-3"></div>

          {/* Glossy Glass Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/20 to-white/30 backdrop-blur-md z-[3]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 via-orange-50/30 to-red-100/40 backdrop-blur-sm z-[3]"></div>

          <div className="relative max-w-[1200px] mx-auto py-12 px-6 sm:px-8 lg:px-10 z-[4] sunrise-content">
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
                    className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed whitespace-pre-wrap
                      [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-6 [&_ul_li]:mb-1
                      [&_ol]:list-decimal [&_ol]:ml-6 [&_ol_li]:mb-1
                      [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline
                      [&_a]:text-orange-600 [&_a]:hover:text-orange-700
                      [&_blockquote]:ml-8 [&_blockquote]:pl-4 [&_blockquote_ul]:list-disc [&_blockquote_ol]:list-decimal
                      [&_blockquote_li]:mb-1 [&_.ql-indent-1]:ml-8 [&_.ql-indent-2]:ml-16 [&_.ql-indent-3]:ml-24 [&_.ql-indent-4]:ml-32
                      [&_li_ul]:ml-6 [&_li_ol]:ml-6 [&_li_ul_li]:mb-1 [&_li_ol_li]:mb-1"
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
                          {/* Status Display for Students */}
                          {user.role === 'student' &&
                            prerequisiteResult &&
                            !prerequisiteResult.canEnroll && (
                              <div
                                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                                  prerequisiteResult.message.includes('Already enrolled')
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-red-50 border-red-300'
                                }`}
                              >
                                {prerequisiteResult.message.includes('Already enrolled') ? (
                                  <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                                ) : (
                                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                                )}
                                <div>
                                  <p
                                    className={`font-semibold ${
                                      prerequisiteResult.message.includes('Already enrolled')
                                        ? 'text-blue-900'
                                        : 'text-red-900'
                                    }`}
                                  >
                                    {prerequisiteResult.message.includes('Already enrolled')
                                      ? 'Already Enrolled'
                                      : 'Prerequisites Not Met'}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      prerequisiteResult.message.includes('Already enrolled')
                                        ? 'text-blue-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    {prerequisiteResult.message}
                                  </p>
                                </div>
                              </div>
                            )}
                          {/* Prerequisites Checker - only for students who are not already enrolled */}
                          {user.role === 'student' &&
                            !(
                              prerequisiteResult &&
                              prerequisiteResult.message.includes('Already enrolled')
                            ) && (
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
                              !!(prerequisiteResult && !prerequisiteResult.canEnroll) ||
                              (user.role === 'parent' && allChildrenEnrolled)
                            }
                          >
                            {enrolledCount >= course.max_students
                              ? 'Course Full'
                              : prerequisiteResult && !prerequisiteResult.canEnroll
                                ? prerequisiteResult.message.includes('Already enrolled')
                                  ? 'Already Enrolled'
                                  : 'Prerequisites Not Met'
                                : user.role === 'parent' && allChildrenEnrolled
                                  ? 'All Children Enrolled'
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
                        <Link
                          to={`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`}
                        >
                          <Button className="w-full">Sign In to Enroll</Button>
                        </Link>
                        <p className="text-xs text-center text-gray-600">
                          Don't have an account?{' '}
                          <Link
                            to={`/auth/signup?redirect=${encodeURIComponent(window.location.pathname)}`}
                            className="text-orange-600 hover:text-orange-700"
                          >
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
              {/* Course Media */}
              {(course.cover_image_url || course.video_preview_url) && (
                <Card>
                  <CardContent className="space-y-6">
                    {course.cover_image_url && (
                      <div>
                        <img
                          src={course.cover_image_url}
                          alt={`${course.title} cover`}
                          className="w-full h-auto rounded-lg object-cover max-h-96"
                        />
                      </div>
                    )}
                    {course.video_preview_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-3">Preview Video</p>
                        <video
                          controls
                          className="w-full h-auto rounded-lg bg-black max-h-96"
                          poster={course.cover_image_url || undefined}
                        >
                          <source src={course.video_preview_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Detailed Description */}
              {course.detailed_description && (
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">About This Course</h2>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-base text-gray-700 leading-relaxed space-y-4
                        [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul_li]:mb-2
                        [&_ol]:list-decimal [&_ol]:ml-6 [&_ol_li]:mb-2
                        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5
                        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-4
                        [&_strong]:font-bold [&_em]:italic [&_u]:underline
                        [&_a]:text-orange-600 [&_a]:hover:text-orange-700 [&_a]:underline
                        [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-4 [&_blockquote]:italic
                        [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono
                        [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-4
                        [&_.ql-indent-1]:ml-8 [&_.ql-indent-2]:ml-16 [&_.ql-indent-3]:ml-24 [&_.ql-indent-4]:ml-32
                        [&_.ql-indent-1_ul]:ml-4 [&_.ql-indent-2_ul]:ml-8 [&_.ql-indent-3_ul]:ml-12"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(course.detailed_description),
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              {/* Learning Outcomes */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">What You'll Learn</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parseLearningOutcomes(course.learning_outcomes).map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        {item.isHtml ? (
                          <div
                            className="text-gray-700 flex-1"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(item.content),
                            }}
                          />
                        ) : (
                          <span className="text-gray-700 flex-1">{item.content}</span>
                        )}
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
              {(!user || user.role !== 'student') &&
                course.prerequisites &&
                Array.isArray(course.prerequisites) &&
                course.prerequisites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-bold">Prerequisites</h2>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {parseLearningOutcomes(course.prerequisites).map((item, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            {item.isHtml ? (
                              <div
                                className="text-gray-700 flex-1"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeHtml(item.content),
                                }}
                              />
                            ) : (
                              <span className="text-gray-700 flex-1">{item.content}</span>
                            )}
                          </div>
                        ))}
                      </div>
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
                    <span className="capitalize">
                      {course.delivery_method === 'remote' && 'Online'}
                      {course.delivery_method === 'physical' && 'In-person'}
                      {course.delivery_method === 'hybrid' && 'Hybrid'}
                    </span>
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
