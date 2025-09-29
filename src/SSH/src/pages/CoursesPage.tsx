import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import Footer from '../components/layout/Footer'
import RollingText from '../components/ui/RollingText'
import { Course, Gurukul } from '../types'
import { getCourses } from '../lib/api/courses'
import { getGurukuls } from '../lib/api/gurukuls'
import { formatCurrency, getAgeGroupLabel, getLevelColor, generateCourseUrl } from '../lib/utils'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline'
export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGurukul, setSelectedGurukul] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  useEffect(() => {
    loadData()
  }, [])
  const loadData = async () => {
    try {
      const [coursesData, gurukulData] = await Promise.all([getCourses(), getGurukuls()])
      setCourses(coursesData)
      setGurukuls(gurukulData)
    } catch {
      // Error loading data - silent fail
    } finally {
      setLoading(false)
    }
  }
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGurukul = !selectedGurukul || course.gurukul_id === selectedGurukul
    const matchesLevel = !selectedLevel || course.level === selectedLevel
    const matchesAge =
      !ageGroup ||
      (course.age_group_min <= parseInt(ageGroup) && course.age_group_max >= parseInt(ageGroup))
    return matchesSearch && matchesGurukul && matchesLevel && matchesAge
  })
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
        {/* Rolling Text Banner */}
        <RollingText text="🕉️ Discover Ancient Hindu Wisdom Through Expert-Led Online Courses 🕉️" />
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm">
            <div className="container-max section-padding">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Courses</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Discover comprehensive courses in Vedic wisdom, designed for learners of all ages.
                  From ancient philosophy to practical applications in modern life.
                </p>
              </div>
              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedGurukul}
                    onChange={(e) => setSelectedGurukul(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredCourses.length} of {courses.length} courses
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedGurukul('')
                      setSelectedLevel('')
                      setAgeGroup('')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Courses Grid */}
          <div className="container-max section-padding">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more courses.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="card-hover overflow-hidden">
                    <div className="aspect-video bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-lg">
                            {course.course_number.slice(-2)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{course.gurukul?.name}</p>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                        <span className="text-sm text-gray-500">{course.course_number}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
                      <div
                        className="text-gray-600 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                      />
                      <div className="space-y-2 mb-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          <span>
                            Ages {getAgeGroupLabel(course.age_group_min, course.age_group_max)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span>{course.duration_weeks} weeks</span>
                        </div>
                        <div className="flex items-center">
                          <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                          <span>{formatCurrency(course.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {course.delivery_method === 'remote' && '🌐 Online'}
                          {course.delivery_method === 'physical' && '🏫 In-person'}
                          {course.delivery_method === 'hybrid' && '🔄 Hybrid'}
                        </div>
                        <Link to={generateCourseUrl(course)}>
                          <Button size="sm">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
