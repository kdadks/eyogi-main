import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Gurukul, Course } from '../types'
import { getGurukul } from '../lib/api/gurukuls'
import { getCourses } from '../lib/api/courses'
import { formatCurrency, getAgeGroupLabel, getLevelColor, generateCourseUrl } from '../lib/utils'
import {
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyEuroIcon,
  ArrowRightIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
export default function GurukulDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [gurukul, setGurukul] = useState<Gurukul | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const loadData = useCallback(async () => {
    try {
      const gurukulData = await getGurukul(slug!)
      if (gurukulData) {
        setGurukul(gurukulData)
        const coursesData = await getCourses({ gurukul_id: gurukulData.id })
        setCourses(coursesData)
      }
    } catch {
      // Error loading gurukul - silent fail
    } finally {
      setLoading(false)
    }
  }, [slug])
  useEffect(() => {
    if (slug) {
      loadData()
    }
  }, [slug, loadData])
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Gurukul...</p>
        </div>
      </div>
    )
  }
  if (!gurukul) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gurukul Not Found</h1>
          <p className="text-gray-600 mb-8">The Gurukul you're looking for doesn't exist.</p>
          <Link to="/gurukuls">
            <Button>Browse All Gurukuls</Button>
          </Link>
        </div>
      </div>
    )
  }
  const levelCounts = courses.reduce(
    (acc, course) => {
      acc[course.level] = (acc[course.level] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  return (
    <>
      <SEOHead
        title={gurukul ? `${gurukul.name} - Traditional Hindu Education Center` : 'Hindu Gurukul'}
        description={
          gurukul
            ? `${gurukul.description} Learn authentic Hindu traditions and Vedic wisdom through expert-led courses in our specialized ${gurukul.name}.`
            : 'Explore our Hindu Gurukul for traditional Vedic education.'
        }
        keywords={
          gurukul
            ? [
                `${gurukul.name} Online`,
                `${gurukul.name.replace(' Gurukul', '')} Education`,
                `Hindu ${gurukul.name.replace(' Gurukul', '')} Learning`,
                `Vedic ${gurukul.name.replace(' Gurukul', '')} Courses`,
                `Sanatan Dharma ${gurukul.name.replace(' Gurukul', '')}`,
                `Traditional ${gurukul.name.replace(' Gurukul', '')} Education`,
                `Authentic Hindu ${gurukul.name.replace(' Gurukul', '')}`,
                `${gurukul.name.replace(' Gurukul', '')} Online Classes`,
                'Hindu Gurukul Online',
                'Vedic Learning Center',
                'Traditional Hindu Education',
              ]
            : []
        }
        canonicalUrl={gurukul ? `/gurukuls/${gurukul.slug}` : '/gurukuls'}
        structuredData={
          gurukul
            ? [
                generateBreadcrumbSchema([
                  { name: 'Home', url: '/' },
                  { name: 'Hindu Gurukuls', url: '/gurukuls' },
                  { name: gurukul.name, url: `/gurukuls/${gurukul.slug}` },
                ]),
                {
                  '@context': 'https://schema.org',
                  '@type': 'EducationalOrganization',
                  name: gurukul.name,
                  description: gurukul.description,
                  url: `https://eyogi-gurukul.vercel.app/gurukuls/${gurukul.slug}`,
                  parentOrganization: {
                    '@type': 'EducationalOrganization',
                    name: 'eYogi Gurukul',
                    url: 'https://eyogi-gurukul.vercel.app',
                  },
                  hasOfferCatalog: {
                    '@type': 'OfferCatalog',
                    name: `${gurukul.name} Courses`,
                    itemListElement: courses.map((course) => ({
                      '@type': 'Course',
                      name: course.title,
                      courseCode: course.course_number,
                    })),
                  },
                  about: [
                    { '@type': 'Thing', name: 'Hindu Religion' },
                    { '@type': 'Thing', name: 'Vedic Philosophy' },
                    { '@type': 'Thing', name: 'Sanatan Dharma' },
                  ],
                },
              ]
            : []
        }
      />
      <div className="min-h-screen bg-gray-50 page-with-header">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-50 to-red-50">
          <div className="container-max section-padding">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Link to="/gurukuls" className="text-orange-600 hover:text-orange-700">
                    ← Back to Gurukuls
                  </Link>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    {gurukul.name}
                  </h1>
                  <div
                    className="text-xl text-gray-600 leading-relaxed mb-6"
                    dangerouslySetInnerHTML={{ __html: gurukul.description }}
                  />
                </div>
                <div className="flex items-center space-x-8 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <BookOpenIcon className="h-5 w-5 text-orange-500" />
                    <span>{courses.length} Courses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-orange-500" />
                    <span>All Levels</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-orange-500" />
                    <span>Expert Teachers</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to={`/courses?gurukul=${gurukul.id}`}>
                    <Button size="lg">
                      View All Courses
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button variant="outline" size="lg">
                      Start Learning
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={
                      gurukul.image_url ||
                      `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop`
                    }
                    alt={gurukul.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Stats Section */}
        <section className="section-padding bg-white">
          <div className="container-max">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{courses.length}</div>
                <div className="text-gray-600">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {levelCounts.elementary || 0}
                </div>
                <div className="text-gray-600">Elementary</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {levelCounts.basic || 0}
                </div>
                <div className="text-gray-600">Basic</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {levelCounts.intermediate + levelCounts.advanced || 0}
                </div>
                <div className="text-gray-600">Advanced</div>
              </div>
            </div>
          </div>
        </section>
        {/* Courses Section */}
        <section className="section-padding">
          <div className="container-max">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Available Courses
              </h2>
              <p className="text-xl text-gray-600">
                Explore our comprehensive curriculum designed for all learning levels
              </p>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                <p className="text-gray-600">Courses for this Gurukul are coming soon.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <Card key={course.id} className="card-hover overflow-hidden">
                    <div className="aspect-video bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-lg">
                            {course.course_number.slice(-2)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{course.course_number}</p>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
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
        </section>
        {/* CTA Section */}
        <section className="section-padding gradient-bg text-white">
          <div className="container-max text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of students worldwide in discovering the wisdom of{' '}
              {gurukul.name.toLowerCase()}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  Create Account
                </Button>
              </Link>
              <Link to={`/courses?gurukul=${gurukul.id}`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-orange-600"
                >
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
