import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { SafeReactQuill } from '../../components/ui/SafeReactQuill'
import MediaSelectorButton from '@/components/MediaSelectorButton'
import MediaSelector from '@/components/MediaSelector'
import CourseImageSelector from '@/components/CourseImageSelector'
import { Course, Enrollment, Certificate } from '@/types'
import { MediaFile } from '@/lib/api/media'
import { getTeacherCourses, createCourse, updateCourse, checkSlugExists } from '@/lib/api/courses'
import { assignCourseToTeacher } from '@/lib/api/courseAssignments'
import { sanitizeHtml } from '../../utils/sanitize'
import {
  getTeacherEnrollments,
  enrollStudentByTeacher,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getStudentsEnrolledInCourse,
} from '@/lib/api/enrollments'
import { queryCache } from '@/lib/cache'
import {
  bulkIssueCertificates,
  issueCertificateWithTemplate,
  issueBatchCertificates,
  getCertificatesFromTable,
} from '@/lib/api/certificates'
import { generateCertificatePreview } from '@/lib/pdf/certificateGenerator'
import {
  getTeacherCertificateAssignments,
  CertificateAssignment,
} from '@/lib/api/certificateAssignments'
import { getCertificateTemplates, CertificateTemplate } from '@/lib/api/certificateTemplates'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getUserProfile, getAllStudents } from '@/lib/api/users'
import {
  getBatches,
  getBatchStats,
  deleteBatch,
  updateBatchProgress,
  getCompletedBatchStudents,
  getBatchStudents,
  createBatch,
  assignStudentToBatch,
  removeStudentFromBatch,
  updateBatch,
  assignCourseToBatch,
  updateStudentProgress,
  getStudentProgressInBatch,
  clearBatchProgress,
} from '@/lib/api/batches'
import { Batch, BatchStudentWithInfo } from '@/types'
import { getCountryName, getStateName } from '@/lib/address-utils'
import type { Database } from '@/lib/supabase'
import { formatCurrency, formatDate, generateCourseUrl } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import ProfileEditModal from '../../components/profile/ProfileEditModal'
import DashboardComplianceSection from '../../components/compliance/DashboardComplianceSection'
import AttendanceManagement from '../../components/admin/AttendanceManagement'
import ConsentStatusBadge from '../../components/consent/ConsentStatusBadge'
import ConsentAuditModal from '../../components/consent/ConsentAuditModal'
import { getStudentsConsent, getStudentConsent, StudentConsent } from '../../lib/api/consent'
import { HelpButton, teacherDashboardHelpTopics } from '../../components/help'
import {
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ChartBarIcon,
  BookOpenIcon,
  BellIcon,
  CalendarDaysIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CurrencyEuroIcon,
  UsersIcon,
  GiftIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  Cog6ToothIcon,
  QueueListIcon,
  TrashIcon,
  PlayIcon,
  ClipboardDocumentCheckIcon,
  TagIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CalendarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
const courseSchema = z.object({
  gurukul_id: z.string().min(1, 'Please select a Gurukul'),
  course_number: z.string().optional(), // No longer required - auto-generated
  part: z.string().max(1, 'Part must be a single letter').optional(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  detailed_description: z.string().optional(),
  level: z.enum(['elementary', 'basic', 'intermediate', 'advanced']),
  age_group_min: z.number().min(4, 'Minimum age must be at least 4').optional(),
  age_group_max: z.number().max(100, 'Maximum age must be less than 100').optional(),
  duration_weeks: z.number().min(1, 'Duration must be at least 1 week').optional(),
  duration_hours: z.number().min(1, 'Duration must be at least 1 hour').optional(),
  delivery_method: z.enum(['physical', 'remote', 'hybrid']).default('hybrid'),
  price: z.number().min(0, 'Price must be non-negative').default(0),
  currency: z.string().default('EUR'),
  max_students: z.number().min(1, 'Must allow at least 1 student').default(20),
  min_students: z.number().min(1, 'Must allow at least 1 student').default(10),
  prerequisites: z.array(z.string()).optional(),
  learning_outcomes: z.array(z.string()).min(1, 'At least one learning outcome is required'),
  includes_certificate: z.boolean().default(true),
  image_url: z.string().optional().nullable(),
  cover_image_url: z.string().optional().nullable(),
  video_preview_url: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
})
type CourseForm = z.infer<typeof courseSchema>
type Profile = Database['public']['Tables']['profiles']['Row']
// Extended profile interface that includes address fields from database
interface ProfileWithAddress {
  id: string
  email: string
  full_name: string
  student_id?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}

const generateSlug = (text: string): string => {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function TeacherDashboard() {
  const { user, canAccess } = useWebsiteAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([])
  const [gurukuls, setGurukuls] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [certificateAssignments, setCertificateAssignments] = useState<CertificateAssignment[]>([])
  const [allTemplates, setAllTemplates] = useState<CertificateTemplate[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [allStudents, setAllStudents] = useState<ProfileWithAddress[]>([])
  const [completedBatchStudents, setCompletedBatchStudents] = useState<BatchStudentWithInfo[]>([])
  const [studentConsents, setStudentConsents] = useState<Map<string, StudentConsent>>(new Map())
  const [showConsentAudit, setShowConsentAudit] = useState(false)
  const [selectedConsentForAudit, setSelectedConsentForAudit] = useState<StudentConsent | null>(
    null,
  )
  const [selectedStudentNameForAudit, setSelectedStudentNameForAudit] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showEditCourse, setShowEditCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [slugError, setSlugError] = useState<string>('')
  const [activeView, setActiveView] = useState<
    | 'overview'
    | 'courses'
    | 'students'
    | 'certificates'
    | 'batches'
    | 'analytics'
    | 'attendance'
    | 'settings'
  >('overview')
  const [activeStudentsView, setActiveStudentsView] = useState<'registered' | 'enrolled'>(
    'registered',
  )
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([''])
  const [prerequisites, setPrerequisites] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([''])
  const [detailedDescription, setDetailedDescription] = useState('')
  const [selectedCoverImage, setSelectedCoverImage] = useState<MediaFile | null>(null)
  const [selectedVideoPreview, setSelectedVideoPreview] = useState<MediaFile | null>(null)
  const [coverImageCleared, setCoverImageCleared] = useState(false)
  const [videoPreviewCleared, setVideoPreviewCleared] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const quillRef = useRef<ReactQuill>(null)
  const [showIssuanceModal, setShowIssuanceModal] = useState(false)
  const [selectedEnrollmentForCert, setSelectedEnrollmentForCert] = useState<string | null>(null)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [selectedCertificateEnrollment, setSelectedCertificateEnrollment] =
    useState<Enrollment | null>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showBulkTemplateModal, setShowBulkTemplateModal] = useState(false)
  const [bulkEligibleEnrollments, setBulkEligibleEnrollments] = useState<string[]>([])
  const [showBatchCertificateModal, setShowBatchCertificateModal] = useState(false)
  const [selectedBatchForCertificate, setSelectedBatchForCertificate] = useState<string | null>(
    null,
  )
  const [showTemplatePreviewModal, setShowTemplatePreviewModal] = useState(false)
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] =
    useState<ProfileWithAddress | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close notifications when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showNotifications])

  // Teacher Profile State
  interface TeacherProfile {
    id: string
    full_name: string
    phone?: string
    date_of_birth?: string
    address_line_1?: string
    address_line_2?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: 'basic',
      delivery_method: 'hybrid',
      currency: 'EUR',
      price: 0,
      max_students: 20,
      min_students: 10,
      duration_weeks: 6,
      includes_certificate: true,
      is_active: true,
      featured: false,
    },
  })
  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync learning outcomes with form
  useEffect(() => {
    setValue(
      'learning_outcomes',
      learningOutcomes.filter((outcome) => outcome.trim() !== ''),
    )
  }, [learningOutcomes, setValue])

  // Sync prerequisites with form
  useEffect(() => {
    setValue(
      'prerequisites',
      prerequisites.filter((prereq) => prereq.trim() !== ''),
    )
  }, [prerequisites, setValue])

  // Sync tags with form
  useEffect(() => {
    setValue(
      'tags',
      tags.filter((tag) => tag.trim() !== ''),
    )
  }, [tags, setValue])

  // Validate slug for uniqueness
  const currentSlug = watch('slug')
  useEffect(() => {
    const validateSlug = async () => {
      const slug = currentSlug

      if (!slug) {
        setSlugError('')
        return
      }

      // If editing and the slug hasn't changed from the original, no need to validate
      if (editingCourse && slug === editingCourse.slug) {
        setSlugError('')
        return
      }

      // Check if slug exists in database
      const isDuplicate = await checkSlugExists(slug)
      setSlugError(isDuplicate ? 'This slug is already in use. Please choose a different one.' : '')
    }

    // Debounce slug validation
    const timer = setTimeout(validateSlug, 500)
    return () => clearTimeout(timer)
  }, [currentSlug, editingCourse])

  // Generate certificate preview when modal opens or template changes
  useEffect(() => {
    if (!showTemplatePreviewModal) return

    const generatePreview = async () => {
      if (allTemplates.length > currentTemplateIndex && allTemplates[currentTemplateIndex]) {
        // Skip preview generation for image-based templates (they already have images)
        if (allTemplates[currentTemplateIndex].template_data?.template_image) {
          setTemplatePreviewUrl(null)
          return
        }

        setLoadingPreview(true)
        try {
          const sampleData = {
            studentName: 'Sample Student Name',
            studentId: 'STU-001',
            courseName: 'Sample Course',
            courseId: 'COURSE-001',
            gurukulName: 'Sample Gurukul',
            completionDate: new Date().toISOString(),
            certificateNumber: 'CERT-2024-001',
            verificationCode: 'VERIFY123',
          }
          const currentTemplate = allTemplates[currentTemplateIndex]
          const preview = await generateCertificatePreview(sampleData, currentTemplate)
          setTemplatePreviewUrl(preview)
        } catch (error) {
          console.error('Failed to generate preview:', error)
          setTemplatePreviewUrl(null)
        } finally {
          setLoadingPreview(false)
        }
      }
    }
    generatePreview()
  }, [showTemplatePreviewModal, currentTemplateIndex, allTemplates])
  const loadDashboardData = async () => {
    try {
      // Invalidate enrollment caches to ensure fresh data
      queryCache.invalidatePattern('enrollments:.*')

      const [
        coursesData,
        enrollmentsData,
        pendingEnrollmentsData,
        gurukulData,
        assignmentsData,
        batchesData,
        studentsData,
        completedBatchStudentsData,
        certificatesData,
      ] = await Promise.all([
        getTeacherCourses(user!.id),
        getTeacherEnrollments(user!.id),
        getPendingEnrollments(user!.id),
        getGurukuls(),
        getTeacherCertificateAssignments(user!.id),
        getBatches({ teacher_id: user!.id, is_active: true }),
        getAllStudents(),
        getCompletedBatchStudents(user!.id),
        getCertificatesFromTable(),
      ])
      setCourses(coursesData)
      setEnrollments(enrollmentsData)
      setPendingEnrollments(pendingEnrollmentsData)

      setGurukuls(gurukulData)
      setCertificateAssignments(assignmentsData)

      // Fetch all available templates
      try {
        const templatesData = await getCertificateTemplates()
        setAllTemplates(templatesData)
      } catch (error) {
        console.error('Error loading templates:', error)
        setAllTemplates([])
      }

      setBatches(batchesData)
      setAllStudents(studentsData as ProfileWithAddress[])
      setCompletedBatchStudents(completedBatchStudentsData)
      setCertificates(certificatesData)

      // Load consent status for all students
      if (studentsData && studentsData.length > 0) {
        const studentIds = studentsData.map((s: any) => s.id)
        const consents = await getStudentsConsent(studentIds)
        const consentMap = new Map<string, StudentConsent>()
        consents.forEach((consent) => {
          if (consent) {
            consentMap.set(consent.student_id, consent)
          }
        })
        setStudentConsents(consentMap)
      }
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if student has certificate for course
  const hasCertificate = (studentId: string, courseId: string): boolean => {
    return certificates.some((cert) => cert.student_id === studentId && cert.course_id === courseId)
  }

  // Load teacher profile from database
  const loadTeacherProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const profile = await getUserProfile(user.id)
      if (profile) {
        // Cast to ProfileWithAddress since database has flat address fields
        const profileWithAddress = profile as unknown as ProfileWithAddress
        setTeacherProfile({
          id: profileWithAddress.id,
          full_name: profileWithAddress.full_name,
          phone: profileWithAddress.phone || undefined,
          date_of_birth: profileWithAddress.date_of_birth || undefined,
          address_line_1: profileWithAddress.address_line_1 || undefined,
          address_line_2: profileWithAddress.address_line_2 || undefined,
          city: profileWithAddress.city || undefined,
          state: profileWithAddress.state || undefined,
          zip_code: profileWithAddress.zip_code || undefined,
          country: profileWithAddress.country || undefined,
        })
      }
    } catch {
      // Error loading teacher profile - silent fail
    }
  }, [user?.id])
  // Load profile when component mounts
  useEffect(() => {
    if (user?.id) {
      loadTeacherProfile()
    }
  }, [user?.id, loadTeacherProfile])

  // Helper function to reset form state for new course creation
  const openCreateCourseModal = () => {
    // Reset form to pristine state with empty/default values
    reset({
      gurukul_id: '',
      course_number: '',
      title: '',
      slug: '',
      description: '',
      detailed_description: '',
      level: 'basic',
      age_group_min: undefined,
      age_group_max: undefined,
      duration_weeks: undefined,
      duration_hours: undefined,
      delivery_method: 'hybrid',
      price: 0,
      currency: 'EUR',
      max_students: 20,
      min_students: 10,
      prerequisites: [],
      learning_outcomes: [],
      includes_certificate: true,
      image_url: undefined,
      cover_image_url: undefined,
      video_preview_url: undefined,
      tags: [],
      meta_title: '',
      meta_description: '',
      featured: false,
      is_active: true,
      part: '',
    })
    setLearningOutcomes([''])
    setPrerequisites([''])
    setTags([''])
    setDetailedDescription('')
    setSelectedCoverImage(null)
    setSelectedVideoPreview(null)
    setShowCreateCourse(true)
  }

  const handleCreateCourse = async (data: CourseForm) => {
    setSavingCourse(true)
    try {
      // Generate slug from title if not provided
      const slug =
        data.slug ||
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

      const courseData = {
        gurukul_id: data.gurukul_id,
        title: data.title,
        slug,
        description: data.description,
        detailed_description: detailedDescription,
        level: data.level,
        age_group_min: data.age_group_min || 4,
        age_group_max: data.age_group_max || 18,
        duration_weeks: data.duration_weeks || 6,
        duration_hours: data.duration_hours || 24,
        price: data.price || 0,
        currency: data.currency || 'EUR',
        max_students: data.max_students || 20,
        min_students: data.min_students || 10,
        delivery_method: data.delivery_method,
        // Note: teacher_id removed from courses table - use course_assignments instead
        created_by: user!.id,
        is_active: data.is_active ?? true,
        learning_outcomes: data.learning_outcomes || [],
        prerequisites:
          data.prerequisites && data.prerequisites.length > 0 ? data.prerequisites : null,
        tags: data.tags || [],
        includes_certificate: data.includes_certificate ?? true,
        cover_image_url: selectedCoverImage?.file_url || data.cover_image_url || undefined,
        video_preview_url: selectedVideoPreview?.file_url || data.video_preview_url || undefined,
        syllabus: null,
        resources: [],
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        featured: data.featured || false,
        part: data.part || undefined,
      }

      // Create the course
      const newCourse = await createCourse(courseData)

      // Assign the teacher to the newly created course
      await assignCourseToTeacher(newCourse.id, user!.id, user!.id, 'Course creator')

      await loadDashboardData()
      setShowCreateCourse(false)
      reset()
      setLearningOutcomes([''])
      setPrerequisites([''])
      setTags([''])
      setDetailedDescription('')
      setSelectedCoverImage(null)
      setSelectedVideoPreview(null)
      toast.success('Course created successfully!')
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error(
        'Failed to create course: ' + (error instanceof Error ? error.message : 'Unknown error'),
      )
    } finally {
      setSavingCourse(false)
    }
  }

  const handleEditCourse = async (data: CourseForm) => {
    console.log('handleEditCourse called', { editingCourse, data })
    if (!editingCourse) {
      console.log('No editing course, returning')
      return
    }

    setSavingCourse(true)
    try {
      const slug =
        data.slug ||
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

      const courseData = {
        gurukul_id: data.gurukul_id,
        title: data.title,
        slug,
        description: data.description,
        detailed_description: detailedDescription,
        level: data.level,
        age_group_min: data.age_group_min || 4,
        age_group_max: data.age_group_max || 18,
        duration_weeks: data.duration_weeks || 6,
        duration_hours: data.duration_hours || 24,
        price: data.price || 0,
        currency: data.currency || 'EUR',
        max_students: data.max_students || 20,
        min_students: data.min_students || 10,
        delivery_method: data.delivery_method,
        is_active: data.is_active ?? true,
        learning_outcomes: data.learning_outcomes || [],
        prerequisites:
          data.prerequisites && data.prerequisites.length > 0 ? data.prerequisites : null,
        tags: data.tags || [],
        includes_certificate: data.includes_certificate ?? true,
        cover_image_url: coverImageCleared
          ? null
          : selectedCoverImage?.file_url || data.cover_image_url || null,
        video_preview_url: videoPreviewCleared
          ? null
          : selectedVideoPreview?.file_url || data.video_preview_url || null,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        featured: data.featured || false,
        part: data.part || undefined,
      }

      await updateCourse(editingCourse.id, courseData)

      // Show success toast before closing modal
      toast.success('Course updated successfully!')

      // Wait a bit for toast to be visible before closing modal
      await new Promise((resolve) => setTimeout(resolve, 500))

      await loadDashboardData()
      setShowEditCourse(false)
      setEditingCourse(null)
      reset()
      setLearningOutcomes([''])
      setPrerequisites([''])
      setTags([''])
      setDetailedDescription('')
      setSelectedCoverImage(null)
      setSelectedVideoPreview(null)
      setCoverImageCleared(false)
      setVideoPreviewCleared(false)
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error(
        'Failed to update course: ' + (error instanceof Error ? error.message : 'Unknown error'),
      )
      // Wait a bit for error toast to be visible
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setSavingCourse(false)
    }
  }

  const openEditCourse = (course: Course) => {
    setEditingCourse(course)
    reset({
      gurukul_id: course.gurukul_id,
      course_number: course.course_number,
      title: course.title,
      slug: course.slug,
      description: course.description,
      level: course.level,
      age_group_min: course.age_group_min,
      age_group_max: course.age_group_max,
      duration_weeks: course.duration_weeks,
      duration_hours: course.duration_hours,
      delivery_method: course.delivery_method,
      price: course.price,
      currency: course.currency,
      max_students: course.max_students,
      min_students: course.min_students,
      includes_certificate: course.includes_certificate,
      image_url: course.image_url,
      cover_image_url: course.cover_image_url,
      video_preview_url: course.video_preview_url,
      tags: course.tags,
      meta_title: course.meta_title || '',
      meta_description: course.meta_description || '',
      featured: course.featured,
      is_active: course.is_active,
      part: course.course_number?.slice(-1).match(/[A-Z]/) ? course.course_number.slice(-1) : '',
    })
    setDetailedDescription(course.detailed_description || '')
    setLearningOutcomes(
      course.learning_outcomes && course.learning_outcomes.length > 0
        ? course.learning_outcomes
        : [''],
    )
    setPrerequisites(
      course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0
        ? course.prerequisites
        : [''],
    )
    setTags(course.tags && course.tags.length > 0 ? course.tags : [''])
    setSelectedCoverImage(
      course.cover_image_url ? ({ file_url: course.cover_image_url } as MediaFile) : null,
    )
    setSelectedVideoPreview(
      course.video_preview_url ? ({ file_url: course.video_preview_url } as MediaFile) : null,
    )
    setCoverImageCleared(false)
    setVideoPreviewCleared(false)
    setShowEditCourse(true)
  }

  // State for media selector for ReactQuill
  const [showImageSelector, setShowImageSelector] = useState(false)

  // Image handler for ReactQuill
  const imageHandler = useCallback(() => {
    setShowImageSelector(true)
  }, [])

  // Handle image selection from media selector
  const handleImageSelect = useCallback((files: MediaFile[]) => {
    setShowImageSelector(false)

    if (files.length > 0) {
      const selectedImage = files[0]
      // Use setTimeout to ensure the modal is closed and ReactQuill is re-rendered
      setTimeout(() => {
        const quill = quillRef.current?.getEditor()
        if (quill) {
          // Get current selection or default to end of content
          const range = quill.getSelection() || { index: quill.getLength() }
          quill.insertEmbed(range.index, 'image', selectedImage.file_url)
          // Move cursor after the image
          quill.setSelection(range.index + 1)
          // Focus back to the editor
          quill.focus()
        }
      }, 100)
    }
  }, [])

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  )

  const quillFormats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'list',
      'bullet',
      'indent',
      'align',
      'link',
      'image',
    ],
    [],
  )

  const handleIssueCertificateWithTemplate = async (enrollmentId: string, templateId: string) => {
    try {
      await issueCertificateWithTemplate(enrollmentId, templateId)
      await loadDashboardData()
      setShowIssuanceModal(false)
      setSelectedEnrollmentForCert(null)
      setSelectedTemplate(null)
      toast.success('Certificate issued successfully with template!')
    } catch {
      toast.error('Failed to issue certificate')
    }
  }
  const openIssuanceModal = (enrollmentId: string) => {
    setSelectedEnrollmentForCert(enrollmentId)
    setShowIssuanceModal(true)
  }

  const openEnrollmentModal = (student: ProfileWithAddress) => {
    setSelectedStudentForEnrollment(student)
    setShowEnrollmentModal(true)
  }

  const handleBulkIssueCertificatesWithTemplate = async (templateId: string) => {
    if (bulkEligibleEnrollments.length === 0) {
      toast.error('No eligible students selected')
      return
    }

    try {
      // Issue certificates with the selected template
      await Promise.all(
        bulkEligibleEnrollments.map((enrollmentId) =>
          issueCertificateWithTemplate(enrollmentId, templateId),
        ),
      )
      await loadDashboardData()
      toast.success(`${bulkEligibleEnrollments.length} certificates issued with selected template!`)
      setShowBulkTemplateModal(false)
      setBulkEligibleEnrollments([])
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error issuing bulk certificates:', error)
      toast.error('Failed to issue certificates')
    }
  }

  const handleIndividualCertificate = (student: BatchStudentWithInfo) => {
    // Implementation for individual certificate issuance
  }

  const handleIssueBatchCertificates = async (templateId?: string) => {
    if (!selectedBatchForCertificate) {
      toast.error('No batch selected')
      return
    }

    try {
      const results = await issueBatchCertificates(selectedBatchForCertificate, templateId)

      const successCount = results.filter((r) => r.success).length
      const failCount = results.filter((r) => !r.success).length

      if (successCount > 0) {
        toast.success(`${successCount} certificates issued successfully!`)
      }

      if (failCount > 0) {
        toast.error(`${failCount} certificates failed to issue`)
      }

      await loadDashboardData()
      setShowBatchCertificateModal(false)
      setSelectedBatchForCertificate(null)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error issuing batch certificates:', error)
      toast.error('Failed to issue batch certificates')
    }
  }
  const addLearningOutcome = () => {
    setLearningOutcomes([...learningOutcomes, ''])
  }
  const removeLearningOutcome = (index: number) => {
    if (learningOutcomes.length > 1) {
      const newOutcomes = learningOutcomes.filter((_, i) => i !== index)
      setLearningOutcomes(newOutcomes)
    }
  }
  const updateLearningOutcome = (index: number, value: string) => {
    const newOutcomes = [...learningOutcomes]
    newOutcomes[index] = value
    setLearningOutcomes(newOutcomes)
  }

  // Prerequisites management
  const addPrerequisite = () => {
    setPrerequisites([...prerequisites, ''])
  }
  const removePrerequisite = (index: number) => {
    if (prerequisites.length > 1) {
      const newPrerequisites = prerequisites.filter((_, i) => i !== index)
      setPrerequisites(newPrerequisites)
    }
  }
  const updatePrerequisite = (index: number, value: string) => {
    const newPrerequisites = [...prerequisites]
    newPrerequisites[index] = value
    setPrerequisites(newPrerequisites)
  }

  // Tags management
  const addTag = () => {
    setTags([...tags, ''])
  }
  const removeTag = (index: number) => {
    if (tags.length > 1) {
      const newTags = tags.filter((_, i) => i !== index)
      setTags(newTags)
    }
  }
  const updateTag = (index: number, value: string) => {
    const newTags = [...tags]
    newTags[index] = value
    setTags(newTags)
  }

  // Calculate stats from real database data
  const stats = {
    totalCourses: courses.length,
    // Count unique students (not total enrollments)
    totalStudents: new Set(enrollments.map((e) => e.student_id).filter(Boolean)).size,
    // Total enrollments for reference
    totalEnrollments: enrollments.length,
    // Total enrolled (approved + completed enrollments)
    totalEnrolled: enrollments.filter((e) => e.status === 'approved' || e.status === 'completed')
      .length,
    // Pending enrollments that need approval
    pendingApprovals: pendingEnrollments.length,
    completedCourses: enrollments.filter((e) => e.status === 'completed').length,
    certificatesIssued: enrollments.filter(
      (e) => e.status === 'completed' && hasCertificate(e.student_id, e.course_id),
    ).length,
    pendingCertificates: enrollments.filter(
      (e) => e.status === 'completed' && !hasCertificate(e.student_id, e.course_id),
    ).length,
    // Batch-centric certificate management
    completedBatches: batches.filter((batch) => batch.status === 'completed').length,
    batchesReadyForCertificates: completedBatchStudents.length,
    // Calculate revenue from paid enrollments only - handles currency conversion and edge cases
    totalRevenue: enrollments
      .filter((e) => e.payment_status === 'paid' && e.course?.price && e.course.price > 0)
      .reduce((sum, e) => {
        const price = e.course?.price || 0
        // TODO: Add currency conversion when multiple currencies are supported
        return sum + price
      }, 0),
    // Calculate completion rate percentage
    completionRate:
      enrollments.length > 0
        ? Math.round(
            (enrollments.filter((e) => e.status === 'completed').length / enrollments.length) * 100,
          )
        : 0,
    averageRating: 0, // No rating system implemented yet
    totalBatches: batches.filter(
      (batch) => batch.status === 'active' || batch.status === 'in_progress',
    ).length, // Active batches only
  }

  // Notification data aggregation
  const notifications = [
    // Pending enrollment approvals
    ...pendingEnrollments.map((enrollment) => ({
      id: enrollment.id,
      type: 'enrollment' as const,
      title: 'New enrollment pending approval',
      message: `${enrollment.student?.full_name || 'Student'} enrolled in ${enrollment.course?.title || 'course'}`,
      timestamp: new Date(enrollment.created_at),
      action: () => setActiveView('students'),
      actionText: 'Review',
    })),
    // Pending certificates to issue
    ...enrollments
      .filter((e) => e.status === 'completed' && !hasCertificate(e.student_id, e.course_id))
      .map((enrollment) => ({
        id: `cert-${enrollment.id}`,
        type: 'certificate' as const,
        title: 'Certificate ready to issue',
        message: `Issue certificate for ${enrollment.student?.full_name || 'student'} in ${enrollment.course?.title || 'course'}`,
        timestamp: new Date(enrollment.completed_at || enrollment.updated_at),
        action: () => setActiveView('certificates'),
        actionText: 'Issue',
      })),
    // Recent certificate assignments
    ...certificateAssignments
      .filter((cert) => {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        return new Date(cert.created_at).getTime() > dayAgo
      })
      .map((cert) => ({
        id: `assign-${cert.id}`,
        type: 'assignment' as const,
        title: 'New certificate assignment',
        message: `New certificate template "${cert.template?.name || 'template'}" assigned`,
        timestamp: new Date(cert.created_at),
        action: () => setActiveView('certificates'),
        actionText: 'View',
      })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10) // Show only latest 10 notifications

  // Generate recent activity from real enrollment data
  const recentActivity = enrollments
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4)
    .map((enrollment) => {
      const timeDiff = Date.now() - new Date(enrollment.updated_at).getTime()
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const days = Math.floor(hours / 24)
      let timeText = ''
      if (days > 0) {
        timeText = `${days} day${days > 1 ? 's' : ''} ago`
      } else if (hours > 0) {
        timeText = `${hours} hour${hours > 1 ? 's' : ''} ago`
      } else {
        timeText = 'Recently'
      }
      if (enrollment.status === 'completed') {
        return {
          type: 'completion',
          message: `${enrollment.student?.full_name || 'Student'} completed ${enrollment.course?.title || 'course'}`,
          time: timeText,
          icon: CheckCircleIcon,
        }
      } else if (hasCertificate(enrollment.student_id, enrollment.course_id)) {
        return {
          type: 'certificate',
          message: `Certificate issued to ${enrollment.student?.full_name || 'student'}`,
          time: timeText,
          icon: DocumentTextIcon,
        }
      } else if (enrollment.status === 'pending') {
        return {
          type: 'enrollment',
          message: `New enrollment request from ${enrollment.student?.full_name || 'student'} in ${enrollment.course?.title || 'course'}`,
          time: timeText,
          icon: UserGroupIcon,
        }
      } else {
        return {
          type: 'enrollment',
          message: `${enrollment.student?.full_name || 'Student'} enrolled in ${enrollment.course?.title || 'course'}`,
          time: timeText,
          icon: BookOpenIcon,
        }
      }
    })
  const quickActions = [
    {
      title: 'Create New Course',
      description: 'Design and launch a new course',
      icon: PlusIcon,
      action: () => openCreateCourseModal(),
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      highlight: true,
    },
    {
      title: 'Review Enrollments',
      description: `${stats.pendingApprovals} pending approvals`,
      icon: ClockIcon,
      action: () => setActiveView('students'),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      badge: stats.pendingApprovals,
    },
    {
      title: 'Issue Certificates',
      description: `${stats.pendingCertificates} ready to issue`,
      icon: TrophyIcon,
      action: () => setActiveView('certificates'),
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      badge: stats.pendingCertificates,
    },
    {
      title: 'View Analytics',
      description: 'Track your teaching performance',
      icon: ChartBarIcon,
      action: () => setActiveView('analytics'),
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
  ]
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center pt-6 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-4 sm:mb-6 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2">
              Loading Dashboard
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">Preparing your teaching workspace...</p>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { greeting: 'Good morning', icon: SunIcon }
    if (hour < 18) return { greeting: 'Good afternoon', icon: SunIcon }
    return { greeting: 'Good evening', icon: MoonIcon }
  }
  const { greeting, icon: TimeIcon } = getTimeOfDay()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-0">
      {/* Enhanced Modern Header - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg"
      >
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0"
            >
              <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mb-1"
              >
                <TimeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent truncate">
                  {greeting}, {user?.full_name?.split(' ')[0] || 'Teacher'}! 👋
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xs sm:text-sm text-gray-600 font-medium truncate"
              >
                Ready to inspire minds today?
              </motion.p>
            </div>
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="relative"
                ref={notificationRef}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white/50 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <BellIcon className="h-6 w-6 text-gray-600" />
                  {notifications.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg"
                    >
                      {notifications.length}
                    </motion.span>
                  )}
                </motion.div>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="fixed sm:absolute top-16 right-0 left-0 sm:left-auto w-full sm:w-96 bg-white rounded-xl sm:rounded-xl rounded-t-none sm:rounded-t-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] sm:max-h-96 overflow-hidden mx-0 sm:mx-auto"
                    >
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-800">
                              {notifications.length}
                            </Badge>
                            {notifications.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowNotifications(false)}
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No new notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => {
                                notification.action()
                                setShowNotifications(false)
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {notification.type === 'enrollment' && (
                                      <UserGroupIcon className="h-4 w-4 text-blue-500" />
                                    )}
                                    {notification.type === 'certificate' && (
                                      <DocumentTextIcon className="h-4 w-4 text-green-500" />
                                    )}
                                    {notification.type === 'assignment' && (
                                      <AcademicCapIcon className="h-4 w-4 text-purple-500" />
                                    )}
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {notification.timestamp.toLocaleDateString()}{' '}
                                    {notification.timestamp.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-3 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    notification.action()
                                    setShowNotifications(false)
                                  }}
                                >
                                  {notification.actionText}
                                </Button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-gray-600 hover:text-gray-900"
                            onClick={() => setShowNotifications(false)}
                          >
                            Close notifications
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-3 bg-white/50 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </motion.div>
              </motion.div>
              {/* Rating badge hidden until rating system is implemented
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold shadow-lg">
                  <StarIcon className="h-5 w-5 mr-2 fill-current" />
                  Rating System Coming Soon
                </Badge>
              </motion.div>
              */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
              >
                <HelpButton
                  topics={teacherDashboardHelpTopics}
                  title="Teacher Dashboard Help"
                  description="Learn how to use all dashboard features"
                  showKeyboardHint={true}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                {/* Create Course button removed - functionality available in My Courses tab */}
              </motion.div>
            </div>
          </div>
          {/* Enhanced Navigation Pills - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-3 sm:mt-4 lg:mt-8 w-full relative"
          >
            {/* Scroll indicator for mobile */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none sm:hidden z-10 rounded-r-lg" />
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              <div className="flex gap-2 sm:gap-3 lg:gap-4 bg-white/50 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/20 shadow-lg min-w-min">
                {[
                  {
                    id: 'overview',
                    name: 'Dashboard',
                    icon: ChartBarIcon,
                    badge: null,
                    permission: { resource: 'dashboard', action: 'read' },
                  },
                  {
                    id: 'courses',
                    name: 'My Courses',
                    icon: BookOpenIcon,
                    badge: stats.totalCourses > 0 ? stats.totalCourses : null,
                    permission: { resource: 'courses', action: 'view' },
                  },
                  {
                    id: 'students',
                    name: 'Students',
                    icon: UserGroupIcon,
                    badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null,
                    permission: { resource: 'users', action: 'view' },
                  },
                  {
                    id: 'certificates',
                    name: 'Certificates',
                    icon: DocumentTextIcon,
                    badge: stats.pendingCertificates > 0 ? stats.pendingCertificates : null,
                    permission: { resource: 'certificates', action: 'read' },
                  },
                  {
                    id: 'analytics',
                    name: 'Analytics',
                    icon: ArrowTrendingUpIcon,
                    badge: null,
                    permission: { resource: 'analytics', action: 'read' },
                  },
                  {
                    id: 'batches',
                    name: 'Batch Management',
                    icon: QueueListIcon,
                    badge: null,
                    permission: { resource: 'batches', action: 'read' },
                  },
                  {
                    id: 'attendance',
                    name: 'Attendance',
                    icon: CalendarDaysIcon,
                    badge: null,
                    permission: { resource: 'batches', action: 'read' },
                  },
                  {
                    id: 'settings',
                    name: 'Profile',
                    icon: Cog6ToothIcon,
                    badge: null,
                    permission: { resource: 'settings', action: 'view' },
                  },
                ]
                  .filter((tab) => {
                    const hasPermission = canAccess(tab.permission.resource, tab.permission.action)
                    return hasPermission
                  })
                  .map((tab, index) => (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setActiveView(
                          tab.id as
                            | 'overview'
                            | 'courses'
                            | 'students'
                            | 'certificates'
                            | 'batches'
                            | 'analytics'
                            | 'attendance'
                            | 'settings',
                        )
                        // Scroll to top of page
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      title={tab.name}
                      className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-lg lg:rounded-xl font-semibold text-xs sm:text-sm lg:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap min-h-[44px] ${
                        activeView === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      {tab.badge && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg"
                        >
                          {tab.badge}
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Enhanced Overview */}
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-12"
            >
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
                {[
                  {
                    title: 'Total Courses',
                    value: stats.totalCourses,
                    icon: BookOpenIcon,
                    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
                    bgGradient: 'from-blue-50 via-blue-100 to-indigo-100',
                    delay: 0.1,
                    permission: { resource: 'courses', action: 'view' },
                  },
                  {
                    title: 'Total Students',
                    value: stats.totalStudents,
                    icon: UserGroupIcon,
                    gradient: 'from-green-500 via-emerald-600 to-teal-600',
                    bgGradient: 'from-green-50 via-emerald-100 to-teal-100',
                    delay: 0.2,
                    permission: { resource: 'users', action: 'view' },
                  },
                  {
                    title: 'Certificates',
                    value: stats.certificatesIssued,
                    icon: TrophyIcon,
                    gradient: 'from-purple-500 via-violet-600 to-purple-600',
                    bgGradient: 'from-purple-50 via-violet-100 to-purple-100',
                    delay: 0.3,
                    permission: { resource: 'certificates', action: 'read' },
                  },
                  {
                    title: 'Active Batches',
                    value: stats.totalBatches || 0,
                    icon: QueueListIcon,
                    gradient: 'from-orange-500 via-red-500 to-pink-600',
                    bgGradient: 'from-orange-50 via-red-50 to-pink-50',
                    delay: 0.4,
                    permission: { resource: 'batches', action: 'read' },
                  },
                ]
                  .filter((stat) => {
                    const hasPermission = canAccess(
                      stat.permission.resource,
                      stat.permission.action,
                    )
                    return hasPermission
                  })
                  .map((stat) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: stat.delay,
                        duration: 0.6,
                        type: 'spring',
                        stiffness: 100,
                      }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="group"
                    >
                      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                        />
                        <CardContent className="p-4 sm:p-6 lg:p-8 relative">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-2 sm:space-y-3 min-w-0">
                              <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                {stat.title}
                              </p>
                              <motion.p
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: stat.delay + 0.2 }}
                                className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                              >
                                {typeof stat.value === 'string'
                                  ? stat.value
                                  : stat.value.toLocaleString()}
                              </motion.p>
                            </div>
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                delay: stat.delay + 0.3,
                                type: 'spring',
                                stiffness: 200,
                              }}
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              className={`h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-gradient-to-r ${stat.gradient} rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex-shrink-0`}
                            >
                              <stat.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                            </motion.div>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: stat.delay + 0.5, duration: 1 }}
                            className="mt-3 sm:mt-4 lg:mt-6"
                          >
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ delay: stat.delay + 0.7, duration: 1.5 }}
                                className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                              />
                            </div>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
              {/* Enhanced Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-2xl overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold">Quick Actions</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                      {quickActions.map((action, index) => (
                        <div
                          key={index}
                          onClick={action.action}
                          className={`relative p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${action.color} text-white group min-h-[100px] sm:min-h-[120px]`}
                        >
                          {action.highlight && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                              NEW
                            </div>
                          )}
                          {action.badge && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {action.badge}
                            </div>
                          )}
                          <action.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                          <h3 className="text-sm sm:text-base font-semibold mb-1">
                            {action.title}
                          </h3>
                          <p className="text-xs sm:text-sm opacity-90">{action.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Recent Activity */}
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FireIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0" />
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold">Recent Activity</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
                        >
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <activity.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.message}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {/* Performance Insights */}
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <LightBulbIcon className="h-6 w-6 text-yellow-600" />
                      <h2 className="text-xl font-bold">Performance Insights</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">
                            Excellent Completion Rate
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          85% of your students complete courses successfully
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <StarIcon className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800">
                            High Student Satisfaction
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">Student rating system coming soon</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrophyIcon className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold text-purple-800">
                            Certificate Achievement
                          </span>
                        </div>
                        <p className="text-sm text-purple-700">
                          {stats.certificatesIssued} certificates issued this month
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
          {/* Courses View */}
          {activeView === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                    My Courses
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Manage and create your educational content
                  </p>
                </div>
                <Button
                  onClick={() => openCreateCourseModal()}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 font-semibold"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Course
                </Button>
              </div>
              {courses.length === 0 ? (
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardContent className="text-center py-16">
                    <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first course to start teaching!
                    </p>
                    <Button
                      onClick={() => openCreateCourseModal()}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 font-semibold"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First Course
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-6">
                  {courses.map((course) => {
                    const courseEnrollments = enrollments.filter((e) => e.course_id === course.id)
                    // Count unique students enrolled in this course
                    const uniqueStudentCount = new Set(
                      courseEnrollments.map((e) => e.student_id).filter(Boolean),
                    ).size
                    const pendingCertificates = courseEnrollments.filter(
                      (e) => e.status === 'completed' && !hasCertificate(e.student_id, e.course_id),
                    ).length
                    return (
                      <Card
                        key={course.id}
                        className="border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group"
                      >
                        <div className="h-32 sm:h-40 lg:h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-t-lg relative overflow-hidden">
                          {course.cover_image_url || course.image_url ? (
                            <img
                              src={course.cover_image_url || course.image_url}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-black/20"></div>
                          )}
                          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900">
                              {course.course_number}
                            </p>
                          </div>
                          {pendingCertificates > 0 && (
                            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse">
                              {pendingCertificates}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          <div className="flex items-center justify-between mb-2 gap-1">
                            <h3 className="font-bold text-sm sm:text-base lg:text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                              {course.title}
                            </h3>
                            <span className="px-1.5 sm:px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded border border-blue-200 whitespace-nowrap">
                              {course.level
                                ? course.level.charAt(0).toUpperCase() +
                                  course.level.slice(1).toLowerCase()
                                : 'Basic'}
                            </span>
                          </div>
                          <div
                            className="text-gray-600 text-xs sm:text-sm mb-3 lg:mb-4 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                          />
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 lg:mb-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-1">
                              <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                              <span>{uniqueStudentCount} students</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                              <span>{course.duration_weeks} w</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CurrencyEuroIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{formatCurrency(course.price)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                              <span>
                                {
                                  courseEnrollments.filter((e) =>
                                    hasCertificate(e.student_id, e.course_id),
                                  ).length
                                }{' '}
                                certified
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditCourse(course)}
                              disabled={savingCourse}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Link to={generateCourseUrl(course)} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Scroll to top when viewing course details
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            {pendingCertificates > 0 && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const eligibleEnrollments = courseEnrollments.filter(
                                    (e) =>
                                      e.status === 'completed' &&
                                      !hasCertificate(e.student_id, e.course_id),
                                  )
                                  if (eligibleEnrollments.length >= 1) {
                                    // Always open template selection modal first
                                    setBulkEligibleEnrollments(eligibleEnrollments.map((e) => e.id))
                                    setShowBulkTemplateModal(true)
                                    setSelectedTemplate(null)
                                  }
                                }}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                              >
                                <GiftIcon className="h-4 w-4 mr-1" />
                                Issue ({pendingCertificates})
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
          {/* Student & Batch Enrollment Management */}
          {activeView === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                    Student & Batch Enrollment
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Manage registered students and enroll them in batches
                  </p>
                </div>
              </div>

              {/* Stats - Clickable drill-down cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                <Card
                  className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    setActiveStudentsView('registered')
                    setTimeout(() => {
                      const registeredSection = document.querySelector(
                        '[data-section="registered-students"]',
                      )
                      if (registeredSection) {
                        const yOffset = -150
                        const y =
                          registeredSection.getBoundingClientRect().top +
                          window.pageYOffset +
                          yOffset
                        window.scrollTo({ top: y, behavior: 'smooth' })
                      }
                    }, 100)
                  }}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-900">
                      {allStudents.length}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-700">Registered</div>
                  </CardContent>
                </Card>
                <Card
                  className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    setActiveStudentsView('enrolled')
                    setTimeout(() => {
                      const enrolledSection = document.querySelector(
                        '[data-section="enrolled-students"]',
                      )
                      if (enrolledSection) {
                        const yOffset = -150
                        const y =
                          enrolledSection.getBoundingClientRect().top + window.pageYOffset + yOffset
                        window.scrollTo({ top: y, behavior: 'smooth' })
                      }
                    }, 100)
                  }}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-900">
                      {stats.totalEnrolled}
                    </div>
                    <div className="text-xs sm:text-sm text-green-700">Enrolled</div>
                  </CardContent>
                </Card>
                <Card
                  className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    setTimeout(() => {
                      const pendingSection = document.querySelector(
                        '[data-section="pending-approvals"]',
                      )
                      if (pendingSection) {
                        const yOffset = -150
                        const y =
                          pendingSection.getBoundingClientRect().top + window.pageYOffset + yOffset
                        window.scrollTo({ top: y, behavior: 'smooth' })
                      }
                    }, 100)
                  }}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-yellow-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-900">
                      {stats.pendingApprovals}
                    </div>
                    <div className="text-xs sm:text-sm text-yellow-700">Pending</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-indigo-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-indigo-900">
                      {enrollments.filter((e) => e.status === 'completed').length}
                    </div>
                    <div className="text-xs sm:text-sm text-indigo-700">Completed</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-purple-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-900">
                      {stats.totalBatches}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-700">Batches</div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Enrollment Approvals */}
              {pendingEnrollments.length > 0 && (
                <Card
                  data-section="pending-approvals"
                  className="border-0 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 scroll-mt-32"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-6 w-6 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-900">
                        Pending Enrollment Approvals
                      </h3>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {pendingEnrollments.length} pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200 shadow-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {enrollment.student?.full_name || 'Unknown Student'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Course: {enrollment.course?.title || 'Unknown Course'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await approveEnrollment(enrollment.id)
                                  toast.success('Enrollment approved!')
                                  loadDashboardData()
                                } catch (error) {
                                  console.error('Error approving enrollment:', error)
                                  toast.error('Failed to approve enrollment')
                                }
                              }}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await rejectEnrollment(enrollment.id)
                                  toast.success('Enrollment rejected')
                                  loadDashboardData()
                                } catch (error) {
                                  console.error('Error rejecting enrollment:', error)
                                  toast.error('Failed to reject enrollment')
                                }
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enrolled Students */}
              {activeStudentsView === 'enrolled' && (
                <Card
                  data-section="enrolled-students"
                  className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 scroll-mt-32"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Enrolled Students</h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {stats.totalEnrolled} enrolled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.totalEnrolled === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No enrolled students
                        </h3>
                        <p className="text-gray-600">
                          Students who are actively enrolled in courses will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allStudents
                          .map((student) => {
                            const studentEnrollments = enrollments.filter(
                              (e) =>
                                e.student_id === student.id &&
                                (e.status === 'approved' || e.status === 'completed'),
                            )
                            return { student, studentEnrollments }
                          })
                          .filter(({ studentEnrollments }) => studentEnrollments.length > 0)
                          .map(({ student, studentEnrollments }) => {
                            const activeEnrollments = studentEnrollments.filter(
                              (e) => e.status === 'approved',
                            )
                            const completedEnrollments = studentEnrollments.filter(
                              (e) => e.status === 'completed',
                            )

                            return (
                              <div
                                key={student.id}
                                className="p-4 bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg border border-green-200 flex flex-col h-full"
                              >
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">
                                      {student.full_name?.charAt(0) || 'S'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-green-900">
                                      {student.full_name}
                                    </p>
                                    <p className="text-sm text-green-700">{student.student_id}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-green-600 mb-3 space-y-1">
                                  <div>Email: {student.email}</div>
                                  <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    <span>Active: {activeEnrollments.length}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <TrophyIcon className="h-3 w-3" />
                                    <span>Completed: {completedEnrollments.length}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DocumentTextIcon className="h-3 w-3" />
                                    <span>
                                      Certificates:{' '}
                                      {
                                        certificates.filter(
                                          (cert: Certificate) => cert.student_id === student.id,
                                        ).length
                                      }
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2 mb-3 flex-1">
                                  <p className="text-xs font-semibold text-green-800">
                                    Enrolled Courses:
                                  </p>
                                  <div className="space-y-1">
                                    {studentEnrollments.slice(0, 3).map((enrollment) => {
                                      const cert = certificates.find(
                                        (c: Certificate) =>
                                          c.student_id === student.id &&
                                          c.course_id === enrollment.course_id,
                                      )
                                      return (
                                        <div
                                          key={enrollment.id}
                                          className="text-xs bg-white/60 rounded px-2 py-1"
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="truncate flex-1">
                                              {enrollment.course?.title || 'Unknown Course'}
                                            </span>
                                            <Badge
                                              className={
                                                enrollment.status === 'completed'
                                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-200 ml-1'
                                                  : 'bg-green-100 text-green-800 border-green-200 ml-1'
                                              }
                                            >
                                              {enrollment.status === 'completed'
                                                ? 'Done'
                                                : 'Active'}
                                            </Badge>
                                          </div>
                                          {cert && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <button
                                                onClick={() => {
                                                  if (cert.file_url) {
                                                    window.open(
                                                      `${cert.file_url}?t=${Date.now()}`,
                                                      '_blank',
                                                    )
                                                  } else {
                                                    toast.error('Certificate PDF not found')
                                                  }
                                                }}
                                                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                                              >
                                                <EyeIcon className="h-3 w-3" />
                                                View Cert
                                              </button>
                                              <span className="text-gray-300">|</span>
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    toast.loading('Regenerating certificate...')
                                                    const { regenerateCertificate } =
                                                      await import('@/lib/api/certificates')
                                                    await regenerateCertificate(cert.id)
                                                    await loadDashboardData()
                                                    toast.dismiss()
                                                    toast.success('Certificate regenerated!')
                                                  } catch (error) {
                                                    toast.dismiss()
                                                    toast.error('Failed to regenerate certificate')
                                                  }
                                                }}
                                                className="text-[10px] text-orange-600 hover:text-orange-800 hover:underline flex items-center gap-0.5"
                                              >
                                                <PencilIcon className="h-3 w-3" />
                                                Reissue
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                    {studentEnrollments.length > 3 && (
                                      <p className="text-xs text-green-700 italic">
                                        +{studentEnrollments.length - 3} more
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEnrollmentModal(student)}
                                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold mt-auto"
                                >
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  Manage Enrollments
                                </Button>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Registered Students */}
              {activeStudentsView === 'registered' && (
                <Card
                  data-section="registered-students"
                  className="border-0 shadow-xl bg-white/70 backdrop-blur-sm scroll-mt-32"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Registered Students</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {allStudents.length === 0 ? (
                      <div className="text-center py-12">
                        <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No registered students
                        </h3>
                        <p className="text-gray-600">
                          Students with EYG IDs will appear here once they register.
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allStudents.map((student) => {
                          const studentEnrollments = enrollments.filter(
                            (e) => e.student_id === student.id,
                          )
                          const activeEnrollments = studentEnrollments.filter(
                            (e) => e.status === 'approved' || e.status === 'completed',
                          )

                          return (
                            <div
                              key={student.id}
                              className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                            >
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold">
                                    {student.full_name?.charAt(0) || 'S'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-blue-900">{student.full_name}</p>
                                  <p className="text-sm text-blue-700">{student.student_id}</p>
                                </div>
                              </div>
                              <div className="text-xs text-blue-600 mb-3 space-y-1">
                                <div>Email: {student.email}</div>
                                <div>Enrollments: {activeEnrollments.length}</div>
                                <div>
                                  Completed:{' '}
                                  {
                                    studentEnrollments.filter((e) => e.status === 'completed')
                                      .length
                                  }
                                </div>
                              </div>
                              {/* Consent Status Badge */}
                              <div className="mb-3">
                                <ConsentStatusBadge
                                  consentGiven={
                                    studentConsents.get(student.id)?.consent_given || false
                                  }
                                  withdrawn={studentConsents.get(student.id)?.withdrawn || false}
                                  size="sm"
                                  showLabel={true}
                                  onClick={async () => {
                                    const consent = await getStudentConsent(student.id)
                                    if (consent) {
                                      setSelectedConsentForAudit(consent)
                                      setSelectedStudentNameForAudit(student.full_name || 'Unknown')
                                      setShowConsentAudit(true)
                                    } else {
                                      toast.error('No consent record found for this student')
                                    }
                                  }}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEnrollmentModal(student)}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                              >
                                <UserIcon className="h-4 w-4 mr-1" />
                                Manage Enrollments
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Batch Enrollment Helper */}
              {activeStudentsView === 'registered' && (
                <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <QueueListIcon className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold text-purple-900">
                        Quick Enrollment Guide
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm text-purple-800">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Create or select a batch</p>
                          <p className="text-purple-700">
                            Go to Batches tab to create new batches for your courses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Enroll students manually</p>
                          <p className="text-purple-700">
                            Add registered students to batches - only enrolled students can receive
                            certificates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Complete batch and issue certificates</p>
                          <p className="text-purple-700">
                            Mark batch as completed when course is finished, then issue certificates
                            to all students
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Close students motion.div */}
            </motion.div>
          )}
          {/* Batch Certificate Management View */}
          {activeView === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                    Certificate Management Center
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Issue certificates to students in your courses and batches
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={() => {
                      // Collect all eligible enrollments across all courses
                      const allEligible = enrollments
                        .filter((enrollment) => enrollment.status === 'completed')
                        .filter((enrollment) => {
                          // Check if certificate already exists for this enrollment
                          return !certificates.some(
                            (cert) =>
                              cert.student_id === enrollment.student_id &&
                              cert.course_id === enrollment.course_id,
                          )
                        })
                        .map((enrollment) => enrollment.id)

                      if (allEligible.length === 0) {
                        toast.error('No eligible students found for certificate issuance')
                        return
                      }

                      setBulkEligibleEnrollments(allEligible)
                      setShowBulkTemplateModal(true)
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Bulk Issue Certificates</span>
                    <span className="sm:hidden">Bulk</span>
                  </Button>
                </div>
              </div>

              {/* Certificate Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-900">
                      {stats.completedBatches}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-700">Completed Batches</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-orange-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-900">
                      {stats.batchesReadyForCertificates}
                    </div>
                    <div className="text-xs sm:text-sm text-orange-700">Ready for Certificates</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                    <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600 mx-auto mb-2 sm:mb-3" />
                    <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-900">
                      {stats.certificatesIssued}
                    </div>
                    <div className="text-xs sm:text-sm text-green-700">Total Issued</div>
                  </CardContent>
                </Card>
                <Card
                  className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    if (allTemplates.length > 0) {
                      setCurrentTemplateIndex(0)
                      setShowTemplatePreviewModal(true)
                    }
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <DocumentTextIcon className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-purple-900">{allTemplates.length}</div>
                    <div className="text-sm text-purple-700">Available Templates</div>
                  </CardContent>
                </Card>
              </div>

              {/* Course-Based Certificate Management */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpenIcon className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Course-Based Certificate Issuance</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Issue certificates to completed students by course
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No courses available
                      </h3>
                      <p className="text-gray-600">
                        Create courses first to issue certificates to students.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map((course) => {
                        const courseEnrollments = enrollments.filter(
                          (e) => e.course_id === course.id,
                        )
                        const completedEnrollments = courseEnrollments.filter(
                          (e) => e.status === 'completed',
                        )
                        const certificatesNotIssued = completedEnrollments.filter(
                          (e) =>
                            !certificates.some(
                              (cert) =>
                                cert.student_id === e.student_id && cert.course_id === e.course_id,
                            ),
                        )

                        return (
                          <div
                            key={course.id}
                            className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-start space-x-4 mb-4">
                              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpenIcon className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {course.title}
                                </h4>
                                <div
                                  className="text-sm text-gray-600 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(course.description || ''),
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Enrolled:</span>
                                <span className="font-medium text-gray-900">
                                  {courseEnrollments.length}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Completed:</span>
                                <span className="font-medium text-green-700">
                                  {completedEnrollments.length}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Certificates Pending:</span>
                                <span className="font-medium text-orange-600">
                                  {certificatesNotIssued.length}
                                </span>
                              </div>
                            </div>

                            {certificatesNotIssued.length > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const eligibleIds = certificatesNotIssued.map((e) => e.id)
                                  setBulkEligibleEnrollments(eligibleIds)
                                  setShowBulkTemplateModal(true)
                                }}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                              >
                                <TrophyIcon className="h-4 w-4 mr-2" />
                                Issue {certificatesNotIssued.length} Certificate
                                {certificatesNotIssued.length !== 1 ? 's' : ''}
                              </Button>
                            ) : completedEnrollments.length > 0 ? (
                              <div className="text-center py-2">
                                <span className="text-sm text-green-600 font-medium">
                                  ✓ All certificates issued
                                </span>
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <span className="text-sm text-gray-500">No completed students</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Batch-Based Certificate Management */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Batch-Based Certificate Issuance</h3>
                    </div>
                    <p className="text-sm text-gray-600">Issue certificates to entire batches</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {batches.length === 0 ? (
                    <div className="text-center py-8">
                      <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No batches created</h3>
                      <p className="text-gray-600">
                        Create batches first to manage group certificate issuance.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {batches.map((batch) => {
                        const isCompleted = batch.status === 'completed'
                        const certificatesIssued = batch.certificates_issued

                        return (
                          <div
                            key={batch.id}
                            className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                              certificatesIssued
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                : isCompleted
                                  ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start space-x-4 mb-4">
                              <div
                                className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  certificatesIssued
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                    : isCompleted
                                      ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                                      : 'bg-gradient-to-r from-gray-400 to-slate-500'
                                }`}
                              >
                                {certificatesIssued ? (
                                  <TrophyIcon className="h-6 w-6 text-white" />
                                ) : (
                                  <UserGroupIcon className="h-6 w-6 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {batch.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Course: {batch.course?.title || 'No course assigned'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Status:{' '}
                                  {batch.status
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Students:</span>
                                <span className="font-medium text-gray-900">
                                  {batch.student_count || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Progress:</span>
                                <span className="font-medium text-blue-700">
                                  {batch.progress_percentage || 0}%
                                </span>
                              </div>
                            </div>

                            {certificatesIssued ? (
                              <div className="text-center py-2">
                                <span className="text-sm text-green-600 font-medium">
                                  ✓ Certificates issued
                                </span>
                              </div>
                            ) : isCompleted ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBatchForCertificate(batch.id)
                                  setShowBatchCertificateModal(true)
                                }}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                              >
                                <TrophyIcon className="h-4 w-4 mr-2" />
                                Issue Batch Certificates
                              </Button>
                            ) : (
                              <div className="text-center py-2">
                                <span className="text-sm text-gray-500">Batch not completed</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Students Ready for Certificates */}
              {completedBatchStudents.length > 0 ? (
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-6 w-6 text-orange-600" />
                      <h3 className="text-lg font-semibold">
                        Students Ready for Certificate Issuance
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {completedBatchStudents.map((student) => (
                        <div
                          key={`${student.batch_id}-${student.id}`}
                          className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200"
                        >
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-orange-900">{student.name}</p>
                              <p className="text-xs text-orange-700">{student.email}</p>
                            </div>
                            <div className="text-xs text-orange-600 space-y-1 w-full">
                              <div className="bg-orange-100 rounded p-2">
                                <div>Batch: {student.batch_name}</div>
                                <div>Course: {student.course_title}</div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleIndividualCertificate(student)}
                              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                            >
                              <TrophyIcon className="h-4 w-4 mr-1" />
                              Issue Certificate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No students ready for certificates
                    </h3>
                    <p className="text-gray-600">
                      Students from completed batches will appear here when they're ready for
                      certificate issuance.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Batches with Certificates Already Issued */}
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrophyIcon className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Batches with Certificates Issued</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {batches.filter((batch) => batch.certificates_issued).length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No batch certificates issued yet
                      </h3>
                      <p className="text-gray-600">
                        Batches with issued certificates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {batches
                        .filter((batch) => batch.certificates_issued)
                        .map((batch) => (
                          <div
                            key={batch.id}
                            className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                <TrophyIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-green-900">{batch.name}</p>
                                <p className="text-sm text-green-700">
                                  Course: {batch.course?.title || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-green-600 mb-3 space-y-1">
                              <div>Students: {batch.student_count || 0}</div>
                              <div>Certificates Issued: {formatDate(batch.updated_at)}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              View Certificates
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Batch Management View */}
          {activeView === 'batches' && (
            <motion.div
              key="batches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-8"
            >
              <BatchManagementContent
                teacherId={user?.id}
                canAccess={canAccess}
                initialBatches={batches}
                onBatchUpdate={loadDashboardData}
              />
            </motion.div>
          )}

          {/* Enhanced Analytics View */}
          {activeView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-12 pt-8"
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-center space-y-3 sm:space-y-4 lg:space-y-6"
              >
                <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Teaching Analytics
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
                  Track your performance and student engagement with detailed insights
                </p>
              </motion.div>
              {/* Enhanced Performance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8">
                {[
                  {
                    title: 'Rating System',
                    value: 'Coming Soon',
                    icon: StarIcon,
                    gradient: 'from-yellow-500 via-orange-500 to-red-500',
                    bgGradient: 'from-yellow-50 via-orange-100 to-red-100',
                    delay: 0.1,
                  },
                  {
                    title: 'Completion Rate',
                    value:
                      enrollments.length > 0
                        ? Math.round(
                            (enrollments.filter((e) => e.status === 'completed').length /
                              enrollments.length) *
                              100,
                          ) + '%'
                        : '0%',
                    icon: CheckCircleIcon,
                    gradient: 'from-green-500 via-emerald-600 to-teal-600',
                    bgGradient: 'from-green-50 via-emerald-100 to-teal-100',
                    delay: 0.2,
                  },
                  {
                    title: 'Avg Students/Course',
                    value: Math.round(stats.totalStudents / stats.totalCourses) || 0,
                    icon: UserGroupIcon,
                    gradient: 'from-purple-500 via-violet-600 to-indigo-600',
                    bgGradient: 'from-purple-50 via-violet-100 to-indigo-100',
                    delay: 0.3,
                  },
                ].map((metric) => (
                  <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: metric.delay,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 100,
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="group"
                  >
                    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                      />
                      <CardContent className="p-4 sm:p-6 lg:p-8 relative">
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-2 sm:space-y-3 min-w-0">
                            <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                              {metric.title}
                            </p>
                            <motion.p
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: metric.delay + 0.2 }}
                              className="text-lg sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                            >
                              {typeof metric.value === 'string'
                                ? metric.value
                                : metric.value.toLocaleString()}
                            </motion.p>
                          </div>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: metric.delay + 0.3,
                              type: 'spring',
                              stiffness: 200,
                            }}
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-r ${metric.gradient} rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex-shrink-0`}
                          >
                            <metric.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                          </motion.div>
                        </div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: metric.delay + 0.5, duration: 1 }}
                          className="mt-3 sm:mt-4 lg:mt-6"
                        >
                          <div className="h-1 sm:h-1.5 lg:h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '85%' }}
                              transition={{ delay: metric.delay + 0.7, duration: 1.5 }}
                              className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full`}
                            />
                          </div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {/* Enhanced Course Performance */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="space-y-16"
              >
                <div className="text-center space-y-2 sm:space-y-3 lg:space-y-6">
                  <h3 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Course Performance Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Detailed insights into each of your courses
                  </p>
                </div>
                <div className="grid gap-3 sm:gap-4 lg:gap-8">
                  {courses.map((course, index) => {
                    const courseEnrollments = enrollments.filter((e) => e.course_id === course.id)
                    const completionRate =
                      courseEnrollments.length > 0
                        ? Math.round(
                            (courseEnrollments.filter((e) => e.status === 'completed').length /
                              courseEnrollments.length) *
                              100,
                          )
                        : 0
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        className="group"
                      >
                        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <CardContent className="p-4 sm:p-6 lg:p-8 relative">
                            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                              <div className="space-y-1 min-w-0">
                                <h4 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 truncate">
                                  {course.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Course #{course.course_number}
                                </p>
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="flex items-center gap-1 flex-shrink-0"
                              >
                                <Badge
                                  className={`text-xs sm:text-sm font-medium px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 whitespace-nowrap ${
                                    completionRate >= 80
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                      : completionRate >= 60
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                                  }`}
                                >
                                  {completionRate}%
                                </Badge>
                              </motion.div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6">
                              {[
                                { label: 'Enrolled', value: courseEnrollments.length, icon: '👥' },
                                {
                                  label: 'Completed',
                                  value: courseEnrollments.filter((e) => e.status === 'completed')
                                    .length,
                                  icon: '✅',
                                },
                                {
                                  label: 'Certificates',
                                  value: courseEnrollments.filter((e) =>
                                    hasCertificate(e.student_id, e.course_id),
                                  ).length,
                                  icon: '🏆',
                                },
                              ].map((stat, statIndex) => (
                                <motion.div
                                  key={stat.label}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.8 + index * 0.1 + statIndex * 0.05 }}
                                  className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-center border border-white/30 hover:border-white/50 transition-all duration-300"
                                >
                                  <div className="text-base sm:text-lg lg:text-2xl mb-1">
                                    {stat.icon}
                                  </div>
                                  <div className="text-sm sm:text-base lg:text-2xl font-bold text-gray-900 mb-0.5">
                                    {stat.value}
                                  </div>
                                  <div className="text-xs text-gray-600 font-medium hidden sm:block">
                                    {stat.label}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            {/* Progress Bar */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 1 + index * 0.1, duration: 1 }}
                              className="mt-4 sm:mt-6 lg:mt-8"
                            >
                              <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                  Progress
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-gray-900">
                                  {completionRate}%
                                </span>
                              </div>
                              <div className="h-1.5 sm:h-2 lg:h-3 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${completionRate}%` }}
                                  transition={{ delay: 1.2 + index * 0.1, duration: 1.5 }}
                                  className={`h-full rounded-full ${
                                    completionRate >= 80
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                      : completionRate >= 60
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600'
                                  }`}
                                />
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Attendance Tab */}
          {activeView === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AttendanceManagement />
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                <h2 className="text-base sm:text-lg lg:text-3xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                  Account Settings ⚙️
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-2">
                  Manage your account preferences and information
                </p>
              </div>
              {/* Account Settings Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-white/20">
                <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                    <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-gray-600 flex-shrink-0" />
                    <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-gray-900">
                      Account Information
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{user?.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Teacher Code</label>
                        <p className="text-gray-900 font-semibold">
                          {user?.teacher_code || 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{teacherProfile?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">
                          {teacherProfile?.date_of_birth
                            ? new Date(teacherProfile.date_of_birth).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Address Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      Address Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Street Address</label>
                        <p className="text-gray-900">
                          {teacherProfile?.address_line_1 || 'Not provided'}
                        </p>
                        {teacherProfile?.address_line_2 && (
                          <p className="text-gray-900">{teacherProfile.address_line_2}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Show city only if available */}
                        {teacherProfile?.city && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-gray-900">{teacherProfile.city}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-gray-900">
                            {teacherProfile?.state && teacherProfile?.country
                              ? getStateName(teacherProfile.country, teacherProfile.state) ||
                                teacherProfile.state
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                          <p className="text-gray-900">
                            {teacherProfile?.zip_code || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Country</label>
                          <p className="text-gray-900">
                            {teacherProfile?.country
                              ? getCountryName(teacherProfile.country) || teacherProfile.country
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Section */}
              <div className="mt-8">
                <DashboardComplianceSection
                  userId={user?.id || ''}
                  userRole="teacher"
                  compactView={false}
                  showNotifications={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Create Course Modal */}
      {showCreateCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center">
                    <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Create New Course</span>
                  </h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1 hidden sm:block">
                    Design your next educational masterpiece
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateCourse(false)
                    reset()
                    setLearningOutcomes([''])
                    setPrerequisites([''])
                    setTags([''])
                    setDetailedDescription('')
                    setSelectedCoverImage(null)
                    setSelectedVideoPreview(null)
                    setCoverImageCleared(false)
                    setVideoPreviewCleared(false)
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 ml-2 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(handleCreateCourse)} className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Course Title"
                        placeholder="Enter course title"
                        {...register('title')}
                        error={errors.title?.message}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Gurukul</label>
                      <select
                        {...register('gurukul_id')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="">Select Gurukul</option>
                        {gurukuls.map((gurukul) => (
                          <option key={gurukul.id} value={gurukul.id}>
                            {gurukul.name}
                          </option>
                        ))}
                      </select>
                      {errors.gurukul_id && (
                        <p className="text-sm text-red-600">{errors.gurukul_id.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Part (Optional){' '}
                        <span className="text-xs text-gray-500">(A, B, C, D, etc.)</span>
                      </label>
                      <Input
                        placeholder="A, B, C..."
                        {...register('part')}
                        maxLength={1}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 1)
                          setValue('part', value)
                        }}
                        error={errors.part?.message}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Course number will be auto-generated:
                        {watch('gurukul_id') &&
                        watch('title') &&
                        gurukuls.find((g) => g.id === watch('gurukul_id')) ? (
                          <span className="font-semibold ml-1">
                            {gurukuls
                              .find((g) => g.id === watch('gurukul_id'))
                              ?.name.replace(/[^a-zA-Z]/g, '')
                              .substring(0, 2)
                              .toUpperCase()}
                            {watch('title')
                              ?.replace(/[^a-zA-Z]/g, '')
                              .charAt(0)
                              .toUpperCase()}
                            #{watch('part') || ''}
                          </span>
                        ) : (
                          ' [Select gurukul and enter title]'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug{' '}
                        <span className="text-xs text-gray-500">(auto-generated from title)</span>
                      </label>
                      <Input
                        value={
                          !watch('slug') ? generateSlug(watch('title') || '') : watch('slug') || ''
                        }
                        onChange={(e) => setValue('slug', e.target.value)}
                        placeholder="course-title"
                        readOnly={!watch('title')}
                        error={errors.slug?.message}
                        className={`text-sm ${!watch('title') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                      {slugError && <p className="text-sm text-red-600 mt-1">{slugError}</p>}
                      {watch('title') && !slugError && (
                        <p className="text-xs text-gray-500 mt-1">
                          {!watch('slug')
                            ? 'Auto-generated from title.'
                            : 'You can edit or reset to auto-generate.'}
                        </p>
                      )}
                      {watch('slug') && watch('title') && !slugError && (
                        <button
                          type="button"
                          onClick={() => setValue('slug', '')}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Reset to auto-generate
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Level</label>
                      <select
                        {...register('level')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="elementary">Elementary (4-7 years)</option>
                        <option value="basic">Basic (8-11 years)</option>
                        <option value="intermediate">Intermediate (12-15 years)</option>
                        <option value="advanced">Advanced (16-19 years)</option>
                      </select>
                      {errors.level && (
                        <p className="text-sm text-red-600">{errors.level.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-green-600" />
                    Course Descriptions
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                        placeholder="Brief overview for course listings (plain text or formatted text)"
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Detailed Description
                        </label>
                        <MediaSelectorButton
                          buttonText="Insert Media"
                          onSelect={(media) => {
                            if (media.length > 0) {
                              const file = media[0]
                              let embedCode = ''
                              if (file.file_type.startsWith('image/')) {
                                embedCode = `<img src="${file.file_url}" alt="${file.original_filename}" style="max-width: 100%; height: auto;" />`
                              } else if (file.file_type.startsWith('video/')) {
                                embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${file.file_url}" type="${file.file_type}" /></video>`
                              }
                              setDetailedDescription((detailedDescription || '') + embedCode)
                            }
                          }}
                        />
                      </div>
                      <SafeReactQuill
                        key="course-description-editor"
                        value={detailedDescription}
                        onChange={setDetailedDescription}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Comprehensive course description with formatting (rich text editor)..."
                        className="bg-white text-sm"
                        style={{ minHeight: '200px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Cog6ToothIcon className="h-4 w-4 mr-2 text-orange-600" />
                    Course Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Method
                      </label>
                      <select
                        {...register('delivery_method')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Online Only</option>
                        <option value="physical">In-person Only</option>
                      </select>
                      {errors.delivery_method && (
                        <p className="text-sm text-red-600">{errors.delivery_method.message}</p>
                      )}
                    </div>
                    <Input
                      label="Duration (weeks)"
                      type="number"
                      placeholder="6"
                      {...register('duration_weeks', { valueAsNumber: true })}
                      error={errors.duration_weeks?.message}
                    />
                    <Input
                      label="Duration (hours)"
                      type="number"
                      placeholder="24"
                      {...register('duration_hours', { valueAsNumber: true })}
                      error={errors.duration_hours?.message}
                    />
                    <Input
                      label="Minimum Age"
                      type="number"
                      placeholder="8"
                      {...register('age_group_min', { valueAsNumber: true })}
                      error={errors.age_group_min?.message}
                    />
                    <Input
                      label="Maximum Age"
                      type="number"
                      placeholder="12"
                      {...register('age_group_max', { valueAsNumber: true })}
                      error={errors.age_group_max?.message}
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        {...register('currency')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    <Input
                      label="Course Price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('price', { valueAsNumber: true })}
                      error={errors.price?.message}
                    />
                    <Input
                      label="Maximum Students"
                      type="number"
                      placeholder="20"
                      {...register('max_students', { valueAsNumber: true })}
                      error={errors.max_students?.message}
                    />
                    <Input
                      label="Minimum Students"
                      type="number"
                      placeholder="10"
                      {...register('min_students', { valueAsNumber: true })}
                      error={errors.min_students?.message}
                    />
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2 text-purple-600" />
                      Prerequisites
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPrerequisite}
                      className="text-xs px-2 py-1"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={prereq}
                          onChange={(e) => updatePrerequisite(index, e.target.value)}
                          placeholder={`Prerequisite ${index + 1}`}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                        {prerequisites.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePrerequisite(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50 p-1"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <LightBulbIcon className="h-4 w-4 mr-2 text-yellow-600" />
                      Learning Outcomes
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLearningOutcome}
                      className="text-xs px-2 py-1"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => updateLearningOutcome(index, e.target.value)}
                          placeholder={`Learning outcome ${index + 1}`}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                        {learningOutcomes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLearningOutcome(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50 p-1"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-indigo-600" />
                      Tags
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTag}
                      className="text-xs px-2 py-1"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => updateTag(index, e.target.value)}
                          placeholder={`Tag ${index + 1}`}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                        {tags.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTag(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50 p-1"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Media & SEO */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <PhotoIcon className="h-4 w-4 mr-2 text-gray-600" />
                    Media & SEO (Optional)
                  </h3>
                  <div className="space-y-4">
                    <CourseImageSelector
                      coverImageUrl={selectedCoverImage?.file_url}
                      videoPreviewUrl={selectedVideoPreview?.file_url}
                      onCoverImageSelect={(files) => {
                        setSelectedCoverImage(files[0] || null)
                        if (!files[0]) {
                          setCoverImageCleared(true)
                        } else {
                          setCoverImageCleared(false)
                        }
                      }}
                      onVideoPreviewSelect={(files) => {
                        setSelectedVideoPreview(files[0] || null)
                        if (!files[0]) {
                          setVideoPreviewCleared(true)
                        } else {
                          setVideoPreviewCleared(false)
                        }
                      }}
                    />
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Meta Title"
                        placeholder="SEO title"
                        {...register('meta_title')}
                        error={errors.meta_title?.message}
                        className="text-sm"
                      />
                    </div>
                    <Input
                      label="Meta Description"
                      placeholder="SEO description"
                      {...register('meta_description')}
                      error={errors.meta_description?.message}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Course Settings */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 text-emerald-600" />
                    Course Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('includes_certificate')}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Include Certificate</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('featured')}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured Course</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('is_active')}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Course</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateCourse(false)
                      reset()
                      setLearningOutcomes([''])
                      setPrerequisites([''])
                      setTags([''])
                      setDetailedDescription('')
                      setSelectedCoverImage(null)
                      setSelectedVideoPreview(null)
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingCourse}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                  >
                    {savingCourse ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Course Modal */}
      {showEditCourse && editingCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center">
                    <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Edit Course</span>
                  </h2>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-1 hidden sm:block">
                    Update course information
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditCourse(false)
                    setEditingCourse(null)
                    reset()
                    setLearningOutcomes([''])
                    setPrerequisites([''])
                    setTags([''])
                    setDetailedDescription('')
                    setSelectedCoverImage(null)
                    setSelectedVideoPreview(null)
                    setCoverImageCleared(false)
                    setVideoPreviewCleared(false)
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 ml-2 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit(handleEditCourse, (errors) => {
                console.log('Form validation errors:', errors)
                toast.error('Please fix the form errors before updating')
              })}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <span className="font-semibold mr-2">Editing:</span> {editingCourse.title} (
                    {editingCourse.course_number})
                  </p>
                </div>

                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Course Title"
                        placeholder="Enter course title"
                        {...register('title')}
                        error={errors.title?.message}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Gurukul</label>
                      <select
                        {...register('gurukul_id')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="">Select Gurukul</option>
                        {gurukuls.map((gurukul) => (
                          <option key={gurukul.id} value={gurukul.id}>
                            {gurukul.name}
                          </option>
                        ))}
                      </select>
                      {errors.gurukul_id && (
                        <p className="text-sm text-red-600">{errors.gurukul_id.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Part (Optional){' '}
                        <span className="text-xs text-gray-500">(A, B, C, D, etc.)</span>
                      </label>
                      <Input
                        placeholder="A, B, C..."
                        {...register('part')}
                        maxLength={1}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 1)
                          setValue('part', value)
                        }}
                        error={errors.part?.message}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Course number will be auto-regenerated:
                        {watch('gurukul_id') &&
                        watch('title') &&
                        gurukuls.find((g) => g.id === watch('gurukul_id')) ? (
                          <span className="font-semibold ml-1">
                            {gurukuls
                              .find((g) => g.id === watch('gurukul_id'))
                              ?.name.replace(/[^a-zA-Z]/g, '')
                              .substring(0, 2)
                              .toUpperCase()}
                            {watch('title')
                              ?.replace(/[^a-zA-Z]/g, '')
                              .charAt(0)
                              .toUpperCase()}
                            #{watch('part') || ''}
                          </span>
                        ) : (
                          ' [Select gurukul and enter title]'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug{' '}
                        <span className="text-xs text-gray-500">(auto-generated from title)</span>
                      </label>
                      <Input
                        value={
                          !watch('slug') ? generateSlug(watch('title') || '') : watch('slug') || ''
                        }
                        onChange={(e) => setValue('slug', e.target.value)}
                        placeholder="course-title"
                        readOnly={!watch('title')}
                        error={errors.slug?.message}
                        className={`text-sm ${!watch('title') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                      {slugError && <p className="text-sm text-red-600 mt-1">{slugError}</p>}
                      {watch('title') && !slugError && (
                        <p className="text-xs text-gray-500 mt-1">
                          {!watch('slug')
                            ? 'Auto-generated from title.'
                            : 'You can edit or reset to auto-generate.'}
                        </p>
                      )}
                      {watch('slug') && watch('title') && !slugError && (
                        <button
                          type="button"
                          onClick={() => setValue('slug', '')}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Reset to auto-generate
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Level</label>
                      <select
                        {...register('level')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="elementary">Elementary (4-7 years)</option>
                        <option value="basic">Basic (8-11 years)</option>
                        <option value="intermediate">Intermediate (12-15 years)</option>
                        <option value="advanced">Advanced (16-19 years)</option>
                      </select>
                      {errors.level && (
                        <p className="text-sm text-red-600">{errors.level.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-green-600" />
                    Course Descriptions
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                        placeholder="Brief overview for course listings (plain text or formatted text)"
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Detailed Description
                        </label>
                        <MediaSelectorButton
                          buttonText="Insert Media"
                          onSelect={(media) => {
                            if (media.length > 0) {
                              const file = media[0]
                              let embedCode = ''
                              if (file.file_type.startsWith('image/')) {
                                embedCode = `<img src="${file.file_url}" alt="${file.original_filename}" style="max-width: 100%; height: auto;" />`
                              } else if (file.file_type.startsWith('video/')) {
                                embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${file.file_url}" type="${file.file_type}" /></video>`
                              }
                              setDetailedDescription((detailedDescription || '') + embedCode)
                            }
                          }}
                        />
                      </div>
                      <SafeReactQuill
                        key="course-edit-description-editor"
                        value={detailedDescription}
                        onChange={setDetailedDescription}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Comprehensive course description with formatting (rich text editor)..."
                        className="bg-white text-sm"
                        style={{ minHeight: '200px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Cog6ToothIcon className="h-4 w-4 mr-2 text-orange-600" />
                    Course Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Method
                      </label>
                      <select
                        {...register('delivery_method')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="hybrid">Hybrid</option>
                        <option value="remote">Online Only</option>
                        <option value="physical">In-person Only</option>
                      </select>
                      {errors.delivery_method && (
                        <p className="text-sm text-red-600">{errors.delivery_method.message}</p>
                      )}
                    </div>
                    <Input
                      label="Duration (weeks)"
                      type="number"
                      placeholder="6"
                      {...register('duration_weeks', { valueAsNumber: true })}
                      error={errors.duration_weeks?.message}
                    />
                    <Input
                      label="Duration (hours)"
                      type="number"
                      placeholder="24"
                      {...register('duration_hours', { valueAsNumber: true })}
                      error={errors.duration_hours?.message}
                    />
                    <Input
                      label="Minimum Age"
                      type="number"
                      placeholder="8"
                      {...register('age_group_min', { valueAsNumber: true })}
                      error={errors.age_group_min?.message}
                    />
                    <Input
                      label="Maximum Age"
                      type="number"
                      placeholder="12"
                      {...register('age_group_max', { valueAsNumber: true })}
                      error={errors.age_group_max?.message}
                    />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        {...register('currency')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors text-sm py-2 px-3"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    <Input
                      label="Course Price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('price', { valueAsNumber: true })}
                      error={errors.price?.message}
                    />
                    <Input
                      label="Maximum Students"
                      type="number"
                      placeholder="20"
                      {...register('max_students', { valueAsNumber: true })}
                      error={errors.max_students?.message}
                    />
                    <Input
                      label="Minimum Students"
                      type="number"
                      placeholder="10"
                      {...register('min_students', { valueAsNumber: true })}
                      error={errors.min_students?.message}
                    />
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2 text-purple-600" />
                      Prerequisites
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPrerequisite}
                      className="text-xs px-2 py-1"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={prereq}
                          onChange={(e) => updatePrerequisite(index, e.target.value)}
                          placeholder={`Prerequisite ${index + 1}`}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                        {prerequisites.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePrerequisite(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50 p-1"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <LightBulbIcon className="h-4 w-4 mr-2 text-yellow-600" />
                      Learning Outcomes
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLearningOutcome}
                      className="text-xs px-2 py-1"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => updateLearningOutcome(index, e.target.value)}
                          placeholder={`Learning outcome ${index + 1}`}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                        {learningOutcomes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLearningOutcome(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50 p-1"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-indigo-600" />
                      Tags
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTag}
                      className="text-xs px-2 py-1"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => updateTag(index, e.target.value)}
                          placeholder={`Tag ${index + 1}`}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                        {tags.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTag(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50 p-1"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Media & SEO */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <PhotoIcon className="h-4 w-4 mr-2 text-gray-600" />
                    Media & SEO (Optional)
                  </h3>
                  <div className="space-y-4">
                    <CourseImageSelector
                      coverImageUrl={selectedCoverImage?.file_url}
                      videoPreviewUrl={selectedVideoPreview?.file_url}
                      onCoverImageSelect={(files) => {
                        setSelectedCoverImage(files[0] || null)
                        if (!files[0]) {
                          setCoverImageCleared(true)
                        } else {
                          setCoverImageCleared(false)
                        }
                      }}
                      onVideoPreviewSelect={(files) => {
                        setSelectedVideoPreview(files[0] || null)
                        if (!files[0]) {
                          setVideoPreviewCleared(true)
                        } else {
                          setVideoPreviewCleared(false)
                        }
                      }}
                    />
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Meta Title"
                        placeholder="SEO title"
                        {...register('meta_title')}
                        error={errors.meta_title?.message}
                        className="text-sm"
                      />
                    </div>
                    <Input
                      label="Meta Description"
                      placeholder="SEO description"
                      {...register('meta_description')}
                      error={errors.meta_description?.message}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Course Settings */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 text-emerald-600" />
                    Course Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('includes_certificate')}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Include Certificate</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('featured')}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured Course</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('is_active')}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Course</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditCourse(false)
                      setEditingCourse(null)
                      reset()
                      setLearningOutcomes([''])
                      setPrerequisites([''])
                      setTags([''])
                      setDetailedDescription('')
                      setSelectedCoverImage(null)
                      setSelectedVideoPreview(null)
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingCourse || !!slugError}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                    title={slugError ? 'Fix slug error before updating' : 'Update course'}
                    onClick={() => {
                      console.log('Update button clicked', {
                        savingCourse,
                        slugError,
                        editingCourse,
                      })
                    }}
                  >
                    {savingCourse ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Update Course
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Media Selector for ReactQuill Images */}
      {showImageSelector && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Image for Course Description</h3>
              <button
                onClick={() => {
                  setShowImageSelector(false)
                  // Refocus ReactQuill after closing modal
                  setTimeout(() => {
                    const quill = quillRef.current?.getEditor()
                    if (quill) {
                      quill.focus()
                    }
                  }, 100)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>
            <MediaSelector
              multiple={false}
              accept={['image']}
              compact={false}
              showUpload={true}
              onSelect={handleImageSelect}
              title="Select Image"
            />
          </div>
        </div>
      )}

      {/* Certificate Issuance Modal */}
      {showIssuanceModal && selectedEnrollmentForCert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Issue Certificate</h2>
                  <p className="text-gray-600">Select a template to issue the certificate</p>
                </div>
                <button
                  onClick={() => {
                    setShowIssuanceModal(false)
                    setSelectedEnrollmentForCert(null)
                    setSelectedTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {certificateAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
                  <p className="text-gray-600 mb-6">
                    No certificate templates have been assigned to you by the administrator. Please
                    contact your administrator to assign certificate templates before you can issue
                    certificates.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowIssuanceModal(false)
                        setSelectedEnrollmentForCert(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Available Templates
                    </h3>
                    <div className="grid gap-4">
                      {certificateAssignments.map((assignment) => {
                        const isSelected = selectedTemplate === assignment.template_id

                        return (
                          <div
                            key={assignment.id}
                            onClick={() => setSelectedTemplate(assignment.template_id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900">
                                    {assignment.template?.name || 'Certificate Template'}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {assignment.template?.type || 'Student'} Certificate
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {selectedTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-sm text-blue-800">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          Template selected - You can preview it before issuing
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowIssuanceModal(false)
                        setSelectedEnrollmentForCert(null)
                        setSelectedTemplate(null)
                      }}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!selectedTemplate || !selectedEnrollmentForCert) return

                        try {
                          toast.loading('Generating preview...')
                          // Get the enrollment details
                          const enrollment = enrollments.find(
                            (e) => e.id === selectedEnrollmentForCert,
                          )
                          if (!enrollment) return

                          // Get the template
                          const template = certificateAssignments.find(
                            (a) => a.template_id === selectedTemplate,
                          )?.template
                          if (!template) return

                          // Generate preview data
                          const certificateData = {
                            studentName: enrollment.student?.full_name || 'Student Name',
                            studentId:
                              enrollment.student?.student_id ||
                              enrollment.student?.full_name
                                ?.split(' ')
                                .map((n) => n.charAt(0))
                                .join('')
                                .toUpperCase() + Math.random().toString().slice(-3) ||
                              'STU001',
                            courseName: enrollment.course?.title || 'Course Name',
                            courseId:
                              enrollment.course?.course_number ||
                              `C${Math.random().toString().slice(-3)}`,
                            gurukulName: enrollment.course?.gurukul?.name || 'eYogi Gurukul',
                            completionDate: enrollment.completed_at || new Date().toISOString(),
                            certificateNumber: `PREVIEW-${Date.now()}`,
                            verificationCode: 'PREVIEW',
                          }

                          // Generate preview
                          const previewUrl = await generateCertificatePreview(
                            certificateData,
                            template,
                          )

                          toast.dismiss()

                          // Open preview in new window
                          const previewWindow = window.open('', '_blank')
                          if (previewWindow) {
                            previewWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <title>Certificate Preview</title>
                                  <style>
                                    body { margin: 0; padding: 20px; background: #f3f4f6; }
                                    iframe { width: 100%; height: 90vh; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                    .header { text-align: center; margin-bottom: 20px; }
                                    h1 { color: #1f2937; }
                                    .note { color: #6b7280; font-style: italic; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h1>Certificate Preview</h1>
                                    <p class="note">This is a preview. The actual certificate will have a unique number.</p>
                                  </div>
                                  <iframe src="${previewUrl}"></iframe>
                                </body>
                              </html>
                            `)
                            previewWindow.document.close()
                          }
                        } catch (error) {
                          toast.dismiss()
                          console.error('Preview error:', error)
                          toast.error('Failed to generate preview')
                        }
                      }}
                      disabled={!selectedTemplate}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Preview Certificate
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedTemplate && selectedEnrollmentForCert) {
                          handleIssueCertificateWithTemplate(
                            selectedEnrollmentForCert,
                            selectedTemplate,
                          )
                        }
                      }}
                      disabled={!selectedTemplate}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrophyIcon className="h-4 w-4 mr-2" />
                      Issue Certificate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Certificate Viewing Modal */}
      {showCertificateModal && selectedCertificateEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-4xl mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Certificate Details</h2>
                <p className="text-gray-600">
                  Certificate for {selectedCertificateEnrollment.student?.full_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCertificateModal(false)
                  setSelectedCertificateEnrollment(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <TrophyIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-900">Certificate Issued</h3>
                    <p className="text-green-700">
                      Successfully completed {selectedCertificateEnrollment.course?.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCertificateEnrollment.student?.full_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Title
                    </label>
                    <p className="text-lg text-gray-900">
                      {selectedCertificateEnrollment.course?.title}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <p className="text-lg text-gray-900">
                      {formatDate(selectedCertificateEnrollment.updated_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Status
                    </label>
                    <Badge className="bg-green-600 text-white">Issued</Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date
                    </label>
                    <p className="text-lg text-gray-900">
                      {formatDate(selectedCertificateEnrollment.updated_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Email
                    </label>
                    <p className="text-lg text-gray-900">
                      {selectedCertificateEnrollment.student?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Certificate Actions
                    </h4>
                    <p className="text-gray-600">
                      This certificate has been successfully issued and is now available to the
                      student.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCertificateModal(false)
                        setSelectedCertificateEnrollment(null)
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-blue-600"
                      onClick={() => {
                        // Generate certificate download link
                        const certificateNumber = `CERT-${selectedCertificateEnrollment.updated_at?.replace(/[-:.]/g, '')}-${selectedCertificateEnrollment.id}`
                        const downloadUrl = `/certificates/${certificateNumber}.pdf`
                        setPdfUrl(downloadUrl)
                        setShowPdfModal(true)
                      }}
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      View Certificate PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="w-full max-w-6xl mx-4 bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Certificate Preview</h2>
                  <p className="text-gray-600 text-sm">
                    {selectedCertificateEnrollment?.student?.full_name} -{' '}
                    {selectedCertificateEnrollment?.course?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="text-gray-600 border-gray-300"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download
                </Button>
                <button
                  onClick={() => {
                    setShowPdfModal(false)
                    setPdfUrl(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
              <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                  className="w-full h-full border-0"
                  title="Certificate Preview"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Certificate generated and issued successfully</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPdfModal(false)
                    setPdfUrl(null)
                  }}
                >
                  Close
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-500 to-green-600"
                  onClick={() => {
                    // Copy certificate link to clipboard
                    navigator.clipboard.writeText(window.location.origin + pdfUrl)
                    toast.success('Certificate link copied to clipboard!')
                  }}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Template Selection Modal */}
      {showBulkTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Select Template for Bulk Certificate Issuance
                  </h2>
                  <p className="text-gray-600">
                    Choose a template to issue certificates for {bulkEligibleEnrollments.length}{' '}
                    eligible students
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBulkTemplateModal(false)
                    setBulkEligibleEnrollments([])
                    setSelectedTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {certificateAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
                  <p className="text-gray-600 mb-6">
                    No certificate templates have been assigned to you by the administrator. Please
                    contact your administrator to assign certificate templates before you can issue
                    certificates.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBulkTemplateModal(false)
                        setBulkEligibleEnrollments([])
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Available Templates
                    </h3>
                    <div className="grid gap-4">
                      {certificateAssignments.map((assignment) => {
                        const isSelected = selectedTemplate === assignment.template_id

                        return (
                          <div
                            key={assignment.id}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => setSelectedTemplate(assignment.template_id)}
                              >
                                <div className="flex items-center space-x-3 mb-2">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900">
                                    {assignment.template?.name || 'Certificate Template'}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  {assignment.template?.type || 'Student'} Certificate
                                </p>
                                <div className="text-xs text-gray-500">
                                  <p>
                                    Assigned to:{' '}
                                    {assignment.course?.title ||
                                      assignment.gurukul?.name ||
                                      'Direct assignment'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {selectedTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-sm text-blue-800">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          Template selected - You can preview it before bulk issuing
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBulkTemplateModal(false)
                        setBulkEligibleEnrollments([])
                        setSelectedTemplate(null)
                      }}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!selectedTemplate || bulkEligibleEnrollments.length === 0) return

                        try {
                          toast.loading('Generating preview...')
                          // Get first enrollment for preview
                          const firstEnrollmentId = bulkEligibleEnrollments[0]
                          const enrollment = enrollments.find((e) => e.id === firstEnrollmentId)
                          if (!enrollment) return

                          // Get the template
                          const template = certificateAssignments.find(
                            (a) => a.template_id === selectedTemplate,
                          )?.template
                          if (!template) return

                          // Generate preview data
                          const certificateData = {
                            studentName: enrollment.student?.full_name || 'Student Name',
                            studentId:
                              enrollment.student?.student_id ||
                              enrollment.student?.full_name
                                ?.split(' ')
                                .map((n) => n.charAt(0))
                                .join('')
                                .toUpperCase() + Math.random().toString().slice(-3) ||
                              'STU001',
                            courseName: enrollment.course?.title || 'Course Name',
                            courseId:
                              enrollment.course?.course_number ||
                              `C${Math.random().toString().slice(-3)}`,
                            gurukulName: enrollment.course?.gurukul?.name || 'eYogi Gurukul',
                            completionDate: enrollment.completed_at || new Date().toISOString(),
                            certificateNumber: `PREVIEW-${Date.now()}`,
                            verificationCode: 'PREVIEW',
                          }

                          // Generate preview
                          const previewUrl = await generateCertificatePreview(
                            certificateData,
                            template,
                          )

                          toast.dismiss()

                          // Open preview in new window
                          const previewWindow = window.open('', '_blank')
                          if (previewWindow) {
                            previewWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <title>Certificate Preview</title>
                                  <style>
                                    body { margin: 0; padding: 20px; background: #f3f4f6; }
                                    iframe { width: 100%; height: 90vh; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                    .header { text-align: center; margin-bottom: 20px; }
                                    h1 { color: #1f2937; }
                                    .note { color: #6b7280; font-style: italic; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h1>Certificate Preview</h1>
                                    <p class="note">Preview for the first student. All ${bulkEligibleEnrollments.length} certificates will use this template.</p>
                                  </div>
                                  <iframe src="${previewUrl}"></iframe>
                                </body>
                              </html>
                            `)
                            previewWindow.document.close()
                          }
                        } catch (error) {
                          toast.dismiss()
                          console.error('Preview error:', error)
                          toast.error('Failed to generate preview')
                        }
                      }}
                      disabled={!selectedTemplate}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Preview Certificate
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedTemplate) {
                          handleBulkIssueCertificatesWithTemplate(selectedTemplate)
                        }
                      }}
                      disabled={!selectedTemplate}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrophyIcon className="h-4 w-4 mr-2" />
                      Issue {bulkEligibleEnrollments.length} Certificates
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Certificate Template Selection Modal */}
      {showBatchCertificateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Select Template for Batch Certificate Issuance
                  </h2>
                  <p className="text-gray-600">
                    Choose a template to issue certificates for all students in this batch
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBatchCertificateModal(false)
                    setSelectedBatchForCertificate(null)
                    setSelectedTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {certificateAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
                  <p className="text-gray-600 mb-6">
                    No certificate templates have been assigned to you by the administrator. Please
                    contact your administrator to assign certificate templates before you can issue
                    batch certificates.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBatchCertificateModal(false)
                        setSelectedBatchForCertificate(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Available Templates
                    </h3>
                    <div className="grid gap-4">
                      {certificateAssignments.map((assignment) => {
                        const isSelected = selectedTemplate === assignment.template_id

                        return (
                          <div
                            key={assignment.id}
                            onClick={() => setSelectedTemplate(assignment.template_id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900">
                                    {assignment.template?.name || 'Certificate Template'}
                                  </h4>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {assignment.template?.type || 'Student'} Certificate
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBatchCertificateModal(false)
                        setSelectedBatchForCertificate(null)
                        setSelectedTemplate(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedTemplate) {
                          handleIssueBatchCertificates(selectedTemplate)
                        }
                      }}
                      disabled={!selectedTemplate}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 disabled:opacity-50"
                    >
                      <TrophyIcon className="h-4 w-4 mr-2" />
                      Issue Batch Certificates
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreviewModal && allTemplates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-x-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Certificate Template Preview</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Template {currentTemplateIndex + 1} of {allTemplates.length}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTemplatePreviewModal(false)
                    setCurrentTemplateIndex(0)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
              {allTemplates[currentTemplateIndex] && (
                <div className="space-y-4">
                  {/* Template Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Template Name
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {allTemplates[currentTemplateIndex]?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Certificate Type
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {allTemplates[currentTemplateIndex]?.type || 'Certificate'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <p className="text-lg font-semibold text-green-600">
                          {allTemplates[currentTemplateIndex]?.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Template Type
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {allTemplates[currentTemplateIndex]?.template_data?.template_image
                            ? 'Image-based'
                            : 'Design-based'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Template Preview - Show image if available, otherwise show design preview */}
                  <div className="bg-white border-4 border-gray-300 rounded-lg p-0 overflow-hidden">
                    {allTemplates[currentTemplateIndex]?.template_data?.template_image ? (
                      <img
                        src={allTemplates[currentTemplateIndex]?.template_data?.template_image}
                        alt="Template Preview"
                        className="w-full h-auto rounded-lg"
                        style={{ minHeight: '600px', objectFit: 'contain' }}
                      />
                    ) : loadingPreview ? (
                      <div
                        className="w-full bg-gray-50 flex items-center justify-center"
                        style={{ minHeight: '600px' }}
                      >
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-gray-600">Generating preview...</p>
                        </div>
                      </div>
                    ) : templatePreviewUrl ? (
                      <img
                        src={templatePreviewUrl}
                        alt="Certificate Preview"
                        className="w-full h-auto rounded-lg"
                        style={{ minHeight: '600px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        className="w-full bg-gray-50 flex items-center justify-center"
                        style={{ minHeight: '600px' }}
                      >
                        <div className="text-center">
                          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No preview available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation and Actions Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentTemplateIndex > 0) {
                        setCurrentTemplateIndex(currentTemplateIndex - 1)
                      }
                    }}
                    disabled={currentTemplateIndex === 0}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {/* Template dots/indicators */}
                  <div className="flex items-center gap-1">
                    {allTemplates.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTemplateIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentTemplateIndex ? 'bg-purple-600 w-6' : 'bg-gray-300 w-2'
                        }`}
                        title={`Template ${index + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentTemplateIndex < allTemplates.length - 1) {
                        setCurrentTemplateIndex(currentTemplateIndex + 1)
                      }
                    }}
                    disabled={currentTemplateIndex === certificateAssignments.length - 1}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTemplatePreviewModal(false)
                    setCurrentTemplateIndex(0)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Management Modal */}
      {showEnrollmentModal && selectedStudentForEnrollment && (
        <EnrollmentManagementModal
          isOpen={showEnrollmentModal}
          student={selectedStudentForEnrollment}
          teacherCourses={courses}
          existingEnrollments={enrollments.filter(
            (e) => e.student_id === selectedStudentForEnrollment.id && e.status !== 'pending',
          )}
          pendingEnrollments={enrollments.filter(
            (e) => e.student_id === selectedStudentForEnrollment.id && e.status === 'pending',
          )}
          teacherId={user?.id || ''}
          certificates={certificates}
          onClose={() => {
            setShowEnrollmentModal(false)
            setSelectedStudentForEnrollment(null)
          }}
          onEnrollmentChange={() => {
            // Reload enrollments and refresh data
            loadDashboardData()
          }}
        />
      )}

      {/* Profile Edit Modal */}
      {isProfileModalOpen && user && teacherProfile && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={
            {
              ...user,
              // Override with data from teacherProfile which has the latest info
              phone: teacherProfile.phone,
              date_of_birth: teacherProfile.date_of_birth,
              address_line_1: teacherProfile.address_line_1,
              address_line_2: teacherProfile.address_line_2,
              city: teacherProfile.city,
              state: teacherProfile.state,
              zip_code: teacherProfile.zip_code,
              country: teacherProfile.country,
            } as Profile
          }
          onUpdate={() => {
            // Refresh user data after profile update
            window.location.reload()
          }}
        />
      )}

      {/* Consent Audit Modal */}
      {showConsentAudit && selectedConsentForAudit && (
        <ConsentAuditModal
          consent={selectedConsentForAudit}
          studentName={selectedStudentNameForAudit}
          userRole={
            user?.role as
              | 'student'
              | 'teacher'
              | 'admin'
              | 'business_admin'
              | 'super_admin'
              | 'parent'
          }
          onClose={() => {
            setShowConsentAudit(false)
            setSelectedConsentForAudit(null)
            setSelectedStudentNameForAudit('')
          }}
        />
      )}
    </div>
  )
}

// Enrollment Management Modal Component
interface EnrollmentManagementModalProps {
  isOpen: boolean
  student: ProfileWithAddress
  teacherCourses: Course[]
  existingEnrollments: Enrollment[]
  pendingEnrollments: Enrollment[]
  teacherId: string
  certificates: Certificate[]
  onClose: () => void
  onEnrollmentChange: () => void
}

const EnrollmentManagementModal: React.FC<EnrollmentManagementModalProps> = ({
  isOpen,
  student,
  teacherCourses,
  existingEnrollments,
  pendingEnrollments,
  teacherId, // eslint-disable-line @typescript-eslint/no-unused-vars
  certificates,
  onClose,
  onEnrollmentChange,
}) => {
  const [enrolling, setEnrolling] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  // Helper function to check if student has certificate for course
  const hasCertificate = (studentId: string, courseId: string): boolean => {
    return certificates.some((cert) => cert.student_id === studentId && cert.course_id === courseId)
  }

  const handleEnrollStudent = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course')
      return
    }

    // Check if student is already enrolled in this course (approved or completed)
    const alreadyEnrolled = existingEnrollments.some((e) => e.course_id === selectedCourseId)
    if (alreadyEnrolled) {
      toast.error('Student is already enrolled in this course')
      return
    }

    // Check if student has a pending enrollment in this course
    const hasPendingEnrollment = pendingEnrollments.some((e) => e.course_id === selectedCourseId)
    if (hasPendingEnrollment) {
      toast.error('Student already has a pending enrollment in this course')
      return
    }

    setEnrolling(true)
    try {
      await enrollStudentByTeacher(selectedCourseId, student.id)
      toast.success('Student enrolled successfully and auto-approved!')
      onEnrollmentChange()
      setSelectedCourseId('')
    } catch (error) {
      console.error('Error enrolling student:', error)
      toast.error('Failed to enroll student')
    } finally {
      setEnrolling(false)
    }
  }

  // Get courses student is not enrolled in (excluding both approved and pending)
  const availableCourses = teacherCourses.filter(
    (course) =>
      !existingEnrollments.some((e) => e.course_id === course.id) &&
      !pendingEnrollments.some((e) => e.course_id === course.id),
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Enrollments - {student.full_name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{student.email}</p>
        </div>

        <div className="p-6">
          {/* Pending Enrollments */}
          {pendingEnrollments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-yellow-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-yellow-600" />
                Pending Enrollments
              </h3>
              <div className="space-y-3">
                {pendingEnrollments.map((enrollment) => {
                  const course = teacherCourses.find((c) => c.id === enrollment.course_id)
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {course?.title || 'Unknown Course'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            Status:{' '}
                            <span className="capitalize text-yellow-600 font-medium">Pending</span>
                          </span>
                          <span>
                            Requested: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Existing Enrollments */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Enrollments</h3>
            {existingEnrollments.length > 0 ? (
              <div className="space-y-3">
                {existingEnrollments.map((enrollment) => {
                  const course = teacherCourses.find((c) => c.id === enrollment.course_id)
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {course?.title || 'Unknown Course'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            Status:{' '}
                            <span
                              className={`capitalize ${enrollment.status === 'completed' ? 'text-green-600' : enrollment.status === 'approved' ? 'text-blue-600' : 'text-yellow-600'}`}
                            >
                              {enrollment.status}
                            </span>
                          </span>
                          <span>
                            Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasCertificate(enrollment.student_id, enrollment.course_id) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <TrophyIcon className="h-3 w-3 mr-1" />
                            Certified
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No enrollments found.</p>
            )}
          </div>

          {/* Enroll in New Course */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enroll in New Course</h3>
            {availableCourses.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a course...</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_number} - {course.title} ({course.level})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleEnrollStudent}
                  disabled={!selectedCourseId || enrolling}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Student'}
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No available courses. Student is enrolled in all your courses.
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline" className="px-6">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Edit Students Modal Component
interface EditStudentsModalProps {
  batch: Batch | null
  allCourseStudents: { id: string; full_name: string; email: string; isInBatch: boolean }[]
  loading: boolean
  onClose: () => void
  onToggleStudent: (studentId: string, shouldAdd: boolean) => Promise<void>
}

const EditStudentsModal: React.FC<EditStudentsModalProps> = ({
  batch,
  allCourseStudents,
  loading,
  onClose,
  onToggleStudent,
}) => {
  const [processingStudents, setProcessingStudents] = useState<Set<string>>(new Set())

  const handleToggleStudent = async (studentId: string, currentlyInBatch: boolean) => {
    setProcessingStudents((prev) => new Set(prev).add(studentId))
    try {
      // If currently in batch, remove them; if not in batch, add them
      await onToggleStudent(studentId, !currentlyInBatch)
    } finally {
      setProcessingStudents((prev) => {
        const newSet = new Set(prev)
        newSet.delete(studentId)
        return newSet
      })
    }
  }

  if (!batch) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Students - {batch.name}</h2>
          <p className="text-sm text-gray-600 mt-1">Course: {batch.course?.title}</p>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading student data...</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Course Students ({allCourseStudents.length})
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Check students to include them in this batch. Unchecked students will be removed.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allCourseStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No students enrolled in this course
                  </p>
                ) : (
                  allCourseStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        student.isInBatch
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={student.isInBatch}
                          disabled={processingStudents.has(student.id)}
                          onChange={() => handleToggleStudent(student.id, student.isInBatch)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>

                      {processingStudents.has(student.id) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      )}

                      <UserIcon className="h-5 w-5 text-gray-400" />

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{student.full_name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>

                      <div className="text-xs">
                        {student.isInBatch ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Batch
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not in Batch
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Batch Modal Component
interface CreateBatchModalProps {
  teacherId?: string
  onClose: () => void
  onSuccess: () => void
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ teacherId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [step, setStep] = useState<'basic' | 'course' | 'students'>('basic')

  const loadCourses = useCallback(async () => {
    if (!teacherId) return
    try {
      const coursesData = await getTeacherCourses(teacherId)
      setCourses(coursesData)
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    }
  }, [teacherId])

  const loadStudentsForCourse = useCallback(async (courseId: string) => {
    try {
      const studentsData = await getStudentsEnrolledInCourse(courseId)
      setStudents(studentsData)
    } catch (error) {
      console.error('Error loading students for course:', error)
      toast.error('Failed to load students enrolled in this course')
      setStudents([])
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleCreateBatch = async () => {
    if (!teacherId || !batchName.trim() || !selectedCourse) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!selectedCourse.gurukul_id) {
      toast.error('Selected course must have a valid gurukul')
      return
    }

    setLoading(true)
    try {
      // Create the batch with "not_started" status
      const batchData = {
        name: batchName.trim(),
        description: batchName.trim(),
        gurukul_id: selectedCourse.gurukul_id,
        teacher_id: teacherId,
        status: 'not_started' as const,
        created_by: teacherId,
        is_active: true,
        progress_percentage: 0,
      }

      const newBatch = await createBatch(batchData)

      // Assign the selected course to the batch
      await assignCourseToBatch(newBatch.id, selectedCourse.id, teacherId)

      // Assign selected students to the batch
      if (selectedStudents.length > 0) {
        await Promise.all(
          selectedStudents.map((studentId) =>
            assignStudentToBatch(newBatch.id, studentId, teacherId),
          ),
        )
      }

      toast.success('Batch created successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error creating batch:', error)

      // Provide more specific error messages
      let errorMessage = 'Failed to create batch'
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          errorMessage = 'A batch with this name already exists'
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid course or gurukul selection'
        } else if (error.message.includes('check constraint')) {
          errorMessage = 'Invalid batch data provided'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 'basic' && batchName.trim()) {
      setStep('course')
    } else if (step === 'course' && selectedCourse) {
      // Load students enrolled in the selected course
      loadStudentsForCourse(selectedCourse.id)
      setStep('students')
    }
  }

  const prevStep = () => {
    if (step === 'course') {
      setStep('basic')
    } else if (step === 'students') {
      setStep('course')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Batch</h2>
              <p className="text-gray-600">Set up a new learning group for your students</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div
              className={`flex items-center space-x-2 ${step === 'basic' ? 'text-indigo-600' : step === 'course' || step === 'students' ? 'text-green-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'basic' ? 'bg-indigo-100' : step === 'course' || step === 'students' ? 'bg-green-100' : 'bg-gray-100'}`}
              >
                1
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${step === 'course' ? 'text-indigo-600' : step === 'students' ? 'text-green-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'course' ? 'bg-indigo-100' : step === 'students' ? 'bg-green-100' : 'bg-gray-100'}`}
              >
                2
              </div>
              <span className="font-medium">Select Course</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${step === 'students' ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'students' ? 'bg-indigo-100' : 'bg-gray-100'}`}
              >
                3
              </div>
              <span className="font-medium">Add Students</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name *</label>
                <Input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Enter a name for your batch (e.g., 'Morning Yoga Batch', 'Advanced Students Group')"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Choose a descriptive name that helps identify this group of students
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Course Selection */}
          {step === 'course' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Course *
                </label>
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedCourse?.id === course.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <BookOpenIcon
                          className={`h-6 w-6 mt-0.5 ${
                            selectedCourse?.id === course.id ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          {course.description && (
                            <div
                              className="text-sm text-gray-600 mt-1 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                            />
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Level: {course.level || 'Basic'}</span>
                            <span>Duration: {course.duration_weeks || 8} weeks</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {courses.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No courses available. Please create a course first.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Student Selection */}
          {step === 'students' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Students (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Only students enrolled in "{selectedCourse?.title}" are shown. You can add more
                  students later.
                </p>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No students enrolled in "{selectedCourse?.title}"</p>
                      <p className="text-xs mt-1">
                        You can create the batch and add students later
                      </p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudents((prev) =>
                            prev.includes(student.id)
                              ? prev.filter((id) => id !== student.id)
                              : [...prev, student.id],
                          )
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedStudents.includes(student.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded border-2 ${
                              selectedStudents.includes(student.id)
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedStudents.includes(student.id) && (
                              <CheckCircleIcon className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{student.full_name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}{' '}
                  selected
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {step !== 'basic' && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {step === 'students' ? (
                <Button
                  onClick={handleCreateBatch}
                  disabled={loading || !batchName.trim() || !selectedCourse}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  {loading ? 'Creating...' : 'Create Batch'}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={
                    (step === 'basic' && !batchName.trim()) ||
                    (step === 'course' && !selectedCourse)
                  }
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Batch Management Component for Teachers
interface BatchManagementContentProps {
  teacherId?: string
  canAccess: (resource: string, action: string) => boolean
  initialBatches?: Batch[]
  onBatchUpdate?: () => void
}

const BatchManagementContent: React.FC<BatchManagementContentProps> = ({
  teacherId,
  canAccess,
  initialBatches = [],
  onBatchUpdate,
}) => {
  const [batches, setBatches] = useState<Batch[]>(initialBatches)
  const [loading, setLoading] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [batchToRestart, setBatchToRestart] = useState<Batch | null>(null)
  const [loadingWeeks, setLoadingWeeks] = useState<Set<number>>(new Set())
  const [showBatchViewModal, setShowBatchViewModal] = useState(false)
  const [selectedBatchForView, setSelectedBatchForView] = useState<Batch | null>(null)
  const [batchStudents, setBatchStudents] = useState<BatchStudentWithInfo[]>([])
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false)
  const [showEditStudentsModal, setShowEditStudentsModal] = useState(false)
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null)
  const [allCourseStudentsForEdit, setAllCourseStudentsForEdit] = useState<
    { id: string; full_name: string; email: string; isInBatch: boolean }[]
  >([])
  const [loadingStudentData, setLoadingStudentData] = useState(false)
  const [showEditDatesModal, setShowEditDatesModal] = useState(false)
  const [batchToEditDates, setBatchToEditDates] = useState<Batch | null>(null)
  const [editingStartDate, setEditingStartDate] = useState('')
  const [editingEndDate, setEditingEndDate] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    completed: 0,
    archived: 0,
    in_progress: 0,
  })

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getBatches({ teacher_id: teacherId, is_active: true })
      setBatches(data)
    } catch (error) {
      console.error('Error loading batches:', error)
      toast.error('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  // Calculate stats from teacher's batches only
  useEffect(() => {
    const calculatedStats = {
      total: batches.length,
      active: batches.filter((b) => b.status === 'active').length,
      inactive: batches.filter((b) => !b.is_active).length,
      completed: batches.filter((b) => b.status === 'completed').length,
      archived: batches.filter((b) => b.status === 'archived').length,
      in_progress: batches.filter((b) => b.status === 'in_progress').length,
    }
    setStats(calculatedStats)
  }, [batches])

  useEffect(() => {
    setBatches(initialBatches)
  }, [initialBatches])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteBatch = async (batchId: string) => {
    if (!canAccess('batches', 'delete')) {
      toast.error('You do not have permission to delete batches')
      return
    }

    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await deleteBatch(batchId)
        toast.success('Batch deleted successfully')
        if (onBatchUpdate) {
          onBatchUpdate()
        } else {
          loadBatches()
        }
        loadStats()
      } catch (error) {
        console.error('Error deleting batch:', error)
        toast.error('Failed to delete batch')
      }
    }
  }

  const handleEditProgress = (batch: Batch) => {
    setEditingBatch(batch)
    setShowProgressModal(true)
  }

  const handleProgressUpdate = async (weekNumber: number, isCompleted: boolean) => {
    if (!editingBatch || !teacherId) return

    // Add loading state for this week
    setLoadingWeeks((prev) => new Set(prev).add(weekNumber))

    try {
      await updateBatchProgress(editingBatch.id, weekNumber, isCompleted, teacherId)
      toast.success(`Week ${weekNumber} ${isCompleted ? 'completed' : 'reset'}!`)
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Failed to update progress')
    } finally {
      // Refresh batch data after update (success or failure)
      try {
        const updatedBatches = await getBatches({ teacher_id: teacherId, is_active: true })
        const updatedBatch = updatedBatches.find((b) => b.id === editingBatch.id)

        if (updatedBatch) {
          // Update the current editing batch with fresh data
          setEditingBatch(updatedBatch)
        }

        // Refresh batches list and stats
        loadBatches()
        loadStats()
      } catch (refreshError) {
        console.error('Error refreshing batch data:', refreshError)
        // Silent fail on refresh - don't show error toast
      }
      // Remove loading state for this week
      setLoadingWeeks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(weekNumber)
        return newSet
      })
    }
  }

  const handleStartBatch = async (batch: Batch) => {
    if (!batch.course) {
      toast.error('Cannot start batch without an assigned course')
      return
    }

    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(startDate.getDate() + (batch.course.duration_weeks || 8) * 7)

      // Update batch status and set dates
      await updateBatch(batch.id, {
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      })

      toast.success(
        'Batch started successfully! Dates have been calculated based on course duration.',
      )

      // Refresh the batches list
      loadBatches()
    } catch (error) {
      console.error('Error starting batch:', error)
      toast.error('Failed to start batch')
    }
  }

  const handleRestartBatch = (batch: Batch) => {
    setBatchToRestart(batch)
    setShowRestartConfirm(true)
  }

  const confirmRestartBatch = async () => {
    if (!batchToRestart) return

    try {
      // Clear all week progress records
      await clearBatchProgress(batchToRestart.id)

      // Reset batch to not_started status and clear dates and progress
      await updateBatch(batchToRestart.id, {
        status: 'not_started',
        start_date: null,
        end_date: null,
        progress_percentage: 0,
        updated_at: new Date().toISOString(),
      })

      toast.success('Batch has been reset to "Not Started" status')

      setShowRestartConfirm(false)
      setBatchToRestart(null)

      // Refresh the batches list
      loadBatches()
    } catch (error) {
      console.error('Error restarting batch:', error)
      toast.error('Failed to restart batch')
    }
  }

  const handleOpenEditDates = (batch: Batch) => {
    setBatchToEditDates(batch)
    // Pre-fill with existing dates if available
    if (batch.start_date) {
      setEditingStartDate(new Date(batch.start_date).toISOString().split('T')[0])
    } else {
      setEditingStartDate('')
    }
    if (batch.end_date) {
      setEditingEndDate(new Date(batch.end_date).toISOString().split('T')[0])
    } else {
      // Calculate default end date based on course duration
      if (batch.start_date && batch.course) {
        const endDate = new Date(batch.start_date)
        endDate.setDate(endDate.getDate() + (batch.course.duration_weeks || 8) * 7)
        setEditingEndDate(endDate.toISOString().split('T')[0])
      } else {
        setEditingEndDate('')
      }
    }
    setShowEditDatesModal(true)
  }

  const handleSaveDates = async () => {
    if (!batchToEditDates) return

    if (!editingStartDate || !editingEndDate) {
      toast.error('Please select both start and end dates')
      return
    }

    const startDate = new Date(editingStartDate)
    const endDate = new Date(editingEndDate)

    if (endDate <= startDate) {
      toast.error('End date must be after start date')
      return
    }

    try {
      await updateBatch(batchToEditDates.id, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        // If batch is not_started and we're setting dates, activate it
        status: batchToEditDates.status === 'not_started' ? 'active' : batchToEditDates.status,
        updated_at: new Date().toISOString(),
      })

      toast.success('Batch dates updated successfully')
      setShowEditDatesModal(false)
      setBatchToEditDates(null)
      loadBatches()
    } catch (error) {
      console.error('Error updating batch dates:', error)
      toast.error('Failed to update batch dates')
    }
  }

  const handleViewBatch = async (batch: Batch) => {
    try {
      setSelectedBatchForView(batch)
      setShowBatchViewModal(true)

      // Fetch students for this batch
      const students = await getBatchStudents(batch.id)

      // Transform BatchStudent[] to BatchStudentWithInfo[]
      const studentsWithInfo: BatchStudentWithInfo[] = students.map((student) => ({
        ...student,
        name: student.student?.full_name || 'Unknown',
        email: student.student?.email || 'No email',
        batch_name: student.batch?.name || batch.name,
        course_title: batch.course?.title || 'No course',
      }))

      setBatchStudents(studentsWithInfo)
    } catch (error) {
      console.error('Error fetching batch students:', error)
      toast.error('Failed to load batch details')
    }
  }

  const handleDeleteConfirmation = (batchId: string) => {
    setBatchToDelete(batchId)
    setShowDeleteConfirm(true)
  }

  const handleEditStudents = async (batch: Batch) => {
    if (!batch.course?.id) {
      toast.error('Cannot edit students: Batch has no associated course')
      return
    }

    setBatchToEdit(batch)
    setLoadingStudentData(true)
    setShowEditStudentsModal(true)

    try {
      // Load current batch students
      const currentStudents = await getBatchStudents(batch.id)
      const currentStudentIds = new Set(currentStudents.map((s) => s.student_id))

      // Load all students enrolled in the course
      const allCourseStudents = await getStudentsEnrolledInCourse(batch.course.id)

      // Combine data to show all students with their batch status
      const studentsWithBatchStatus = allCourseStudents.map((student) => ({
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        isInBatch: currentStudentIds.has(student.id),
      }))

      setAllCourseStudentsForEdit(studentsWithBatchStatus)
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Failed to load student information')
    } finally {
      setLoadingStudentData(false)
    }
  }

  const handleToggleStudentInBatch = async (studentId: string, shouldAdd: boolean) => {
    if (!batchToEdit || !teacherId) return

    try {
      if (shouldAdd) {
        await assignStudentToBatch(batchToEdit.id, studentId, teacherId)
        toast.success('Student added to batch successfully')
      } else {
        await removeStudentFromBatch(batchToEdit.id, studentId)
        toast.success('Student removed from batch successfully')
      }

      // Refresh the student list with updated batch status
      const currentStudents = await getBatchStudents(batchToEdit.id)
      const currentStudentIds = new Set(currentStudents.map((s) => s.student_id))

      // Update the students list with new batch status
      setAllCourseStudentsForEdit((prev) =>
        prev.map((student) => ({
          ...student,
          isInBatch: currentStudentIds.has(student.id),
        })),
      )
    } catch (error) {
      console.error('Error toggling student in batch:', error)
      toast.error(
        shouldAdd ? 'Failed to add student to batch' : 'Failed to remove student from batch',
      )
    }
  }

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return

    if (!canAccess('batches', 'delete')) {
      toast.error('You do not have permission to delete batches')
      return
    }

    setIsDeleting(true)
    try {
      await deleteBatch(batchToDelete)
      toast.success('Batch deleted successfully')
      if (onBatchUpdate) {
        onBatchUpdate()
      } else {
        loadBatches()
      }
      loadStats()
      setShowDeleteConfirm(false)
      setBatchToDelete(null)
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast.error('Failed to delete batch')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-red-100 text-red-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Batch Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center justify-between space-y-4 md:space-y-0 md:flex-row">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Batch Management</h2>
          <p className="text-gray-600 max-w-2xl">
            Manage your student batches, create groups, and organize learning sessions.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateBatchModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 font-semibold px-8 py-3"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Batch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
              </div>
              <QueueListIcon className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.in_progress}</p>
              </div>
              <PlayIcon className="h-8 w-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <TrophyIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Batches</p>
                <p className="text-2xl font-bold text-purple-600">{batches.length}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Grid */}
      {batches.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-12">
            <div className="text-center">
              <QueueListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Yet</h3>
              <p className="text-gray-500 mb-6">
                Start building your teaching community by creating your first batch of students.
              </p>
              <Button
                onClick={() => setShowCreateBatchModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 font-semibold"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card
              key={batch.id}
              className="hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-white/20 shadow-xl"
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Batch Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {batch.name}
                        </h3>
                        <p className="text-sm text-gray-600">{batch.gurukul?.name}</p>
                      </div>
                      <span
                        className={`ml-2 text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${getStatusColor(batch.status)}`}
                      >
                        {batch.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {batch.course && (
                        <>
                          <div className="flex items-center">
                            <BookOpenIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                            <span className="text-gray-700">{batch.course.title}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {(batch.course.level || 'Basic').charAt(0).toUpperCase() +
                                (batch.course.level || 'Basic').slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                            <span className="text-gray-600">
                              {batch.course.duration_weeks} weeks
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                        <span className="text-gray-600">{batch.student_count || 0} students</span>
                      </div>
                      {batch.status !== 'not_started' && (batch.start_date || batch.end_date) && (
                        <>
                          {batch.start_date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {formatDate(batch.start_date)} →{' '}
                              {batch.end_date ? formatDate(batch.end_date) : 'TBD'}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Progress Bar - Show on separate line for started batches */}
                    {batch.course && batch.status !== 'not_started' && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress:</span>
                          <span className="font-medium text-gray-700">
                            {batch.progress_percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${batch.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Section */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white border-0"
                      onClick={() => handleViewBatch(batch)}
                    >
                      <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>

                    {/* Show Start/Set Dates for not_started batches */}
                    {batch.status === 'not_started' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium bg-green-500 hover:bg-green-600 text-white border-0"
                          onClick={() => handleStartBatch(batch)}
                        >
                          <PlayIcon className="h-3.5 w-3.5 mr-1.5" />
                          Start Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white border-0"
                          onClick={() => handleOpenEditDates(batch)}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                          Set Dates
                        </Button>
                      </>
                    ) : (
                      /* Show Progress and Edit Dates for started batches */
                      <>
                        {batch.course && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                            onClick={() => handleEditProgress(batch)}
                          >
                            <Cog6ToothIcon className="h-3.5 w-3.5 mr-1.5" />
                            Progress
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white border-0"
                          onClick={() => handleOpenEditDates(batch)}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                          Dates
                        </Button>
                      </>
                    )}

                    {/* Edit Students button */}
                    {batch.course && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white border-0"
                        onClick={() => handleEditStudents(batch)}
                      >
                        <UserGroupIcon className="h-3.5 w-3.5 mr-1.5" />
                        Students
                      </Button>
                    )}

                    {/* Show Restart button for active batches */}
                    {batch.status !== 'not_started' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white border-0"
                        onClick={() => handleRestartBatch(batch)}
                        title="Reset batch to Not Started status"
                      >
                        <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5" />
                        Reset
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      className="text-xs font-medium bg-red-500 hover:bg-red-600 text-white border-0"
                      onClick={() => handleDeleteConfirmation(batch.id)}
                    >
                      <TrashIcon className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress Edit Modal */}
      {showProgressModal && editingBatch && editingBatch.course && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Course Progress</h2>
                  <p className="text-gray-600">
                    {editingBatch.name} - {editingBatch.course.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowProgressModal(false)
                    setEditingBatch(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm font-bold text-gray-900">
                    {editingBatch.progress_percentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${editingBatch.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">Weekly Progress</h3>
                <div className="text-xs text-gray-500 mb-4 p-2 bg-blue-50 rounded">
                  💡 Complete weeks in sequence. Only the next week can be checked off.
                </div>
                {Array.from({ length: editingBatch.course.duration_weeks }, (_, index) => {
                  const weekNumber = index + 1
                  const weekProgress = editingBatch.progress?.find(
                    (p) => p.week_number === weekNumber,
                  )
                  const isCompleted = weekProgress?.is_completed || false

                  // Find the first uncompleted week
                  const completedWeeks = editingBatch.progress?.filter((p) => p.is_completed) || []
                  const firstUncompletedWeek = completedWeeks.length + 1

                  // Check if this week is currently being updated
                  const isLoadingWeek = loadingWeeks.has(weekNumber)

                  // Allow interaction if:
                  // 1. Week is completed (can uncheck)
                  // 2. Week is the next sequential week to complete
                  // 3. Not currently loading
                  const canInteract =
                    (isCompleted || weekNumber === firstUncompletedWeek) && !isLoadingWeek

                  // Determine status text and styling
                  const getWeekStatus = () => {
                    if (isLoadingWeek) return { text: 'Updating...', color: 'text-blue-500' }
                    if (isCompleted) return { text: 'Completed ✅', color: 'text-green-600' }
                    if (weekNumber === firstUncompletedWeek)
                      return { text: 'Ready to start 🎯', color: 'text-blue-600' }
                    return { text: 'Locked 🔒', color: 'text-gray-400' }
                  }

                  const status = getWeekStatus()

                  return (
                    <div
                      key={weekNumber}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        canInteract
                          ? 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                          : 'border-gray-100 bg-gray-50'
                      } ${
                        weekNumber === firstUncompletedWeek && !isCompleted
                          ? 'ring-2 ring-blue-200 border-blue-300'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-sm font-medium ${canInteract ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                          Week {weekNumber}
                        </span>
                        {weekProgress?.completed_at && (
                          <span className="text-xs text-gray-500">
                            {formatDate(weekProgress.completed_at)}
                          </span>
                        )}
                      </div>
                      <label
                        className={`flex items-center space-x-2 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            disabled={!canInteract || isLoadingWeek}
                            onChange={(e) => handleProgressUpdate(weekNumber, e.target.checked)}
                            className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                              !canInteract || isLoadingWeek ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          />
                          {isLoadingWeek && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <span className={`text-sm ${status.color} flex items-center gap-1`}>
                          {isLoadingWeek && (
                            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {status.text}
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProgressModal(false)
                    setEditingBatch(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch View Modal */}
      {showBatchViewModal && selectedBatchForView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Batch Details</h2>
                  <p className="text-gray-600">{selectedBatchForView.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowBatchViewModal(false)
                    setSelectedBatchForView(null)
                    setBatchStudents([])
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Course Title:</p>
                    <p className="text-gray-900">
                      {selectedBatchForView.course?.title || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Duration:</p>
                    <p className="text-gray-900">
                      {selectedBatchForView.course?.duration_weeks || 0} weeks
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Gurukul:</p>
                    <p className="text-gray-900">
                      {selectedBatchForView.gurukul?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Level:</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {selectedBatchForView.course?.level || 'Basic'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Students ({batchStudents.length})
                </h3>
                {batchStudents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No students assigned to this batch yet.</p>
                  </div>
                ) : (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    {/* Mobile-friendly scrollable table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Progress
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {batchStudents.map((student) => (
                            <tr key={student.student_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-sm font-medium text-white">
                                        {student.student?.full_name?.charAt(0) || 'S'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {student.student?.full_name || 'Unknown'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {student.student?.student_id || 'Not set'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.student?.email || 'Not provided'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={student.progress_percentage || 0}
                                    onChange={async (e) => {
                                      const newProgress = Math.min(
                                        100,
                                        Math.max(0, parseInt(e.target.value) || 0),
                                      )
                                      try {
                                        await updateStudentProgress(
                                          selectedBatchForView.id,
                                          student.student_id,
                                          newProgress,
                                        )
                                        // Update local state
                                        setBatchStudents((prev) =>
                                          prev.map((s) =>
                                            s.student_id === student.student_id
                                              ? { ...s, progress_percentage: newProgress }
                                              : s,
                                          ),
                                        )
                                        toast.success('Progress updated successfully')
                                      } catch (error) {
                                        console.error('Error updating progress:', error)
                                        toast.error('Failed to update progress')
                                      }
                                    }}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-600">%</span>
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${student.progress_percentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBatchViewModal(false)
                    setSelectedBatchForView(null)
                    setBatchStudents([])
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && batchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Batch</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this batch? This will only remove the batch
                  record. Students and courses will not be affected.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setBatchToDelete(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={confirmDeleteBatch}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="opacity-25"
                          />
                          <path
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            className="opacity-75"
                          />
                        </svg>
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restart Batch Confirmation Modal */}
      {showRestartConfirm && batchToRestart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Restart Batch</h3>
                <p className="text-sm text-gray-500 mb-2">
                  <strong>{batchToRestart.name}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This will reset the batch to "Not Started" status and clear all progress, dates,
                  and completion records. Students will remain enrolled. This action cannot be
                  undone.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowRestartConfirm(false)
                      setBatchToRestart(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={confirmRestartBatch}
                  >
                    Restart Batch
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dates Modal */}
      {showEditDatesModal && batchToEditDates && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Batch Dates</h2>
                  <p className="text-gray-600">{batchToEditDates.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditDatesModal(false)
                    setBatchToEditDates(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Setting dates will automatically activate the batch if
                  it's not started.
                  {batchToEditDates.course && (
                    <span> Suggested duration: {batchToEditDates.course.duration_weeks} weeks</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <Input
                  type="date"
                  value={editingStartDate}
                  onChange={(e) => setEditingStartDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <Input
                  type="date"
                  value={editingEndDate}
                  onChange={(e) => setEditingEndDate(e.target.value)}
                  className="w-full"
                  min={editingStartDate}
                />
              </div>

              {editingStartDate && editingEndDate && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Duration:{' '}
                    <strong>
                      {Math.ceil(
                        (new Date(editingEndDate).getTime() -
                          new Date(editingStartDate).getTime()) /
                          (1000 * 60 * 60 * 24 * 7),
                      )}
                    </strong>{' '}
                    weeks
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDatesModal(false)
                  setBatchToEditDates(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDates}
                disabled={!editingStartDate || !editingEndDate}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Save Dates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Students Modal */}
      {showEditStudentsModal && batchToEdit && (
        <EditStudentsModal
          batch={batchToEdit}
          allCourseStudents={allCourseStudentsForEdit}
          loading={loadingStudentData}
          onClose={() => {
            setShowEditStudentsModal(false)
            setBatchToEdit(null)
            setAllCourseStudentsForEdit([])
            // Refresh batch data to show updated student counts
            loadBatches()
            if (onBatchUpdate) onBatchUpdate()
          }}
          onToggleStudent={handleToggleStudentInBatch}
        />
      )}

      {/* Create Batch Modal */}
      {showCreateBatchModal && (
        <CreateBatchModal
          teacherId={teacherId}
          onClose={() => setShowCreateBatchModal(false)}
          onSuccess={() => {
            setShowCreateBatchModal(false)
            loadBatches()
            if (onBatchUpdate) onBatchUpdate()
          }}
        />
      )}
    </div>
  )
}
