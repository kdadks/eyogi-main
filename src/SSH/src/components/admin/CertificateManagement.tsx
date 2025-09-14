import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Certificate } from '@/types'
import { getStudentCertificates, issueCertificate, bulkIssueCertificates } from '@/lib/api/certificates'
import { getAllEnrollments } from '@/lib/api/enrollments'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface CertificateTemplate {
  id: string
  name: string
  type: 'student' | 'teacher'
  is_active: boolean
  created_at: string
}

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [completedEnrollments, setCompletedEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'certificates' | 'templates' | 'issue'>('certificates')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load all certificates (we'll need to aggregate from all students)
      const allEnrollments = await getAllEnrollments()
      const completedWithoutCerts = allEnrollments.filter(e => 
        e.status === 'completed' && !e.certificate_issued
      )
      
      setCompletedEnrollments(completedWithoutCerts)
      
      // Mock templates data
      setTemplates([
        {
          id: 'template-1',
          name: 'Student Course Completion - Traditional',
          type: 'student',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'template-2',
          name: 'Student Course Completion - Modern',
          type: 'student',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'template-3',
          name: 'Teacher Qualification Certificate',
          type: 'teacher',
          is_active: false,
          created_at: new Date().toISOString()
        }
      ])

      // Mock recent certificates
      setCertificates([])
      
    } catch (error) {
      console.error('Error loading certificate data:', error)
      toast.error('Failed to load certificate data')
    } finally {
      setLoading(false)
    }
  }

  const handleIssueCertificate = async (enrollmentId: string) => {
    try {
      await issueCertificate(enrollmentId)
      await loadData()
      toast.success('Certificate issued successfully')
    } catch (error) {
      console.error('Error issuing certificate:', error)
      toast.error('Failed to issue certificate')
    }
  }

  const handleBulkIssueCertificates = async () => {
    if (selectedEnrollments.size === 0) {
      toast.error('Please select enrollments to issue certificates for')
      return
    }

    try {
      await bulkIssueCertificates(Array.from(selectedEnrollments))
      await loadData()
      setSelectedEnrollments(new Set())
      toast.success(`${selectedEnrollments.size} certificates issued successfully`)
    } catch (error) {
      console.error('Error issuing certificates:', error)
      toast.error('Failed to issue certificates')
    }
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
      setSelectedEnrollments(new Set(completedEnrollments.map(e => e.id)))
    }
  }

  const filteredEnrollments = completedEnrollments.filter(enrollment =>
    enrollment.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'certificates', name: 'Recent Certificates', icon: DocumentTextIcon },
            { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
            { id: 'issue', name: 'Issue Certificates', icon: PlusIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Recent Certificates Tab */}
      {activeTab === 'certificates' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Recent Certificates</h2>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates issued yet</h3>
                <p className="text-gray-600">Certificates will appear here once they are issued to students.</p>
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
                        <td className="px-6 py-4 text-sm">
                          {certificate.student?.full_name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {certificate.course?.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(certificate.issued_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
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

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Certificate Templates</h2>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <DocumentTextIcon className="h-8 w-8 text-orange-600" />
                      <Badge className={template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Type: {template.type === 'student' ? 'Student Certificate' : 'Teacher Certificate'}
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issue Certificates Tab */}
      {activeTab === 'issue' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <h2 className="text-xl font-bold">Issue Certificates</h2>
              
              <div className="flex items-center space-x-4">
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

            {selectedEnrollments.size > 0 && (
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedEnrollments.size} enrollment{selectedEnrollments.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  onClick={handleBulkIssueCertificates}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Issue {selectedEnrollments.size} Certificate{selectedEnrollments.size !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses</h3>
                <p className="text-gray-600">No completed courses are waiting for certificate issuance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedEnrollments.size === filteredEnrollments.length && filteredEnrollments.length > 0}
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
                            {enrollment.student?.student_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.course?.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.course?.course_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {enrollment.completed_at ? formatDate(enrollment.completed_at) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            onClick={() => handleIssueCertificate(enrollment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Issue Certificate
                          </Button>
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
    </div>
  )
}