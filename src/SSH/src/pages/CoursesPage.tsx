import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

import { Course, Gurukul } from '../types'
import { getCourses } from '../lib/api/courses'
import { getGurukuls } from '../lib/api/gurukuls'
import { formatCurrency, getAgeGroupLabel, getLevelColor, generateCourseUrl } from '../lib/utils'
import { sanitizeHtml } from '../utils/sanitize'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline'
export default function CoursesPage() {
  const [searchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGurukul, setSelectedGurukul] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Set initial level from URL query parameter
  useEffect(() => {
    const levelParam = searchParams.get('level')
    setSelectedLevel(levelParam || '')
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedGurukul, selectedLevel, ageGroup])

  useEffect(() => {
    loadCourses()
  }, [currentPage, searchTerm, selectedGurukul, selectedLevel, ageGroup])

  const loadData = async () => {
    try {
      const { gurukuls: gurukulData } = await getGurukuls()
      setGurukuls(gurukulData)
    } catch {
      // Error loading data - silent fail
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      setLoading(true)
      const { courses: coursesData, total } = await getCourses({
        page: currentPage,
        limit: itemsPerPage,
        gurukul_id: selectedGurukul || undefined,
        level: selectedLevel || undefined,
        search: searchTerm || undefined,
      })

      // Client-side age filtering since it's not in the API
      let filteredData = coursesData
      if (ageGroup) {
        const age = parseInt(ageGroup)
        filteredData = coursesData.filter(
          (course) => course.age_group_min <= age && course.age_group_max >= age,
        )
      }

      setCourses(filteredData)
      setTotalCourses(total)
    } catch {
      // Error loading data - silent fail
      setCourses([])
      setTotalCourses(0)
    } finally {
      setLoading(false)
    }
  }

  // Remove the old filtered courses logic and pagination calculation
  const totalPages = Math.ceil(totalCourses / itemsPerPage)
  const levels = [
    { value: 'elementary', label: 'Elementary (4-7 years)' },
    { value: 'basic', label: 'Basic (8-11 years)' },
    { value: 'intermediate', label: 'Intermediate (12-15 years)' },
    { value: 'advanced', label: 'Advanced (16-19 years)' },
  ]
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }
  return (
    <>
      <SEOHead
        title="Hindu Courses & Vedic Education Programs"
        description="Explore comprehensive Hindu education courses covering Vedic philosophy, Sanskrit, mantras, yoga, and Sanatan Dharma. Expert-led online classes for all age groups from traditional Gurukuls."
        keywords={[
          'Hindu Courses Online',
          'Vedic Education Programs',
          'Sanatan Dharma Classes',
          'Hindu Philosophy Courses',
          'Sanskrit Courses Online',
          'Hindu Culture Classes',
          'Vedic Studies Courses',
          'Hindu Religion Education',
          'Traditional Hindu Learning',
          'Hindu Spiritual Courses',
          'Dharma Education Classes',
          'Hindu Heritage Courses',
          'Vedic Wisdom Programs',
          'Hindu Online Classes',
          'Indian Hindu Education',
          'Hindu Gurukul Courses',
          'Authentic Hindu Teaching',
          'Hindu Values Education',
        ]}
        canonicalUrl="/courses"
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Hindu Courses & Vedic Education', url: '/courses' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Hindu Courses & Vedic Education Programs',
            description:
              'Comprehensive collection of Hindu education courses covering Vedic philosophy, Sanskrit, mantras, yoga, and Sanatan Dharma traditions.',
            url: 'https://eyogi-gurukul.vercel.app/courses',
            mainEntity: {
              '@type': 'ItemList',
              name: 'Hindu Education Courses',
              description: 'Expert-led courses in Hindu traditions and Vedic learning',
            },
          },
        ]}
      />
      <div>
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden hero-section min-h-[400px]">
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

            <div className="relative container-max section-padding z-[4] sunrise-content">
              <div className="text-center max-w-4xl mx-auto mb-6 sm:mb-8 px-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Explore Our Courses
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto">
                  Discover comprehensive courses in Vedic wisdom, designed for learners of all ages.
                  From ancient philosophy to practical applications in modern life.
                </p>
              </div>

              {/* Filters */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 sm:pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm h-10 sm:h-11 px-3 py-2 touch-manipulation"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedGurukul}
                    onChange={(e) => setSelectedGurukul(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation"
                    style={{ fontSize: '13px' }}
                  >
                    <option value="">All Gurukuls</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation"
                    style={{ fontSize: '13px' }}
                  >
                    <option value="">All Levels</option>
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Your age"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    min="4"
                    max="100"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm h-10 sm:h-11 px-3 py-2 touch-manipulation"
                  />
                </div>
                <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <p className="text-xs text-gray-600">
                    Showing {courses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
                    {Math.min(currentPage * itemsPerPage, totalCourses)} of {totalCourses} courses
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 sm:h-9 text-xs sm:text-sm touch-manipulation"
                    style={{ minHeight: '36px' }}
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedGurukul('')
                      setSelectedLevel('')
                      setAgeGroup('')
                    }}
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Courses Section */}
          <div className="container-max section-padding">
            {loading ? (
              <div className="text-center py-12">
                <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more courses.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {courses.map((course) => (
                    <Card key={course.id} className="card-hover overflow-hidden flex flex-col">
                      <div className="aspect-video bg-gradient-to-r from-orange-100 to-red-100 relative overflow-hidden">
                        {course.cover_image_url || course.image_url ? (
                          <img
                            src={course.cover_image_url || course.image_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-white font-bold text-lg">
                                  {course.course_number.slice(-2)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-700">
                                {course.gurukul?.name}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                          <p className="text-xs font-medium text-gray-700">
                            {course.gurukul?.name}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-4 sm:p-5 lg:p-6 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className={`${getLevelColor(course.level)} rounded-sm`}>
                            {course.level.charAt(0).toUpperCase() +
                              course.level.slice(1).toLowerCase()}
                          </Badge>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-gray-200 text-gray-800">
                            {course.course_number}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <div
                          className="text-gray-600 mb-4 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                        />
                        <div className="space-y-2 mb-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                            <span>
                              Ages {getAgeGroupLabel(course.age_group_min, course.age_group_max)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                            <span>{course.duration_weeks} weeks</span>
                          </div>
                          <div className="flex items-center">
                            <CurrencyEuroIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                            <span>{formatCurrency(course.price)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-sm text-gray-500">
                            {course.delivery_method === 'remote' && '🌐 Online'}
                            {course.delivery_method === 'physical' && '🏫 In-person'}
                            {course.delivery_method === 'hybrid' && '🔄 Hybrid'}
                          </div>
                          <Link to={generateCourseUrl(course)}>
                            <Button
                              size="sm"
                              className="text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 touch-manipulation"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="disabled:opacity-50 w-full sm:w-auto min-h-[44px] touch-manipulation"
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded text-sm font-medium touch-manipulation min-w-[44px] min-h-[44px] ${
                            currentPage === page
                              ? 'bg-orange-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-50 w-full sm:w-auto min-h-[44px] touch-manipulation"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
