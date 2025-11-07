import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { getUserProfile, updateUserProfile } from '../../lib/api/users'
import { getComplianceStats, getUserComplianceStatus } from '../../lib/api/compliance'
import { getTeacherCourseAssignments } from '../../lib/api/courseAssignments'
import { genUploader } from 'uploadthing/client'
import type { Database } from '../../types/database'
import type { Course, CourseAssignment } from '../../types'
import type { ComplianceStats, ComplianceChecklistItem } from '../../types/compliance'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import toast from 'react-hot-toast'

// Create UploadThing uploader for avatars
const getUploadThingUrl = () => {
  if (import.meta.env.PROD) {
    return 'https://eyogi-main.vercel.app/api/uploadthing'
  }
  return 'http://localhost:3001/api/uploadthing'
}

const { uploadFiles } = genUploader({
  url: getUploadThingUrl(),
})

type Profile = Database['public']['Tables']['profiles']['Row']

export default function TeacherDetailView() {
  const { teacherId } = useParams<{ teacherId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [teacher, setTeacher] = useState<Partial<Profile> | null>(null)
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null)
  const [complianceItems, setComplianceItems] = useState<ComplianceChecklistItem[]>([])
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (teacherId) {
      loadTeacherDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId])

  const loadTeacherDetails = async () => {
    if (!teacherId) return

    try {
      setLoading(true)

      // First get teacher data to get their teacher_id
      const teacherData = await getUserProfile(teacherId)

      // Then fetch other data in parallel
      const [stats, items, assignments] = await Promise.all([
        getComplianceStats(teacherId, 'teacher'),
        getUserComplianceStatus(teacherId, 'teacher'),
        getTeacherCourseAssignments(teacherData?.teacher_id || ''),
      ])

      // Extract courses from assignments
      const courses = assignments
        .map((assignment) => (assignment as CourseAssignment & { courses?: Course }).courses)
        .filter(Boolean) as Course[]

      setTeacher(teacherData)
      setComplianceStats(stats)
      setComplianceItems(items)
      setAssignedCourses(courses)
    } catch (error) {
      console.error('Error loading teacher details:', error)
      toast.error('Failed to load teacher details')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !teacherId) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB')
      return
    }

    try {
      setUploadingPhoto(true)

      // Upload to UploadThing using avatarUploader endpoint
      const uploadResults = await uploadFiles('avatarUploader', { files: [file] })

      if (!uploadResults || uploadResults.length === 0) {
        throw new Error('Upload failed - no results returned')
      }

      const uploadResult = uploadResults[0]

      // Get the file URL (try ufsUrl first, fallback to url)
      const publicUrl = uploadResult.url

      if (!publicUrl) {
        throw new Error('Upload failed - no URL returned')
      }

      // Update profile with new avatar URL
      await updateUserProfile(teacherId, { avatar_url: publicUrl })

      // Update local state
      setTeacher((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null))

      toast.success('Photo uploaded successfully!')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!teacherId || !teacher?.avatar_url) return

    try {
      setUploadingPhoto(true)

      // Remove avatar URL from profile
      await updateUserProfile(teacherId, { avatar_url: null })

      // Update local state
      setTeacher((prev) => (prev ? { ...prev, avatar_url: null } : null))

      toast.success('Photo removed successfully!')
    } catch (error) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getComplianceStatus = (stats: ComplianceStats) => {
    if (stats.total_items === 0) {
      return { label: 'Not Started', color: 'bg-gray-100 text-gray-800', icon: ClockIcon }
    }
    const percentage = (stats.completed_items / stats.total_items) * 100
    if (percentage === 100) {
      return { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon }
    }
    if (percentage > 0) {
      return {
        label: `${Math.round(percentage)}% Complete`,
        color: 'bg-yellow-100 text-yellow-800',
        icon: ClockIcon,
      }
    }
    return { label: 'Pending', color: 'bg-red-100 text-red-800', icon: XCircleIcon }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Teacher not found</h3>
        <div className="mt-6">
          <Link to="/admin/teachers" className="text-orange-600 hover:text-orange-900">
            ← Back to Teachers
          </Link>
        </div>
      </div>
    )
  }

  const complianceStatus = complianceStats ? getComplianceStatus(complianceStats) : null
  const StatusIcon = complianceStatus?.icon

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/teachers')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Teachers
        </button>
      </div>

      {/* Teacher Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploadingPhoto}
                className="h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-semibold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden relative"
                title="Click to upload photo"
              >
                {teacher.avatar_url ? (
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.full_name || 'Teacher'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                    {teacher.full_name?.[0]?.toUpperCase() || 'T'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    {uploadingPhoto ? 'Uploading...' : teacher.avatar_url ? 'Change' : 'Upload'}
                  </span>
                </div>
              </button>
              {teacher.avatar_url && !uploadingPhoto && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -bottom-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                  title="Remove photo"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{teacher.full_name}</h1>
                </div>
                {complianceStatus && StatusIcon && (
                  <Badge className={complianceStatus.color}>
                    <StatusIcon className="h-4 w-4 mr-1 inline" />
                    {complianceStatus.label}
                  </Badge>
                )}
              </div>

              {/* Contact & Basic Info */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{teacher.email}</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{teacher.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">
                    Joined{' '}
                    {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Additional Personal Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacher.date_of_birth && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(teacher.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {teacher.student_id && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">ID</label>
                    <p className="mt-1 text-sm text-gray-900">{teacher.student_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {teacher.updated_at
                      ? new Date(teacher.updated_at).toLocaleDateString()
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Checklist */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <DocumentCheckIcon className="h-6 w-6" />
              Compliance Checklist
            </h2>
          </CardHeader>
          <CardContent>
            {complianceStats && (
              <div className="mb-4 space-y-3">
                {/* Progress Bar */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Completion Status</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {complianceStats.completed_items} of {complianceStats.total_items} approved
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${complianceStats.completion_percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-xs text-gray-600">Approved</span>
                    <span className="text-sm font-semibold text-green-700">
                      {complianceStats.completed_items}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-xs text-gray-600">Pending/In Review</span>
                    <span className="text-sm font-semibold text-yellow-700">
                      {complianceStats.pending_items}
                    </span>
                  </div>
                  {complianceStats.overdue_items > 0 && (
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded col-span-2">
                      <span className="text-xs text-gray-600">Overdue</span>
                      <span className="text-sm font-semibold text-red-700">
                        {complianceStats.overdue_items}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {complianceItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No compliance items assigned</p>
            ) : (
              <div className="space-y-3">
                {complianceItems.map((item) => {
                  const isOverdue =
                    item.due_date &&
                    new Date(item.due_date) < new Date() &&
                    item.status !== 'approved'
                  const getStatusBadge = () => {
                    switch (item.status) {
                      case 'approved':
                        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
                      case 'submitted':
                        return <Badge className="bg-blue-100 text-blue-800">In Review</Badge>
                      case 'rejected':
                        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                      default:
                        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          {item.is_mandatory && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        {item.due_date && (
                          <p
                            className={`text-xs mt-1 ${
                              isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                            }`}
                          >
                            Due: {new Date(item.due_date).toLocaleDateString()}
                            {isOverdue && ' (Overdue)'}
                          </p>
                        )}
                        {item.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {item.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">{getStatusBadge()}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Courses */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5" />
              Assigned Courses ({assignedCourses.length})
            </h2>
          </CardHeader>
          <CardContent>
            {assignedCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No courses assigned yet</p>
            ) : (
              <div className="space-y-3">
                {assignedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{course.title}</h4>
                        <div
                          className="text-sm text-gray-600 mt-1 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: course.description || '' }}
                        />
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {course.level}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {course.duration_weeks} weeks
                          </span>
                          <span className="text-xs text-gray-500">{course.course_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
