import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Certificate, Enrollment, CertificateTemplate, Course, Gurukul } from '@/types'
import {
  issueCertificate,
  issueCertificateWithTemplate,
  bulkIssueCertificates,
  getCertificatesFromTable,
} from '@/lib/api/certificates'
import {
  getCertificateTemplates,
  deleteCertificateTemplate,
  duplicateCertificateTemplate,
} from '@/lib/api/certificateTemplates'
import {
  getCertificateAssignments,
  deleteCertificateAssignment,
  type CertificateAssignment,
} from '@/lib/api/certificateAssignments'
import { getAllEnrollments } from '@/lib/api/enrollments'
import { getCourses } from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { generateCertificatePDF, CertificateData } from '@/lib/pdf/certificateGenerator'
import { formatDate } from '@/lib/utils'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
import { usePermissions } from '../../contexts/PermissionContext'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import CertificateTemplateEditor from './CertificateTemplateEditor'
import CertificatePreviewModal from './CertificatePreviewModal'
import TemplateAssignmentModal from './TemplateAssignmentModal'
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
export default function CertificateManagement() {
  const { canManageCertificates, canAssignTemplates, profile } = useAuth()
  const { canAccess, hasAnyPermission } = usePermissions()

  // Check both role-based and granular permissions
  const hasPermission =
    canManageCertificates ||
    canAccess('certificates', 'read') ||
    hasAnyPermission(['certificates.read', 'certificates.create'])

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [completedEnrollments, setCompletedEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'certificates' | 'templates' | 'issue' | 'assignments'
  >('certificates')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedGurukul, setSelectedGurukul] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | undefined>(undefined)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewData, setPreviewData] = useState<CertificateData | null>(null)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [assignments, setAssignments] = useState<CertificateAssignment[]>([])
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    loading?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false,
  })
  // All hooks must be called before any early returns
  const loadData = useCallback(async () => {
    try {
      // Load all data in parallel
      const [
        allEnrollments,
        templatesData,
        coursesData,
        gurukulData,
        assignmentsData,
        certificatesData,
      ] = await Promise.all([
        getAllEnrollments(),
        getCertificateTemplates(),
        getCourses(),
        getGurukuls(),
        getCertificateAssignments(),
        getCertificatesFromTable(),
      ])

      // Helper function to check if student has certificate for course
      const hasCertificate = (studentId: string, courseId: string): boolean => {
        return certificatesData.some(
          (cert) => cert.student_id === studentId && cert.course_id === courseId,
        )
      }

      const completedWithoutCerts = allEnrollments.filter(
        (e) => e.status === 'completed' && !hasCertificate(e.student_id, e.course_id),
      )
      setCompletedEnrollments(completedWithoutCerts)
      setCertificates(certificatesData)
      setTemplates(templatesData)
      setCourses(coursesData)
      setGurukuls(gurukulData)
      setAssignments(assignmentsData)
      // Set default template if available
      if (templatesData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesData[0].id)
      }

      // Certificates already loaded above, no need to reload
    } catch {
      toast.error('Failed to load certificate data')
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate])
  useEffect(() => {
    loadData()
  }, [loadData])
  const handleIssueCertificate = async (enrollmentId: string) => {
    if (!selectedTemplate) {
      toast.error('Please select a certificate template')
      return
    }
    try {
      await issueCertificateWithTemplate(enrollmentId, selectedTemplate)
      await loadData()
      toast.success('Certificate issued successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to issue certificate'
      toast.error(errorMessage)
    }
  }
  const handleBulkIssueCertificates = async () => {
    if (selectedEnrollments.size === 0) {
      toast.error('Please select enrollments to issue certificates for')
      return
    }
    if (!selectedTemplate) {
      toast.error('Please select a certificate template')
      return
    }
    try {
      await Promise.all(
        Array.from(selectedEnrollments).map((enrollmentId) =>
          issueCertificateWithTemplate(enrollmentId, selectedTemplate),
        ),
      )
      await loadData()
      setSelectedEnrollments(new Set())
      toast.success(`${selectedEnrollments.size} certificates issued successfully`)
    } catch {
      toast.error('Failed to issue certificates')
    }
  }
  const handleTemplateAction = (
    action: 'create' | 'edit' | 'duplicate',
    template?: CertificateTemplate,
  ) => {
    if (action === 'create') {
      setEditingTemplate(undefined)
      setTemplateEditorOpen(true)
    } else if (action === 'edit' && template) {
      setEditingTemplate(template)
      setTemplateEditorOpen(true)
    } else if (action === 'duplicate' && template) {
      handleDuplicateTemplate(template.id)
    }
  }
  const handleDeleteTemplate = async (templateId: string) => {
    const templateToDelete = templates.find((t) => t.id === templateId)
    if (!templateToDelete) return

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Template',
      message: `Are you sure you want to delete "${templateToDelete.name}"?`,
      onConfirm: async () => {
        try {
          await deleteCertificateTemplate(templateId)
          await loadData()
          toast.success('Template deleted successfully')
        } catch {
          toast.error('Failed to delete template')
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateCertificateTemplate(templateId)
      await loadData()
      toast.success('Template duplicated successfully')
    } catch {
      toast.error('Failed to duplicate template')
    }
  }
  const handleTemplateSave = (template: CertificateTemplate) => {
    setTemplates((prev) => {
      const index = prev.findIndex((t) => t.id === template.id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = template
        return updated
      } else {
        return [...prev, template]
      }
    })
  }
  const createCertificateData = (enrollment: Enrollment): CertificateData => {
    return {
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
      courseId: enrollment.course?.course_number || `C${Math.random().toString().slice(-3)}`,
      gurukulName: enrollment.course?.gurukul?.name || 'Gurukul Name',
      completionDate: enrollment.completed_at || new Date().toISOString(),
      certificateNumber: `CERT-${Date.now()}-${enrollment.id.slice(-4)}`,
      verificationCode: Math.random().toString(36).substr(2, 9).toUpperCase(),
    }
  }
  const handleViewCertificate = (enrollment: Enrollment) => {
    const certificateData = createCertificateData(enrollment)
    setPreviewData(certificateData)
    setPreviewModalOpen(true)
  }
  const handleDownloadCertificate = async (enrollment: Enrollment) => {
    try {
      const template = templates.find((t) => t.id === selectedTemplate)
      const certificateData = createCertificateData(enrollment)
      const pdfBlob = await generateCertificatePDF(certificateData, template)
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificateData.studentName.replace(/\s+/g, '-')}-${certificateData.courseId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Certificate downloaded successfully')
    } catch {
      toast.error('Failed to download certificate')
    }
  }
  const handleRemoveAssignment = async (assignmentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Assignment',
      message: 'Are you sure you want to remove this assignment?',
      loading: false,
      onConfirm: async () => {
        try {
          // Set loading state to prevent double-clicks
          setConfirmDialog((prev) => ({ ...prev, loading: true }))

          await deleteCertificateAssignment(assignmentId)
          toast.success('Assignment removed successfully')
          await loadData() // Reload data after deletion

          // Close dialog after successful deletion
          setConfirmDialog((prev) => ({ ...prev, isOpen: false, loading: false }))
        } catch {
          toast.error('Failed to remove assignment')
          // Reset loading state on error but keep dialog open
          setConfirmDialog((prev) => ({ ...prev, loading: false }))
        }
      },
    })
  }
  const handleSelectEnrollment = (enrollmentId: string) => {
    const newSelected = new Set(selectedEnrollments)
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId)
    } else {
      newSelected.add(enrollmentId)
    }
    setSelectedEnrollments(newSelected)
  }
  const handleSelectAll = () => {
    if (selectedEnrollments.size === completedEnrollments.length) {
      setSelectedEnrollments(new Set())
    } else {
      setSelectedEnrollments(new Set(completedEnrollments.map((e) => e.id)))
    }
  }
  const filteredEnrollments = completedEnrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGurukul = !selectedGurukul || enrollment.course?.gurukul_id === selectedGurukul
    const matchesCourse = !selectedCourse || enrollment.course_id === selectedCourse
    return matchesSearch && matchesGurukul && matchesCourse
  })
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }
  // Check access permissions
  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access certificate management.
          </p>
          <p className="text-sm text-gray-500 mt-2">Current role: {profile?.role}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          {[
            { id: 'certificates', name: 'Recent Certificates', icon: DocumentTextIcon },
            { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
            { id: 'issue', name: 'Issue Certificates', icon: PlusIcon },
            ...(canAssignTemplates
              ? [{ id: 'assignments', name: 'Template Assignments', icon: FunnelIcon }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'certificates' | 'templates' | 'issue' | 'assignments')
              }
              className={`flex items-center gap-1.5 py-1.5 px-1 border-b-2 font-medium text-xs ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Recent Certificates Tab */}
      {activeTab === 'certificates' && (
        <Card>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No certificates issued yet
                </h3>
                <p className="text-gray-600">
                  Certificates will appear here once they are issued to students.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Certificate #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issued
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((certificate) => (
                      <tr key={certificate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono">
                          {certificate.certificate_number}
                        </td>
                        <td className="px-6 py-4 text-sm">{certificate.student?.full_name}</td>
                        <td className="px-6 py-4 text-sm">{certificate.course?.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(certificate.issue_date || certificate.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const certificateData: CertificateData = {
                                  studentName: certificate.student?.full_name || 'Student Name',
                                  studentId:
                                    certificate.student?.student_id ||
                                    certificate.student?.full_name
                                      ?.split(' ')
                                      .map((n) => n.charAt(0))
                                      .join('')
                                      .toUpperCase() + Math.random().toString().slice(-3) ||
                                    'STU001',
                                  courseName: certificate.course?.title || 'Course Name',
                                  courseId:
                                    certificate.course?.course_number ||
                                    `C${Math.random().toString().slice(-3)}`,
                                  gurukulName: certificate.course?.gurukul?.name || 'Gurukul Name',
                                  completionDate:
                                    certificate.completion_date ||
                                    certificate.issue_date ||
                                    certificate.created_at,
                                  certificateNumber:
                                    certificate.certificate_number || certificate.id,
                                  verificationCode: certificate.verification_code || 'N/A',
                                }
                                setPreviewData(certificateData)
                                setPreviewModalOpen(true)
                              }}
                              title="View Certificate"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Download Certificate">
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // For reissuing, we need to find the enrollment or create a new certificate
                                // This might need a different handler since certificates table doesn't have enrollment_id
                                toast.error(
                                  'Reissue functionality needs to be updated for new certificate system',
                                )
                              }}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Reissue Certificate"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-end">
              <Button onClick={() => handleTemplateAction('create')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificate templates</h3>
                <p className="text-gray-600 mb-4">
                  Create your first certificate template to get started.
                </p>
                <Button onClick={() => handleTemplateAction('create')}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="card-hover overflow-hidden">
                    <CardContent className="p-6">
                      {/* Template Image Preview */}
                      {template.template_data?.template_image && (
                        <div className="mb-4 -mx-6 -mt-6">
                          <img
                            src={template.template_data.template_image}
                            alt={template.name}
                            className="w-full h-40 object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <DocumentTextIcon className="h-8 w-8 text-orange-600" />
                        <Badge
                          className={
                            template.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Type:{' '}
                        {template.type === 'student'
                          ? 'Student Certificate'
                          : 'Teacher Certificate'}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Created: {formatDate(template.created_at)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTemplateAction('edit', template)}
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTemplateAction('duplicate', template)}
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Issue Certificates Tab */}
      {activeTab === 'issue' && (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-end">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students, courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
              {/* Filters and Template Selection */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Template</option>
                    {templates
                      .filter((t) => t.is_active)
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Gurukul
                  </label>
                  <select
                    value={selectedGurukul}
                    onChange={(e) => setSelectedGurukul(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Gurukuls</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Courses</option>
                    {courses
                      .filter((course) => !selectedGurukul || course.gurukul_id === selectedGurukul)
                      .map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedGurukul('')
                      setSelectedCourse('')
                      setSearchTerm('')
                    }}
                    className="w-full"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
            {selectedEnrollments.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedEnrollments.size} enrollment{selectedEnrollments.size !== 1 ? 's' : ''}{' '}
                  selected
                </span>
                <Button
                  onClick={handleBulkIssueCertificates}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Issue {selectedEnrollments.size} Certificate
                  {selectedEnrollments.size !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
                <p className="text-gray-600">
                  No completed courses are waiting for certificate issuance.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedEnrollments.size === filteredEnrollments.length &&
                            filteredEnrollments.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEnrollments.has(enrollment.id)}
                            onChange={() => handleSelectEnrollment(enrollment.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.student?.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID:{' '}
                            {enrollment.student?.student_id ||
                              enrollment.student?.full_name
                                ?.split(' ')
                                .map((n) => n.charAt(0))
                                .join('')
                                .toUpperCase() + Math.random().toString().slice(-3) ||
                              'STU001'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.course?.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            Course #
                            {enrollment.course?.course_number ||
                              `C${Math.random().toString().slice(-3)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {enrollment.completed_at ? formatDate(enrollment.completed_at) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCertificate(enrollment)}
                              disabled={!selectedTemplate}
                              title="View Certificate"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleIssueCertificate(enrollment.id)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={!selectedTemplate}
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              Issue
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(enrollment)}
                              disabled={!selectedTemplate}
                              title="Download PDF"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Template Assignments Tab */}
      {activeTab === 'assignments' && canAssignTemplates && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-end">
              <Button onClick={() => setAssignmentModalOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Assign Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Template Assignments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Assign certificate templates to specific gurukuls and courses. Teachers will then
                  have access to issue certificates using assigned templates.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setAssignmentModalOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignment Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => {
                      const gurukul = gurukuls.find((g) => g.id === assignment.gurukul_id)
                      const course = courses.find((c) => c.id === assignment.course_id)
                      const teacher = assignment.teacher
                      return (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.template?.name || 'Unknown Template'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.template?.type || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                assignment.teacher_id
                                  ? 'danger'
                                  : assignment.course_id
                                    ? 'default'
                                    : 'secondary'
                              }
                              className="px-2 py-1 text-xs font-medium rounded-md"
                            >
                              {assignment.teacher_id
                                ? 'Teacher'
                                : assignment.course_id
                                  ? 'Course'
                                  : 'Gurukul'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {assignment.teacher_id ? (
                              <div className="text-sm text-gray-900">
                                Teacher: {teacher?.full_name || 'Unknown Teacher'}
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {gurukul?.name || 'Unknown Gurukul'}
                                </div>
                                {course && (
                                  <div className="text-sm text-gray-500">
                                    Course: {course.title}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.created_at ? formatDate(assignment.created_at) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Template Editor Modal */}
      <CertificateTemplateEditor
        template={editingTemplate}
        isOpen={templateEditorOpen}
        onClose={() => {
          setTemplateEditorOpen(false)
          setEditingTemplate(undefined)
        }}
        onSave={handleTemplateSave}
      />
      {/* Certificate Preview Modal */}
      {previewData && (
        <CertificatePreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false)
            setPreviewData(null)
          }}
          certificateData={previewData}
          template={templates.find((t) => t.id === selectedTemplate)}
        />
      )}
      {/* Template Assignment Modal */}
      <TemplateAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        onSave={async () => {
          await loadData() // Reload data after assignment
          setAssignmentModalOpen(false)
        }}
        templates={templates}
        userId={profile?.id || ''}
      />
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
        loading={confirmDialog.loading}
      />
    </div>
  )
}
