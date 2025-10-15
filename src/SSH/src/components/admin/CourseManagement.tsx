import React, { useState, useEffect, useCallback } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Course, Gurukul, Syllabus } from '@/types'
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { formatCurrency, getAgeGroupLabel, getLevelColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { sanitizeHtml } from '@/utils/sanitize'
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
  syllabus: Syllabus | null
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
  slug: '',
  description: '',
  level: 'basic',
  age_group_min: 8,
  age_group_max: 11,
  duration_weeks: 6,
  price: 50,
  currency: 'EUR',
  max_students: 20,
  delivery_method: 'remote',
  learning_outcomes: [],
  is_active: true,
  syllabus: null,
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CourseFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  useEffect(() => {
    loadData()
  }, [])
  const filterCourses = useCallback(() => {
    let filtered = courses

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
    setFilteredCourses(filtered)
  }, [courses, searchTerm, filterGurukul, filterLevel])
  useEffect(() => {
    filterCourses()
  }, [filterCourses])
  const loadData = async () => {
    try {
      const [coursesData, gurukulData] = await Promise.all([getCourses(), getGurukuls()])

      setCourses(coursesData)
      setGurukuls(gurukulData)
    } catch {
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
    } catch {
      toast.error('Failed to update featured status')
    }
  }
  const handleDelete = async (course: Course) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.title}"?`,
      onConfirm: async () => {
        try {
          await deleteCourse(course.id)
          toast.success('Course deleted successfully')
          await loadData()
        } catch {
          toast.error('Failed to delete course')
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }
  const handleCreateCourse = async () => {
    if (!formData.title || !formData.gurukul_id || !formData.course_number) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const courseData = {
        // Only include fields that exist in the database schema
        gurukul_id: formData.gurukul_id,
        course_number: formData.course_number,
        title: formData.title,
        slug:
          formData.slug ||
          formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        description: formData.description || '',
        detailed_description: formData.detailed_description || undefined,
        level: formData.level,
        age_group_min: formData.age_group_min || 5,
        age_group_max: formData.age_group_max || 18,
        duration_weeks: formData.duration_weeks || 1,
        duration_hours: formData.duration_hours || undefined,
        delivery_method: formData.delivery_method,
        price: formData.price || 0,
        currency: formData.currency || 'EUR',
        max_students: formData.max_students || 1,
        min_students: formData.min_students || undefined,
        prerequisites: formData.prerequisites || undefined,
        learning_outcomes: formData.learning_outcomes.filter((outcome) => outcome.trim() !== ''),
        includes_certificate: formData.includes_certificate || false,
        certificate_template_id: formData.certificate_template_id || undefined,
        image_url: formData.image_url || undefined,
        cover_image_url: formData.cover_image_url || undefined,
        video_preview_url: formData.video_preview_url || undefined,
        syllabus: formData.syllabus,
        resources: formData.resources || undefined,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        featured: formData.featured || false,
        tags: formData.tags || undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        teacher_id: formData.teacher_id || undefined,
      }
      await createCourse(courseData)
      toast.success('Course created successfully')
      setShowCreateModal(false)
      setFormData(initialFormData)
      await loadData()
    } catch (error) {
      toast.error(
        'Failed to create course: ' + (error instanceof Error ? error.message : 'Unknown error'),
      )
    } finally {
      setSaving(false)
    }
  }
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      gurukul_id: course.gurukul_id,
      course_number: course.course_number,
      title: course.title,
      slug: course.slug,
      description: course.description,
      detailed_description: course.detailed_description || '',
      level: course.level,
      age_group_min: course.age_group_min,
      age_group_max: course.age_group_max,
      duration_weeks: course.duration_weeks,
      duration_hours: course.duration_hours || undefined,
      price: course.price,
      currency: course.currency,
      max_students: course.max_students,
      min_students: course.min_students || undefined,
      delivery_method: course.delivery_method,
      prerequisites: course.prerequisites || '',
      prerequisite_courses: course.prerequisite_courses || [],
      prerequisite_skills: course.prerequisite_skills || [],
      learning_outcomes: course.learning_outcomes || [],
      includes_certificate: course.includes_certificate || false,
      certificate_template_id: course.certificate_template_id || '',
      image_url: course.image_url || '',
      cover_image_url: course.cover_image_url || '',
      video_preview_url: course.video_preview_url || '',
      syllabus: course.syllabus,
      resources: course.resources || [],
      is_active: course.is_active,
      featured: course.featured || false,
      tags: course.tags || [],
      meta_title: course.meta_title || '',
      meta_description: course.meta_description || '',
      teacher_id: course.teacher_id || '',
    })
    setShowEditModal(true)
  }
  const handleUpdateCourse = async () => {
    if (!editingCourse) return
    setSaving(true)
    try {
      const updates = {
        gurukul_id: formData.gurukul_id,
        course_number: formData.course_number,
        title: formData.title,
        slug:
          formData.slug ||
          formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        description: formData.description || '',
        detailed_description: formData.detailed_description || undefined,
        level: formData.level,
        age_group_min: formData.age_group_min || 5,
        age_group_max: formData.age_group_max || 18,
        duration_weeks: formData.duration_weeks || 1,
        duration_hours: formData.duration_hours || undefined,
        delivery_method: formData.delivery_method,
        price: formData.price || 0,
        currency: formData.currency || 'EUR',
        max_students: formData.max_students || 1,
        min_students: formData.min_students || undefined,
        prerequisites: formData.prerequisites || undefined,
        learning_outcomes: formData.learning_outcomes.filter((outcome) => outcome.trim() !== ''),
        includes_certificate: formData.includes_certificate || false,
        certificate_template_id: formData.certificate_template_id || undefined,
        image_url: formData.image_url || undefined,
        cover_image_url: formData.cover_image_url || undefined,
        video_preview_url: formData.video_preview_url || undefined,
        syllabus: formData.syllabus,
        resources: formData.resources || undefined,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        featured: formData.featured || false,
        tags: formData.tags || undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        teacher_id: formData.teacher_id || undefined,
      }
      await updateCourse(editingCourse.id, updates)
      toast.success('Course updated successfully')
      setShowEditModal(false)
      setEditingCourse(null)
      setFormData(initialFormData)
      await loadData()
    } catch {
      toast.error('Failed to update course')
    } finally {
      setSaving(false)
    }
  }
  const closeModal = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingCourse(null)
    setFormData(initialFormData)
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
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Course
        </Button>
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
              <div className="col-span-1 text-xs text-gray-600 font-medium">
                {formatCurrency(course.price)}
              </div>
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
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setViewingCourse(course)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                  title="View"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditCourse(course)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(course)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
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
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewingCourse.description) }} />
                </div>
              </div>
              {/* Detailed Description */}
              {viewingCourse.detailed_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[80px]">
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewingCourse.detailed_description) }} />
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
                          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(outcome) }} />
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
      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Course</h2>
                <button
                  onClick={closeModal}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gurukul *</label>
                  <select
                    value={formData.gurukul_id}
                    onChange={(e) => setFormData({ ...formData, gurukul_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a gurukul</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Number *
                  </label>
                  <Input
                    value={formData.course_number}
                    onChange={(e) => setFormData({ ...formData, course_number: e.target.value })}
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Course title"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <ReactQuill
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Course description"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value as CourseFormData['level'] })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="elementary">Elementary</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={formData.delivery_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delivery_method: e.target.value as CourseFormData['delivery_method'],
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="remote">Remote</option>
                    <option value="physical">Physical</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Min</label>
                  <Input
                    type="number"
                    value={formData.age_group_min}
                    onChange={(e) =>
                      setFormData({ ...formData, age_group_min: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Max</label>
                  <Input
                    type="number"
                    value={formData.age_group_max}
                    onChange={(e) =>
                      setFormData({ ...formData, age_group_max: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (weeks)
                  </label>
                  <Input
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <Input
                    type="number"
                    value={formData.duration_hours || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_hours: parseInt(e.target.value) || undefined,
                      })
                    }
                    min="1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="EUR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <Input
                    type="number"
                    value={formData.max_students}
                    onChange={(e) =>
                      setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Students
                  </label>
                  <Input
                    type="number"
                    value={formData.min_students || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_students: parseInt(e.target.value) || undefined,
                      })
                    }
                    min="1"
                    placeholder="Optional"
                  />
                </div>
              </div>
              {/* Learning Outcomes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Outcomes
                </label>
                <ReactQuill
                  value={formData.learning_outcomes.join('\n')}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      learning_outcomes: value.split('\n').filter((line) => line.trim() !== ''),
                    })
                  }
                  placeholder="Enter each outcome on a new line"
                  className="bg-white"
                />
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="danger" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>
                <button
                  onClick={closeModal}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gurukul *</label>
                  <select
                    value={formData.gurukul_id}
                    onChange={(e) => setFormData({ ...formData, gurukul_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a gurukul</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Number *
                  </label>
                  <Input
                    value={formData.course_number}
                    onChange={(e) => setFormData({ ...formData, course_number: e.target.value })}
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Course title"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <ReactQuill
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Course description"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value as CourseFormData['level'] })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="elementary">Elementary</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={formData.delivery_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delivery_method: e.target.value as CourseFormData['delivery_method'],
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="remote">Remote</option>
                    <option value="physical">Physical</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Min</label>
                  <Input
                    type="number"
                    value={formData.age_group_min}
                    onChange={(e) =>
                      setFormData({ ...formData, age_group_min: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Max</label>
                  <Input
                    type="number"
                    value={formData.age_group_max}
                    onChange={(e) =>
                      setFormData({ ...formData, age_group_max: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (weeks)
                  </label>
                  <Input
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <Input
                    type="number"
                    value={formData.duration_hours || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_hours: parseInt(e.target.value) || undefined,
                      })
                    }
                    min="1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="EUR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <Input
                    type="number"
                    value={formData.max_students}
                    onChange={(e) =>
                      setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Students
                  </label>
                  <Input
                    type="number"
                    value={formData.min_students || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_students: parseInt(e.target.value) || undefined,
                      })
                    }
                    min="1"
                    placeholder="Optional"
                  />
                </div>
                <div className="md:col-span-2 flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Active
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured || false}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="mr-2"
                    />
                    Featured
                  </label>
                </div>
              </div>
              {/* Learning Outcomes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Outcomes
                </label>
                <ReactQuill
                  value={formData.learning_outcomes.join('\n')}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      learning_outcomes: value.split('\n').filter((line) => line.trim() !== ''),
                    })
                  }
                  placeholder="Enter each outcome on a new line"
                  className="bg-white"
                />
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="danger" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCourse} disabled={saving}>
                  {saving ? 'Updating...' : 'Update Course'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  )
}
