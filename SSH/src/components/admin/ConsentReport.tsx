import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ConsentStatusBadge from '../consent/ConsentStatusBadge'
import ConsentAuditModal from '../consent/ConsentAuditModal'
import { getAllConsents, getStudentConsent, StudentConsent } from '../../lib/api/consent'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function ConsentReport() {
  const [consents, setConsents] = useState<StudentConsent[]>([])
  const [filteredConsents, setFilteredConsents] = useState<StudentConsent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'given' | 'not_given' | 'withdrawn'>('all')
  const [showConsentAudit, setShowConsentAudit] = useState(false)
  const [selectedConsentForAudit, setSelectedConsentForAudit] = useState<StudentConsent | null>(null)
  const [selectedStudentNameForAudit, setSelectedStudentNameForAudit] = useState<string>('')

  useEffect(() => {
    loadConsents()
  }, [])

  useEffect(() => {
    filterConsents()
  }, [consents, searchTerm, statusFilter])

  const loadConsents = async () => {
    try {
      setLoading(true)
      const result = await getAllConsents()
      setConsents(result.data || [])
    } catch (error) {
      console.error('Error loading consents:', error)
      toast.error('Failed to load consent data')
    } finally {
      setLoading(false)
    }
  }

  const filterConsents = () => {
    let filtered = consents

    // Status filter
    if (statusFilter === 'given') {
      filtered = filtered.filter((c) => c.consent_given && !c.withdrawn)
    } else if (statusFilter === 'not_given') {
      filtered = filtered.filter((c) => !c.consent_given)
    } else if (statusFilter === 'withdrawn') {
      filtered = filtered.filter((c) => c.withdrawn)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.student?.full_name?.toLowerCase().includes(search) ||
          c.student?.email?.toLowerCase().includes(search) ||
          c.student?.student_id?.toLowerCase().includes(search) ||
          c.consented_by_user?.full_name?.toLowerCase().includes(search),
      )
    }

    setFilteredConsents(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Student ID',
      'Student Email',
      'Consent Status',
      'Consented By',
      'Consented By Email',
      'Consent Date',
      'IP Address',
      'Withdrawn',
      'Withdrawn Date',
      'Withdrawn Reason',
    ]

    const rows = filteredConsents.map((c) => [
      c.student?.full_name || 'N/A',
      c.student?.student_id || 'N/A',
      c.student?.email || 'N/A',
      c.withdrawn ? 'Withdrawn' : c.consent_given ? 'Given' : 'Not Given',
      c.consented_by_user?.full_name || 'N/A',
      c.consented_by_user?.email || 'N/A',
      c.consent_date ? new Date(c.consent_date).toLocaleString() : 'N/A',
      c.ip_address || 'N/A',
      c.withdrawn ? 'Yes' : 'No',
      c.withdrawn_date ? new Date(c.withdrawn_date).toLocaleString() : 'N/A',
      c.withdrawn_reason || 'N/A',
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consent-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success('Report exported successfully')
  }

  const handleRowClick = async (consent: StudentConsent) => {
    // Refresh consent data to get the latest
    const freshConsent = await getStudentConsent(consent.student_id)
    if (freshConsent) {
      setSelectedConsentForAudit(freshConsent)
      setSelectedStudentNameForAudit(freshConsent.student?.full_name || 'Unknown')
      setShowConsentAudit(true)
    }
  }

  const stats = {
    total: consents.length,
    given: consents.filter((c) => c.consent_given && !c.withdrawn).length,
    notGiven: consents.filter((c) => !c.consent_given).length,
    withdrawn: consents.filter((c) => c.withdrawn).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Consent Report</h2>
          <p className="text-gray-600 mt-1">Comprehensive audit trail of all student consents</p>
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={filteredConsents.length === 0}
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Records</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
              </div>
              <DocumentTextIcon className="h-12 w-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Consent Given</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.given}</p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">No Consent</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.notGiven}</p>
              </div>
              <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Withdrawn</p>
                <p className="text-3xl font-bold text-red-900 mt-2">{stats.withdrawn}</p>
              </div>
              <XCircleIcon className="h-12 w-12 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by student name, ID, or consenter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="given">Consent Given</option>
                <option value="not_given">No Consent</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Consent Records ({filteredConsents.length})
          </h3>
        </CardHeader>
        <CardContent>
          {filteredConsents.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No consent records found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consented By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConsents.map((consent) => (
                    <tr
                      key={consent.id}
                      onClick={() => handleRowClick(consent)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {consent.student?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {consent.student?.student_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ConsentStatusBadge
                          consentGiven={consent.consent_given}
                          withdrawn={consent.withdrawn}
                          size="sm"
                          showLabel={true}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {consent.consented_by_user?.full_name || 'N/A'}
                          </div>
                          <div className="text-gray-500">
                            {consent.consented_by_user?.email || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {consent.consent_date ? formatDate(consent.consent_date) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono">
                          {consent.ip_address || 'Not recorded'}
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

      {/* Consent Audit Modal */}
      {showConsentAudit && selectedConsentForAudit && (
        <ConsentAuditModal
          consent={selectedConsentForAudit}
          studentName={selectedStudentNameForAudit}
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
