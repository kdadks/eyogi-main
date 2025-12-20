import React, { useState, useEffect, useCallback } from 'react'
import { SafeReactQuill } from '../ui/SafeReactQuill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Course, Gurukul, Syllabus } from '@/types'
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  checkSlugExists,
} from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { formatCurrency, getAgeGroupLabel, getLevelColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { sanitizeHtml } from '@/utils/sanitize'
import MediaSelectorButton from '@/components/MediaSelectorButton'
import CourseImageSelector from '@/components/CourseImageSelector'
import type { MediaFile } from '@/types/media'

/**
 * Generate a slug from text
 */
function generateSlug(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Parse HTML content from ReactQuill to extract learning outcomes
 * Handles both HTML lists and plain text input
 */
function parseHtmlToOutcomes(htmlContent: string): string[] {
  try {
    if (!htmlContent || htmlContent.trim() === '') return []

    // If content contains HTML list tags, parse them
    if (
      htmlContent.includes('<ul>') ||
      htmlContent.includes('<ol>') ||
      htmlContent.includes('<li>')
    ) {
      try {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = sanitizeHtml(htmlContent)

        const listItems = tempDiv.querySelectorAll('li')
        if (listItems.length > 0) {
          return Array.from(listItems)
            .map((li) => li.textContent?.trim())
            .filter((text): text is string => !!text)
        }
      } catch (error) {
        console.error('Error parsing HTML list:', error)
        // Fall through to plain text parsing
      }
    }

    // Fall back to splitting by newlines for plain text
    return htmlContent
      .split('\n')
      .map((line) => line.replace(/<[^>]*>/g, '').trim()) // Strip any HTML tags
      .filter((line) => line !== '')
  } catch (error) {
    console.error('Error in parseHtmlToOutcomes:', error)
    return []
  }
}

/**
 * Convert learning outcomes array to HTML for ReactQuill display
 * Optimized to prevent UI hanging when loading complex HTML content
 */
/**
 * Convert learning outcomes array to HTML for ReactQuill display
 * Recreates the bulleted list format that was originally used
 */
function outcomesToHtml(outcomes: string[]): string {
  // Safety checks
  if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
    return ''
  }

  try {
    // Filter out empty outcomes
    const validOutcomes = outcomes.filter((outcome) => {
      if (!outcome || typeof outcome !== 'string') return false
      const cleanText = outcome.replace(/<[^>]*>/g, '').trim()
      return cleanText.length > 0
    })

    if (validOutcomes.length === 0) {
      return ''
    }

    // Create a bulleted list (unordered list) with the outcomes
    const listItems = validOutcomes
      .map((outcome) => {
        // Strip any HTML tags that might be in the outcome string
        const cleanText = outcome.replace(/<[^>]*>/g, '').trim()
        return `<li>${sanitizeHtml(cleanText)}</li>`
      })
      .join('')

    const result = `<ul>${listItems}</ul>`
    return result
  } catch (error) {
    console.error('🔴 outcomesToHtml - FATAL ERROR:', error)
    return ''
  }
}

/**
 * Parse learning outcomes for display - extracts list items from HTML
 * Optimized to prevent UI hanging on large or complex HTML content
 */
function parseLearningOutcomesForDisplay(
  outcomes: string[],
): Array<{ content: string; isHtml: boolean }> {
  // Safety check
  if (!outcomes || !Array.isArray(outcomes)) {
    return []
  }

  const parsedOutcomes: Array<{ content: string; isHtml: boolean }> = []
  const MAX_OUTCOMES = 100 // Limit to prevent excessive processing

  // Limit processing to prevent hanging
  const outcomesToProcess = outcomes.slice(0, MAX_OUTCOMES)

  outcomesToProcess.forEach((outcome) => {
    try {
      // Safety check for outcome
      if (!outcome || typeof outcome !== 'string') {
        return
      }

      const trimmed = outcome.trim()
      if (!trimmed) return

      // Check if outcome contains HTML tags
      if (
        trimmed.includes('<ul>') ||
        trimmed.includes('<ol>') ||
        trimmed.includes('<li>') ||
        trimmed.includes('<p>') ||
        trimmed.includes('<h') ||
        trimmed.includes('<strong>') ||
        trimmed.includes('<em>') ||
        trimmed.includes('<br>')
      ) {
        // It's HTML content, keep it as-is
        parsedOutcomes.push({ content: trimmed, isHtml: true })
      } else {
        // It's plain text
        parsedOutcomes.push({ content: trimmed, isHtml: false })
      }
    } catch {
      // Skip problematic outcomes
      return
    }
  })

  return parsedOutcomes
}

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
  part?: string // Optional part identifier (A, B, C, D, etc.)
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
  part: '',
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
  const [learningOutcomesEditorValue, setLearningOutcomesEditorValue] = useState('')
  const [prerequisitesEditorValue, setPrerequisitesEditorValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [slugError, setSlugError] = useState<string>('')

  // State for Syllabus Modules (matching database structure)
  const [syllabusModules, setSyllabusModules] = useState<
    Array<{
      title: string
      sessions: number
    }>
  >([])

  // State for Resources (matching database structure with 'title' field)
  const [resources, setResources] = useState<
    Array<{
      title: string
      url: string
      type: string
    }>
  >([])

  // State for Tags (array of strings)
  const [tags, setTags] = useState<string[]>([])
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

  // Validate slug for uniqueness
  useEffect(() => {
    const validateSlug = async () => {
      if (!formData.slug) {
        setSlugError('')
        return
      }

      const isDuplicate = await checkSlugExists(formData.slug, editingCourse?.id)
      setSlugError(isDuplicate ? 'This slug is already in use. Please choose a different one.' : '')
    }

    // Debounce slug validation
    const timer = setTimeout(validateSlug, 500)
    return () => clearTimeout(timer)
  }, [formData.slug, editingCourse?.id])

  // Sync editor value when modals open/close
  useEffect(() => {
    if (showEditModal || showCreateModal) {
      const htmlValue = outcomesToHtml(formData.learning_outcomes)
      setLearningOutcomesEditorValue(htmlValue)
      // Set prerequisites as plain HTML (not parsed into array)
      // Ensure we always pass a string, never null/undefined
      const prereqValue = formData.prerequisites || ''
      console.log('Setting prerequisites editor value:', prereqValue)
      setPrerequisitesEditorValue(typeof prereqValue === 'string' ? prereqValue : '')

      // Sync syllabus modules
      if (formData.syllabus?.modules) {
        setSyllabusModules(formData.syllabus.modules)
      } else if (formData.syllabus?.classes) {
        // Backward compatibility: convert classes to modules
        setSyllabusModules(
          formData.syllabus.classes.map((cls: any) => ({
            title: `Class ${cls.number}: ${cls.title}`,
            sessions: cls.duration ? 1 : 0,
          })),
        )
      } else {
        setSyllabusModules([])
      }

      // Sync resources
      if (formData.resources) {
        setResources(formData.resources)
      } else {
        setResources([])
      }

      // Sync tags
      if (formData.tags && Array.isArray(formData.tags)) {
        setTags(formData.tags)
      } else {
        setTags([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditModal, showCreateModal])

  // Handle learning outcomes change - update both editor value and formData
  const handleLearningOutcomesChange = useCallback((value: string) => {
    try {
      setLearningOutcomesEditorValue(value)
      const newOutcomes = parseHtmlToOutcomes(value)
      setFormData((prevFormData) => ({
        ...prevFormData,
        learning_outcomes: newOutcomes,
      }))
    } catch (error) {
      console.error('Error in handleLearningOutcomesChange:', error)
      // Keep the editor value but don't update formData to prevent cascading errors
      setLearningOutcomesEditorValue(value)
    }
  }, [])

  // Handle prerequisites change - update both editor value and formData
  const handlePrerequisitesChange = useCallback((value: string) => {
    try {
      setPrerequisitesEditorValue(value)
      setFormData((prevFormData) => ({
        ...prevFormData,
        prerequisites: value,
      }))
    } catch (error) {
      console.error('Error in handlePrerequisitesChange:', error)
      // Keep the editor value but don't update formData to prevent cascading errors
      setPrerequisitesEditorValue(value)
    }
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
      setLoading(true)
      const [coursesResult, gurukulsResult] = await Promise.all([getCourses(), getGurukuls()])

      setCourses(coursesResult.courses)
      setGurukuls(gurukulsResult.gurukuls)
    } catch (error) {
      console.error('Failed to load course data:', error)
      toast.error('Failed to load course data')
      // Set empty arrays to prevent UI from hanging
      setCourses([])
      setGurukuls([])
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
    if (!formData.title || !formData.gurukul_id) {
      toast.error('Please fill in all required fields')
      return
    }
    console.log('Creating course with formData:', formData)
    setSaving(true)
    try {
      const courseData = {
        // Only include fields that exist in the database schema
        gurukul_id: formData.gurukul_id,
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
        prerequisites:
          formData.prerequisites && formData.prerequisites.trim() !== ''
            ? [formData.prerequisites]
            : undefined,
        learning_outcomes: formData.learning_outcomes.filter((outcome) => outcome.trim() !== ''),
        includes_certificate: formData.includes_certificate || false,
        certificate_template_id: formData.certificate_template_id || undefined,
        cover_image_url:
          formData.cover_image_url === null ? null : formData.cover_image_url || undefined,
        video_preview_url:
          formData.video_preview_url === null ? null : formData.video_preview_url || undefined,
        syllabus: syllabusModules.length > 0 ? { modules: syllabusModules } : null,
        resources: resources.length > 0 ? resources : undefined,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        featured: formData.featured || false,
        tags: tags.length > 0 ? tags.filter((t) => t.trim() !== '') : undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        teacher_id: formData.teacher_id || undefined,
        part: formData.part || undefined,
      }
      await createCourse(courseData)
      toast.success('Course created successfully')
      setShowCreateModal(false)
      setFormData(initialFormData)
      setLearningOutcomesEditorValue('')
      setPrerequisitesEditorValue('')
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
    try {
      setEditingCourse(course)

      // Handle prerequisites - convert array to string or use as is if already string
      let prerequisitesValue = ''
      if (course.prerequisites) {
        if (Array.isArray(course.prerequisites)) {
          // Convert array to HTML list
          prerequisitesValue =
            course.prerequisites.length > 0
              ? `<ul>${course.prerequisites.map((p) => `<li>${p}</li>`).join('')}</ul>`
              : ''
        } else if (typeof course.prerequisites === 'string') {
          prerequisitesValue = course.prerequisites
        }
      }

      const formDataToSet = {
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
        prerequisites: prerequisitesValue,
        prerequisite_courses: course.prerequisite_courses || [],
        prerequisite_skills: course.prerequisite_skills || [],
        learning_outcomes: course.learning_outcomes || [],
        includes_certificate: course.includes_certificate || false,
        certificate_template_id: course.certificate_template_id || '',
        cover_image_url: course.cover_image_url || '',
        video_preview_url: course.video_preview_url || '',
        syllabus: course.syllabus,
        resources: course.resources || [],
        is_active: course.is_active,
        featured: course.featured || false,
        tags: course.tags || [],
        meta_title: course.meta_title || '',
        meta_description: course.meta_description || '',
        // Note: teacher_id removed - use course_assignments
      }

      setFormData(formDataToSet)

      setShowEditModal(true)
    } catch (error) {
      console.error('handleEditCourse - ERROR:', error)
    }
  }
  const handleUpdateCourse = async () => {
    if (!editingCourse) return
    console.log('Updating course with formData:', formData)
    setSaving(true)
    try {
      const updates = {
        gurukul_id: formData.gurukul_id,
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
        prerequisites:
          formData.prerequisites && formData.prerequisites.trim() !== ''
            ? [formData.prerequisites]
            : undefined,
        learning_outcomes: formData.learning_outcomes.filter((outcome) => outcome.trim() !== ''),
        includes_certificate: formData.includes_certificate || false,
        certificate_template_id: formData.certificate_template_id || undefined,
        cover_image_url:
          formData.cover_image_url === null ? null : formData.cover_image_url || undefined,
        video_preview_url:
          formData.video_preview_url === null ? null : formData.video_preview_url || undefined,
        syllabus: syllabusModules.length > 0 ? { modules: syllabusModules } : null,
        resources: resources.length > 0 ? resources : undefined,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        featured: formData.featured || false,
        tags: tags.length > 0 ? tags.filter((t) => t.trim() !== '') : undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        teacher_id: formData.teacher_id || undefined,
        part: formData.part || undefined,
      }
      await updateCourse(editingCourse.id, updates)
      toast.success('Course updated successfully')
      setShowEditModal(false)
      setEditingCourse(null)
      setFormData(initialFormData)
      setLearningOutcomesEditorValue('')
      setPrerequisitesEditorValue('')
      await loadData()
    } catch (error) {
      console.error('Failed to update course:', error)
      toast.error(
        'Failed to update course: ' + (error instanceof Error ? error.message : 'Unknown error'),
      )
    } finally {
      setSaving(false)
    }
  }
  const closeModal = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingCourse(null)
    setFormData(initialFormData)
    setLearningOutcomesEditorValue('')
    setPrerequisitesEditorValue('')
    setSyllabusModules([])
    setResources([])
    setTags([])
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
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getLevelColor(course.level)}`}
                >
                  {course.level
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')}
                </span>
              </div>
              {/* Status */}
              <div className="col-span-2 flex items-center gap-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
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
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded transition-colors ${
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
                  onClick={() => {
                    console.log('Course data:', course)
                    console.log('Syllabus:', course.syllabus)
                    console.log('Syllabus type:', typeof course.syllabus)
                    setViewingCourse(course)
                  }}
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
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-300">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Course Details</h2>
                <button
                  onClick={() => setViewingCourse(null)}
                  className="p-1 text-white/80 hover:text-white rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Course Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Course Title
                </label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                  {viewingCourse.title}
                </div>
              </div>
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Gurukul</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {gurukuls.find((g) => g.id === viewingCourse.gurukul_id)?.name || 'N/A'}
                  </div>
                </div>
                {viewingCourse.part && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Part</label>
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                      {viewingCourse.part}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Course Number
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {viewingCourse.course_number}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Slug</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 font-mono">
                    {viewingCourse.slug}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Level</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelColor(viewingCourse.level)}`}
                    >
                      {viewingCourse.level.charAt(0).toUpperCase() +
                        viewingCourse.level.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Duration</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {viewingCourse.duration_weeks} weeks
                    {viewingCourse.duration_hours && ` (${viewingCourse.duration_hours} hours)`}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Price</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 font-medium">
                    {formatCurrency(viewingCourse.price)} {viewingCourse.currency}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Age Group
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {getAgeGroupLabel(viewingCourse.age_group_min, viewingCourse.age_group_max)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Max Students
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {viewingCourse.max_students}
                  </div>
                </div>
                {viewingCourse.min_students && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Min Students
                    </label>
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                      {viewingCourse.min_students}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Delivery Method
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {viewingCourse.delivery_method}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Certificate
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    {viewingCourse.includes_certificate ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          viewingCourse.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {viewingCourse.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {viewingCourse.featured && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Description
                </label>
                <div
                  className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900
                  [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul_li]:mb-0.5
                  [&_ol]:list-decimal [&_ol]:ml-5 [&_ol_li]:mb-0.5
                  [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_u]:underline
                  [&_a]:text-orange-600 [&_a]:hover:text-orange-700
                  [&_.ql-indent-1]:ml-6 [&_.ql-indent-2]:ml-12 [&_.ql-indent-3]:ml-18
                  [&_li_ul]:ml-5 [&_li_ol]:ml-5"
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewingCourse.description) }}
                  />
                </div>
              </div>
              {/* Detailed Description */}
              {viewingCourse.detailed_description && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Detailed Description
                  </label>
                  <div
                    className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900
                    [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul_li]:mb-0.5
                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol_li]:mb-0.5
                    [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_u]:underline
                    [&_a]:text-orange-600 [&_a]:hover:text-orange-700
                    [&_.ql-indent-1]:ml-6 [&_.ql-indent-2]:ml-12 [&_.ql-indent-3]:ml-18
                    [&_li_ul]:ml-5 [&_li_ol]:ml-5"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(viewingCourse.detailed_description),
                      }}
                    />
                  </div>
                </div>
              )}
              {/* Prerequisites */}
              {viewingCourse.prerequisites &&
                ((Array.isArray(viewingCourse.prerequisites) &&
                  viewingCourse.prerequisites.length > 0) ||
                  (!Array.isArray(viewingCourse.prerequisites) && viewingCourse.prerequisites)) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Prerequisites
                    </label>
                    <div
                      className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900
                    [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul_li]:mb-0.5
                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol_li]:mb-0.5
                    [&_li]:mb-0.5 [&_li_p]:mb-0 [&_li_p]:inline [&_strong]:font-bold [&_em]:italic [&_u]:underline
                    [&_a]:text-orange-600 [&_a]:hover:text-orange-700
                    [&_.ql-indent-1]:ml-6 [&_.ql-indent-2]:ml-12 [&_.ql-indent-3]:ml-18
                    [&_li_ul]:ml-5 [&_li_ol]:ml-5"
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(
                            Array.isArray(viewingCourse.prerequisites)
                              ? viewingCourse.prerequisites[0] || ''
                              : String(viewingCourse.prerequisites || ''),
                          ),
                        }}
                      />
                    </div>
                  </div>
                )}
              {/* Learning Outcomes */}
              {viewingCourse.learning_outcomes && viewingCourse.learning_outcomes.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Learning Outcomes
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                    {(() => {
                      try {
                        const parsedOutcomes = parseLearningOutcomesForDisplay(
                          viewingCourse.learning_outcomes,
                        )
                        if (parsedOutcomes.length === 0) {
                          return (
                            <p className="text-xs text-gray-500 italic">
                              No learning outcomes available
                            </p>
                          )
                        }
                        return (
                          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                            {parsedOutcomes.map((item, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-900 mb-1"
                                style={{ display: 'list-item', listStylePosition: 'outside' }}
                              >
                                {item.isHtml ? (
                                  <div
                                    className="inline text-sm
                                      [&_p]:mb-0 [&_p]:inline [&_ul]:list-disc [&_ul]:ml-4 [&_ul_li]:mb-0.5
                                      [&_ol]:list-decimal [&_ol]:ml-4 [&_ol_li]:mb-0.5 [&_li_p]:mb-0 [&_li_p]:inline
                                      [&_strong]:font-bold [&_em]:italic [&_u]:underline"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHtml(item.content),
                                    }}
                                  />
                                ) : (
                                  item.content
                                )}
                              </li>
                            ))}
                          </ul>
                        )
                      } catch (error) {
                        console.error('Failed to render learning outcomes:', error)
                        return (
                          <p className="text-xs text-red-500 italic">
                            Error loading learning outcomes
                          </p>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}
              {/* Tags */}
              {viewingCourse.tags && viewingCourse.tags.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Tags</label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex flex-wrap gap-1">
                      {viewingCourse.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Media Section */}
              {(viewingCourse.image_url ||
                viewingCourse.cover_image_url ||
                viewingCourse.video_preview_url) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Media</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {viewingCourse.image_url && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">
                          Course Image
                        </label>
                        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded">
                          <img
                            src={viewingCourse.image_url}
                            alt="Course"
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      </div>
                    )}
                    {viewingCourse.cover_image_url && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">
                          Cover Image
                        </label>
                        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded">
                          <img
                            src={viewingCourse.cover_image_url}
                            alt="Cover"
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      </div>
                    )}
                    {viewingCourse.video_preview_url && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">
                          Video Preview
                        </label>
                        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded">
                          <video
                            src={viewingCourse.video_preview_url}
                            controls
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Syllabus */}
              {viewingCourse.syllabus &&
                (viewingCourse.syllabus.classes || viewingCourse.syllabus.modules) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Syllabus
                    </label>
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                      {viewingCourse.syllabus.modules &&
                      viewingCourse.syllabus.modules.length > 0 ? (
                        <div className="space-y-2">
                          {viewingCourse.syllabus.modules.map((module: any, index: number) => (
                            <div
                              key={index}
                              className="border-b border-gray-200 pb-2 last:border-0"
                            >
                              <div className="font-medium">{module.title}</div>
                              {module.sessions && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Sessions: {module.sessions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : viewingCourse.syllabus.classes &&
                        viewingCourse.syllabus.classes.length > 0 ? (
                        <div className="space-y-2">
                          {viewingCourse.syllabus.classes.map((cls: any, index: number) => (
                            <div
                              key={index}
                              className="border-b border-gray-200 pb-2 last:border-0"
                            >
                              <div className="font-medium">
                                Class {cls.number}: {cls.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Duration: {cls.duration}
                              </div>
                              {cls.topics && cls.topics.length > 0 && (
                                <ul className="list-disc list-inside text-xs text-gray-700 mt-1">
                                  {cls.topics.map((topic: string, idx: number) => (
                                    <li key={idx}>{topic}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              {/* Resources */}
              {viewingCourse.resources && viewingCourse.resources.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Resources
                  </label>
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                    <ul className="space-y-1">
                      {viewingCourse.resources.map((resource: any, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-600">•</span>
                          <div className="flex-1">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {resource.title || resource.name || resource.url}
                            </a>
                            {resource.type && (
                              <span className="ml-2 text-xs text-gray-500">({resource.type})</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {/* SEO Meta Fields */}
              {(viewingCourse.meta_title || viewingCourse.meta_description) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    SEO Metadata
                  </label>
                  <div className="space-y-2">
                    {viewingCourse.meta_title && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">
                          Meta Title
                        </label>
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                          {viewingCourse.meta_title}
                        </div>
                      </div>
                    )}
                    {viewingCourse.meta_description && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-0.5">
                          Meta Description
                        </label>
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900">
                          {viewingCourse.meta_description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-300">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Create New Course</h2>
                <button onClick={closeModal} className="p-1 text-white/80 hover:text-white rounded">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Basic Information Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Gurukul *
                    </label>
                    <select
                      value={formData.gurukul_id}
                      onChange={(e) => setFormData({ ...formData, gurukul_id: e.target.value })}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Part
                      <span className="text-xs text-gray-500 ml-1">(A, B, C...)</span>
                    </label>
                    <Input
                      value={formData.part || ''}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().slice(0, 1)
                        setFormData({ ...formData, part: value })
                      }}
                      placeholder="A, B, C..."
                      maxLength={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Course number will be auto-generated:
                      {formData.gurukul_id &&
                      formData.title &&
                      gurukuls.find((g) => g.id === formData.gurukul_id) ? (
                        <span className="font-semibold ml-1">
                          {gurukuls
                            .find((g) => g.id === formData.gurukul_id)
                            ?.name.replace(/[^a-zA-Z]/g, '')
                            .substring(0, 2)
                            .toUpperCase()}
                          {formData.title
                            .replace(/[^a-zA-Z]/g, '')
                            .charAt(0)
                            .toUpperCase()}
                          #{formData.part || ''}
                        </span>
                      ) : (
                        ' [Select gurukul and enter title]'
                      )}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Course title"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Slug <span className="text-xs text-gray-500">(auto-generated)</span>
                    </label>
                    <Input
                      value={!formData.slug ? generateSlug(formData.title) : formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="course-title"
                      readOnly={!formData.title}
                      className={!formData.title ? 'bg-gray-100 cursor-not-allowed' : ''}
                    />
                    {slugError && <p className="text-sm text-red-600 mt-1">{slugError}</p>}
                    {formData.title && !slugError && (
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.slug
                          ? 'Auto-generated from title.'
                          : 'You can edit or reset to auto-generate.'}
                      </p>
                    )}
                    {formData.slug && formData.title && !slugError && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, slug: '' })}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Reset to auto-generate
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: e.target.value as CourseFormData['level'],
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="elementary">Elementary (4-7 years)</option>
                      <option value="basic">Basic (8-11 years)</option>
                      <option value="intermediate">Intermediate (12-15 years)</option>
                      <option value="advanced">Advanced (16-19 years)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Course Descriptions Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Course Descriptions
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Short Description *
                      </label>
                      <MediaSelectorButton
                        variant="compact"
                        size="sm"
                        buttonText="+ Insert Image/Video"
                        accept={['image', 'video']}
                        onSelect={(media: MediaFile[]) => {
                          if (media.length > 0) {
                            const file = media[0]
                            let embedCode = ''
                            if (file.file_type.startsWith('image/')) {
                              embedCode = `<img src="${file.file_url}" alt="${file.original_filename}" style="max-width: 100%; height: auto;" />`
                            } else if (file.file_type.startsWith('video/')) {
                              embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${file.file_url}" type="${file.file_type}" /></video>`
                            }
                            setFormData({
                              ...formData,
                              description: formData.description + embedCode,
                            })
                          }
                        }}
                      />
                    </div>
                    <SafeReactQuill
                      value={formData.description}
                      onChange={(value: string) => setFormData({ ...formData, description: value })}
                      placeholder="Brief overview for course listings (plain text or formatted text)"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Detailed Description
                      </label>
                      <MediaSelectorButton
                        variant="compact"
                        size="sm"
                        buttonText="+ Insert Image/Video"
                        accept={['image', 'video']}
                        onSelect={(media: MediaFile[]) => {
                          if (media.length > 0) {
                            const file = media[0]
                            let embedCode = ''
                            if (file.file_type.startsWith('image/')) {
                              embedCode = `<img src="${file.file_url}" alt="${file.original_filename}" style="max-width: 100%; height: auto;" />`
                            } else if (file.file_type.startsWith('video/')) {
                              embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${file.file_url}" type="${file.file_type}" /></video>`
                            }
                            setFormData({
                              ...formData,
                              detailed_description:
                                (formData.detailed_description || '') + embedCode,
                            })
                          }
                        }}
                      />
                    </div>
                    <SafeReactQuill
                      value={formData.detailed_description || ''}
                      onChange={(value: string) =>
                        setFormData({ ...formData, detailed_description: value })
                      }
                      placeholder="Comprehensive course description with formatting (rich text editor)..."
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Course Details Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Course Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Delivery
                    </label>
                    <select
                      value={formData.delivery_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          delivery_method: e.target.value as CourseFormData['delivery_method'],
                        })
                      }
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Online</option>
                      <option value="physical">In-person</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Weeks</label>
                    <Input
                      type="number"
                      value={formData.duration_weeks}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 0 })
                      }
                      min="1"
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Hours</label>
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
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Min Age
                    </label>
                    <Input
                      type="number"
                      value={formData.age_group_min}
                      onChange={(e) =>
                        setFormData({ ...formData, age_group_min: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Max Age
                    </label>
                    <Input
                      type="number"
                      value={formData.age_group_max}
                      onChange={(e) =>
                        setFormData({ ...formData, age_group_max: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Price</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Max Students
                    </label>
                    <Input
                      type="number"
                      value={formData.max_students}
                      onChange={(e) =>
                        setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })
                      }
                      min="1"
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
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
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              {/* Prerequisites Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <PencilIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Prerequisites
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prerequisites (Optional)
                  </label>
                  <SafeReactQuill
                    value={prerequisitesEditorValue}
                    onChange={handlePrerequisitesChange}
                    placeholder="Enter course prerequisites - you can format text or create lists"
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['clean'],
                      ],
                    }}
                    formats={[
                      'header',
                      'bold',
                      'italic',
                      'underline',
                      'strike',
                      'list',
                      'bullet',
                      'indent',
                    ]}
                  />
                </div>
              </div>

              {/* Learning Outcomes Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <PencilIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Learning Outcomes
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Outcomes
                  </label>
                  <SafeReactQuill
                    value={learningOutcomesEditorValue}
                    onChange={handleLearningOutcomesChange}
                    placeholder="Enter each outcome on a new line or create a bulleted list"
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['clean'],
                      ],
                    }}
                    formats={[
                      'header',
                      'bold',
                      'italic',
                      'underline',
                      'strike',
                      'list',
                      'bullet',
                      'indent',
                    ]}
                  />
                </div>
              </div>

              {/* Syllabus Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Syllabus (Optional)
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Add course syllabus modules with titles and session counts.
                  </p>

                  {syllabusModules.map((module, moduleIndex) => (
                    <div
                      key={moduleIndex}
                      className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Module {moduleIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setSyllabusModules(syllabusModules.filter((_, i) => i !== moduleIndex))
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Module Title
                          </label>
                          <Input
                            value={module.title}
                            onChange={(e) => {
                              const updated = [...syllabusModules]
                              updated[moduleIndex].title = e.target.value
                              setSyllabusModules(updated)
                            }}
                            placeholder="e.g., Introduction to Vedanta"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sessions
                          </label>
                          <Input
                            type="number"
                            value={module.sessions}
                            onChange={(e) => {
                              const updated = [...syllabusModules]
                              updated[moduleIndex].sessions = parseInt(e.target.value) || 1
                              setSyllabusModules(updated)
                            }}
                            min="1"
                            placeholder="e.g., 3"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setSyllabusModules([
                        ...syllabusModules,
                        {
                          title: '',
                          sessions: 1,
                        },
                      ])
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Module
                  </button>
                </div>
              </div>

              {/* Resources Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Resources (Optional)
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Add external resources for students.</p>

                  {resources.map((resource, resourceIndex) => (
                    <div
                      key={resourceIndex}
                      className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Resource {resourceIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setResources(resources.filter((_, i) => i !== resourceIndex))
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Resource Title
                          </label>
                          <Input
                            value={resource.title}
                            onChange={(e) => {
                              const updated = [...resources]
                              updated[resourceIndex].title = e.target.value
                              setResources(updated)
                            }}
                            placeholder="e.g., Bhagavad Gita Sanskrit Text"
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <Input
                            value={resource.url}
                            onChange={(e) => {
                              const updated = [...resources]
                              updated[resourceIndex].url = e.target.value
                              setResources(updated)
                            }}
                            placeholder="https://example.com/resource.pdf"
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <Input
                            value={resource.type}
                            onChange={(e) => {
                              const updated = [...resources]
                              updated[resourceIndex].type = e.target.value
                              setResources(updated)
                            }}
                            placeholder="e.g., pdf, audio, video, text"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setResources([
                        ...resources,
                        {
                          title: '',
                          url: '',
                          type: '',
                        },
                      ])
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Resource
                  </button>
                </div>
              </div>

              {/* Tags Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                  <PencilIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Tags
                </h3>
                <div className="space-y-2">
                  {tags.map((tag, tagIndex) => (
                    <div key={tagIndex} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          value={tag}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[,;\s]/g, '')
                            const updated = [...tags]
                            updated[tagIndex] = value
                            setTags(updated)
                          }}
                          placeholder="e.g., yoga"
                          className="text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTags(tags.filter((_, i) => i !== tagIndex))
                        }}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setTags([...tags, ''])
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Media & SEO Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                  <PencilIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Media & SEO (Optional)
                </h3>
                <div className="space-y-3">
                  <CourseImageSelector
                    coverImageUrl={formData.cover_image_url}
                    videoPreviewUrl={formData.video_preview_url}
                    onCoverImageSelect={(files) => {
                      if (files.length > 0) {
                        console.log('Selected cover image:', files[0].file_url)
                        setFormData((prev) => ({ ...prev, cover_image_url: files[0].file_url }))
                      } else {
                        setFormData((prev) => ({ ...prev, cover_image_url: null }))
                      }
                    }}
                    onVideoPreviewSelect={(files) => {
                      if (files.length > 0) {
                        console.log('Selected video preview:', files[0].file_url)
                        setFormData((prev) => ({ ...prev, video_preview_url: files[0].file_url }))
                      } else {
                        setFormData((prev) => ({ ...prev, video_preview_url: null }))
                      }
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <Input
                        value={formData.meta_title || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, meta_title: e.target.value }))
                        }
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <Input
                        value={formData.meta_description || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, meta_description: e.target.value }))
                        }
                        placeholder="SEO description for search engines"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t">
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
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-300">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Edit Course</h2>
                <button onClick={closeModal} className="p-1 text-white/80 hover:text-white rounded">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Basic Information Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gurukul *
                    </label>
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
                      Course Number
                    </label>
                    <Input
                      value={formData.course_number}
                      readOnly
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Will be regenerated if title or gurukul is changed
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part (Optional)
                      <span className="text-xs text-gray-500 ml-1">(A, B, C, D, etc.)</span>
                    </label>
                    <Input
                      value={formData.part || ''}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().slice(0, 1)
                        setFormData({ ...formData, part: value })
                      }}
                      placeholder="A, B, C..."
                      maxLength={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Course number preview:
                      {formData.gurukul_id &&
                      formData.title &&
                      gurukuls.find((g) => g.id === formData.gurukul_id) ? (
                        <span className="font-semibold ml-1">
                          {gurukuls
                            .find((g) => g.id === formData.gurukul_id)
                            ?.name.replace(/[^a-zA-Z]/g, '')
                            .substring(0, 2)
                            .toUpperCase()}
                          {formData.title
                            .replace(/[^a-zA-Z]/g, '')
                            .charAt(0)
                            .toUpperCase()}
                          #{formData.part || ''}
                        </span>
                      ) : (
                        ' [Select gurukul and enter title]'
                      )}
                    </p>
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
                      Slug{' '}
                      <span className="text-xs text-gray-500">(auto-generated from title)</span>
                    </label>
                    <Input
                      value={!formData.slug ? generateSlug(formData.title) : formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="course-title"
                      readOnly={!formData.title}
                      className={!formData.title ? 'bg-gray-100 cursor-not-allowed' : ''}
                    />
                    {slugError && <p className="text-sm text-red-600 mt-1">{slugError}</p>}
                    {formData.title && !slugError && (
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.slug
                          ? 'Auto-generated from title.'
                          : 'You can edit or reset to auto-generate.'}
                      </p>
                    )}
                    {formData.slug && formData.title && !slugError && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, slug: '' })}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Reset to auto-generate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Descriptions Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Course Descriptions
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Short Description *
                      </label>
                      <MediaSelectorButton
                        variant="compact"
                        size="sm"
                        buttonText="+ Insert Image/Video"
                        accept={['image', 'video']}
                        onSelect={(media: MediaFile[]) => {
                          if (media.length > 0) {
                            const file = media[0]
                            let embedCode = ''
                            if (file.file_type.startsWith('image/')) {
                              embedCode = `<img src="${file.file_url}" alt="${file.original_filename}" style="max-width: 100%; height: auto;" />`
                            } else if (file.file_type.startsWith('video/')) {
                              embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${file.file_url}" type="${file.file_type}" /></video>`
                            }
                            setFormData({
                              ...formData,
                              description: formData.description + embedCode,
                            })
                          }
                        }}
                      />
                    </div>
                    <SafeReactQuill
                      value={formData.description}
                      onChange={(value: string) => setFormData({ ...formData, description: value })}
                      placeholder="Brief overview for course listings"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Detailed Description
                      </label>
                      <MediaSelectorButton
                        variant="compact"
                        size="sm"
                        buttonText="+ Insert Image/Video"
                        accept={['image', 'video']}
                        onSelect={(media: MediaFile[]) => {
                          if (media.length > 0) {
                            const file = media[0]
                            let embedCode = ''
                            if (file.file_type.startsWith('image/')) {
                              embedCode = `<img src="${file.file_url}" alt="${file.original_filename}" style="max-width: 100%; height: auto;" />`
                            } else if (file.file_type.startsWith('video/')) {
                              embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${file.file_url}" type="${file.file_type}" /></video>`
                            }
                            setFormData({
                              ...formData,
                              detailed_description:
                                (formData.detailed_description || '') + embedCode,
                            })
                          }
                        }}
                      />
                    </div>
                    <SafeReactQuill
                      value={formData.detailed_description || ''}
                      onChange={(value: string) =>
                        setFormData({ ...formData, detailed_description: value })
                      }
                      placeholder="Comprehensive course description with formatting"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Course Details Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Course Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: e.target.value as CourseFormData['level'],
                        })
                      }
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="elementary">Elementary</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Delivery
                    </label>
                    <select
                      value={formData.delivery_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          delivery_method: e.target.value as CourseFormData['delivery_method'],
                        })
                      }
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remote">Online</option>
                      <option value="physical">In-person</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Min Age
                    </label>
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
              </div>

              {/* Prerequisites Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Prerequisites
                </h3>
                <div>
                  <SafeReactQuill
                    value={prerequisitesEditorValue}
                    onChange={handlePrerequisitesChange}
                    placeholder="Enter course prerequisites - you can format text or create lists"
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['clean'],
                      ],
                    }}
                    formats={[
                      'header',
                      'bold',
                      'italic',
                      'underline',
                      'strike',
                      'list',
                      'bullet',
                      'indent',
                    ]}
                  />
                </div>
              </div>

              {/* Learning Outcomes Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Learning Outcomes
                </h3>
                <div>
                  <SafeReactQuill
                    value={learningOutcomesEditorValue}
                    onChange={handleLearningOutcomesChange}
                    placeholder="Enter each outcome on a new line or create a bulleted list"
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['clean'],
                      ],
                    }}
                    formats={[
                      'header',
                      'bold',
                      'italic',
                      'underline',
                      'strike',
                      'list',
                      'bullet',
                      'indent',
                    ]}
                  />
                </div>
              </div>

              {/* Syllabus Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Syllabus (Optional)
                </h3>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Add course syllabus modules with titles and session counts.
                  </p>

                  {syllabusModules.map((module, moduleIndex) => (
                    <div
                      key={moduleIndex}
                      className="border border-gray-300 rounded-lg p-2 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-gray-700">
                          Module {moduleIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setSyllabusModules(syllabusModules.filter((_, i) => i !== moduleIndex))
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Module Title
                          </label>
                          <Input
                            value={module.title}
                            onChange={(e) => {
                              const updated = [...syllabusModules]
                              updated[moduleIndex].title = e.target.value
                              setSyllabusModules(updated)
                            }}
                            placeholder="e.g., Introduction to Vedanta"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Sessions
                          </label>
                          <Input
                            type="number"
                            value={module.sessions}
                            onChange={(e) => {
                              const updated = [...syllabusModules]
                              updated[moduleIndex].sessions = parseInt(e.target.value) || 1
                              setSyllabusModules(updated)
                            }}
                            min="1"
                            placeholder="e.g., 3"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setSyllabusModules([
                        ...syllabusModules,
                        {
                          title: '',
                          sessions: 1,
                        },
                      ])
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Module
                  </button>
                </div>
              </div>

              {/* Resources Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Resources (Optional)
                </h3>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Add external resources for students.</p>

                  {resources.map((resource, resourceIndex) => (
                    <div
                      key={resourceIndex}
                      className="border border-gray-300 rounded-lg p-2 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-gray-700">
                          Resource {resourceIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setResources(resources.filter((_, i) => i !== resourceIndex))
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Resource Title
                          </label>
                          <Input
                            value={resource.title}
                            onChange={(e) => {
                              const updated = [...resources]
                              updated[resourceIndex].title = e.target.value
                              setResources(updated)
                            }}
                            placeholder="e.g., Bhagavad Gita Sanskrit Text"
                            className="text-xs"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            URL
                          </label>
                          <Input
                            value={resource.url}
                            onChange={(e) => {
                              const updated = [...resources]
                              updated[resourceIndex].url = e.target.value
                              setResources(updated)
                            }}
                            placeholder="https://example.com/resource.pdf"
                            className="text-xs"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Type
                          </label>
                          <Input
                            value={resource.type}
                            onChange={(e) => {
                              const updated = [...resources]
                              updated[resourceIndex].type = e.target.value
                              setResources(updated)
                            }}
                            placeholder="e.g., pdf, audio, video, text"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setResources([
                        ...resources,
                        {
                          title: '',
                          url: '',
                          type: '',
                        },
                      ])
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Resource
                  </button>
                </div>
              </div>

              {/* Tags Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Tags
                </h3>
                <div className="space-y-2">
                  {tags.map((tag, tagIndex) => (
                    <div key={tagIndex} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          value={tag}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[,;\s]/g, '')
                            const updated = [...tags]
                            updated[tagIndex] = value
                            setTags(updated)
                          }}
                          placeholder="e.g., yoga"
                          className="text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTags(tags.filter((_, i) => i !== tagIndex))
                        }}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setTags([...tags, ''])
                    }}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Media & SEO Section */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <PencilIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                  Media & SEO (Optional)
                </h3>
                <div className="space-y-3">
                  <CourseImageSelector
                    coverImageUrl={formData.cover_image_url}
                    videoPreviewUrl={formData.video_preview_url}
                    onCoverImageSelect={(files) => {
                      if (files.length > 0) {
                        console.log('Selected cover image:', files[0].file_url)
                        setFormData((prev) => ({ ...prev, cover_image_url: files[0].file_url }))
                      } else {
                        setFormData((prev) => ({ ...prev, cover_image_url: null }))
                      }
                    }}
                    onVideoPreviewSelect={(files) => {
                      if (files.length > 0) {
                        console.log('Selected video preview:', files[0].file_url)
                        setFormData((prev) => ({ ...prev, video_preview_url: files[0].file_url }))
                      } else {
                        setFormData((prev) => ({ ...prev, video_preview_url: null }))
                      }
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <Input
                        value={formData.meta_title || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, meta_title: e.target.value }))
                        }
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <Input
                        value={formData.meta_description || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, meta_description: e.target.value }))
                        }
                        placeholder="SEO description for search engines"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t">
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
