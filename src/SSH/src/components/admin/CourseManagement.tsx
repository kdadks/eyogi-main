import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Course, Gurukul } from '@/types'
import { getCourses, updateCourse, deleteCourse } from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getAllUsers } from '@/lib/api/users'
import { formatCurrency, getAgeGroupLabel, getLevelColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface CourseFormData {
  gurukul_id: string
  course_number: string
  title: string
  slug?: string
  description: string
  detailed_description?: string
  level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
  age_group_min: number
  age_group_max: number
  duration_weeks: number
  duration_hours?: number
  price: number
  currency: string
  max_students: number
  min_students?: number
  delivery_method: 'physical' | 'remote' | 'hybrid'
  prerequisites?: string
  prerequisite_courses?: string[]
  prerequisite_skills?: string[]
  prerequisite_level?: 'elementary' | 'basic' | 'intermediate' | 'advanced'
  learning_outcomes: string[]
  includes_certificate?: boolean
  certificate_template_id?: string
  image_url?: string
  cover_image_url?: string
  video_preview_url?: string
  syllabus?: object | null
  resources?: Array<{ name: string; url: string; type: string }>
  is_active: boolean
  featured?: boolean
  tags?: string[]
  meta_title?: string
  meta_description?: string
  teacher_id?: string
}

const initialFormData: CourseFormData = {
  gurukul_id: '',
  course_number: '',
  title: '',
  description: '',
  level: 'basic',
  age_group_min: 8,
  age_group_max: 11,
  duration_weeks: 6,
  price: 50,
  currency: 'USD',
  max_students: 20,
  delivery_method: 'remote',
  learning_outcomes: [],
  is_active: true,
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGurukul, setFilterGurukul] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const filterCourses = useCallback(() => {
    let filtered = courses
    console.log('Filtering courses:', {
      totalCourses: courses.length,
      searchTerm,
      filterGurukul,
      filterLevel,
    })

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.course_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterGurukul) {
      filtered = filtered.filter((course) => course.gurukul_id === filterGurukul)
    }

    if (filterLevel) {
      filtered = filtered.filter((course) => course.level === filterLevel)
    }

    console.log('Filtered courses:', filtered.length)
    setFilteredCourses(filtered)
  }, [courses, searchTerm, filterGurukul, filterLevel])

  useEffect(() => {
    filterCourses()
  }, [filterCourses])

  const loadData = async () => {
    console.log('Starting to load data...')
    try {
      const [coursesData, gurukulData, usersData] = await Promise.all([
        getCourses(),
        getGurukuls(),
        getAllUsers(),
      ])
      console.log('Loaded data:', {
        courses: coursesData.length,
        gurukuls: gurukulData.length,
        users: usersData.length,
      })
      setCourses(coursesData)
      setGurukuls(gurukulData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const handleFeaturedToggle = async (course: Course) => {
    try {
      const updatedCourse = { ...course, featured: !course.featured }
      await updateCourse(course.id, updatedCourse)

      // Update local state
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updatedCourse : c)))

      toast.success(`Course ${updatedCourse.featured ? 'featured' : 'unfeatured'} successfully`)
    } catch (error: unknown) {
      console.error('Failed to toggle featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  const handleDelete = async (course: Course) => {
    if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
      try {
        await deleteCourse(course.id)
        toast.success('Course deleted successfully')
        await loadData()
      } catch (error) {
        console.error('Error deleting course:', error)
        toast.error('Failed to delete course')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading courses...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <Button disabled>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Course (Modal coming)
        </Button>
      </div>
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={filterGurukul}
          onChange={(e) => setFilterGurukul(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Gurukuls</option>
          {gurukuls.map((gurukul) => (
            <option key={gurukul.id} value={gurukul.id}>
              {gurukul.name}
            </option>
          ))}
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Levels</option>
          <option value="elementary">Elementary</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Course Grid */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Grid Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase">
          <div className="col-span-3">Course</div>
          <div className="col-span-1">Duration</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Featured</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Grid Rows */}
        <div className="divide-y divide-gray-100">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-gray-50 text-sm"
            >
              {/* Course Title & Number */}
              <div className="col-span-3">
                <div className="font-medium text-gray-900 text-sm truncate">{course.title}</div>
                <div className="text-xs text-gray-500">{course.course_number}</div>
              </div>

              {/* Duration */}
              <div className="col-span-1 text-xs text-gray-600">
                <div>{course.duration_weeks}w</div>
                {course.duration_hours && (
                  <div className="text-gray-400">{course.duration_hours}h</div>
                )}
              </div>

              {/* Age Group */}
              <div className="col-span-1 text-xs text-gray-600">
                {course.age_group_min}-{course.age_group_max}
              </div>

              {/* Price */}
              <div className="col-span-1 text-xs text-gray-600 font-medium">${course.price}</div>

              {/* Level */}
              <div className="col-span-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}
                >
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center gap-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Featured Toggle */}
              <div className="col-span-1">
                <button
                  onClick={() => handleFeaturedToggle(course)}
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    course.featured
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {course.featured ? 'Featured' : 'Feature'}
                </button>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1">
                <button
                  onClick={() => setViewingCourse(course)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="View"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => alert('Edit modal coming soon')}
                  disabled
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(course)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No courses found matching your criteria.
        </div>
      )}

      {/* Course View Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
                <button
                  onClick={() => setViewingCourse(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {viewingCourse.title}
                </div>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Number
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {viewingCourse.course_number}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(viewingCourse.level)}`}
                    >
                      {viewingCourse.level}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {viewingCourse.duration_weeks} weeks
                    {viewingCourse.duration_hours && ` (${viewingCourse.duration_hours} hours)`}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 font-medium">
                    {formatCurrency(viewingCourse.price)} {viewingCourse.currency}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {getAgeGroupLabel(viewingCourse.age_group_min, viewingCourse.age_group_max)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {viewingCourse.max_students}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {viewingCourse.delivery_method}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          viewingCourse.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {viewingCourse.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {viewingCourse.featured && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[80px]">
                  {viewingCourse.description}
                </div>
              </div>

              {/* Detailed Description */}
              {viewingCourse.detailed_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[80px]">
                    {viewingCourse.detailed_description}
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {viewingCourse.prerequisites && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prerequisites
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {viewingCourse.prerequisites}
                  </div>
                </div>
              )}

              {/* Learning Outcomes */}
              {viewingCourse.learning_outcomes && viewingCourse.learning_outcomes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Outcomes
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <ul className="space-y-2">
                      {viewingCourse.learning_outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-900">
                          <span className="text-blue-500 mt-1 text-sm">•</span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tags */}
              {viewingCourse.tags && viewingCourse.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {viewingCourse.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
