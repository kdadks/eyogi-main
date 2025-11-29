import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  getAuditTrailEntries,
  getAuditTrailStats,
  exportAuditTrail,
  ENCRYPTED_FIELDS,
  type AuditTrailEntryDecrypted,
  type AuditTrailFilters,
} from '@/lib/api/auditTrail'
import toast from 'react-hot-toast'

export default function AuditTrailManagement() {
  const [entries, setEntries] = useState<AuditTrailEntryDecrypted[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AuditTrailEntryDecrypted | null>(null)
  const [stats, setStats] = useState<{
    totalChanges: number
    changesByAction: Record<string, number>
    changesByTable: Record<string, number>
    changesByField: Record<string, number>
    changesByRole: Record<string, number>
    recentChangers: Array<{ email: string; name: string; role: string; count: number }>
  } | null>(null)

  const [filters, setFilters] = useState<AuditTrailFilters>({
    page: 1,
    limit: 20,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [entriesResult, statsResult] = await Promise.all([
        getAuditTrailEntries(filters),
        getAuditTrailStats(filters.start_date, filters.end_date),
      ])
      setEntries(entriesResult.entries)
      setTotal(entriesResult.total)
      setStats(statsResult)
    } catch (error) {
      console.error('Error loading audit trail:', error)
      toast.error('Failed to load audit trail')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportData = await exportAuditTrail(filters)

      // Convert to CSV - include all fields from the table
      const headers = [
        'Date/Time',
        'Changed By (Name)',
        'Changed By (Email)',
        'Changed By (Role)',
        'Affected User (Name)',
        'Affected User (Email)',
        'Action',
        'Field',
        'Old Value',
        'New Value',
      ]

      const rows = exportData.map((entry) => [
        new Date(entry.changed_at).toLocaleString(),
        entry.changed_by_name,
        entry.changed_by_email,
        entry.changed_by_role,
        entry.affected_user_name || '',
        entry.affected_user_email || '',
        entry.action,
        entry.field_name,
        entry.old_value_decrypted || '',
        entry.new_value_decrypted || '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Audit trail exported successfully')
    } catch (error) {
      console.error('Error exporting audit trail:', error)
      toast.error('Failed to export audit trail')
    } finally {
      setExporting(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: keyof AuditTrailFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page on filter change
    }))
  }

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <PlusIcon className="h-4 w-4" />
      case 'UPDATE':
        return <PencilIcon className="h-4 w-4" />
      case 'DELETE':
        return <TrashIcon className="h-4 w-4" />
      default:
        return <DocumentTextIcon className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'business_admin':
        return 'bg-orange-100 text-orange-800'
      case 'teacher':
        return 'bg-green-100 text-green-800'
      case 'student':
        return 'bg-blue-100 text-blue-800'
      case 'parent':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const totalPages = Math.ceil(total / (filters.limit || 20))
  const currentPage = filters.page || 1

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit trail...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={exporting || entries.length === 0}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Changes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChanges}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Updates</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.changesByAction['UPDATE'] || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <PencilIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Creates</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.changesByAction['CREATE'] || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <PlusIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deletes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.changesByAction['DELETE'] || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                <select
                  value={filters.field_name || ''}
                  onChange={(e) => handleFilterChange('field_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Fields</option>
                  {ENCRYPTED_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {formatFieldName(field)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Changed By Role
                </label>
                <select
                  value={filters.changed_by_role || ''}
                  onChange={(e) => handleFilterChange('changed_by_role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="business_admin">Business Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Changed By Email
                </label>
                <input
                  type="text"
                  value={filters.changed_by_email || ''}
                  onChange={(e) => handleFilterChange('changed_by_email', e.target.value)}
                  placeholder="Search by email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date?.split('T')[0] || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'start_date',
                      e.target.value ? new Date(e.target.value).toISOString() : '',
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.end_date?.split('T')[0] || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'end_date',
                      e.target.value ? new Date(e.target.value).toISOString() : '',
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record ID</label>
                <input
                  type="text"
                  value={filters.record_id || ''}
                  onChange={(e) => handleFilterChange('record_id', e.target.value)}
                  placeholder="Filter by record UUID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail Table */}
      <Card>
        <CardContent className="pt-4">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit trail entries</h3>
              <p className="text-gray-600">
                Changes to encrypted fields will appear here once they are tracked.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changed By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Old Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(entry.changed_at).toLocaleDateString()}{' '}
                            {new Date(entry.changed_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.changed_by_name}
                            </div>
                            <div className="text-xs text-gray-500 italic">
                              {entry.changed_by_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.affected_user_name || (
                                <span className="text-gray-400">Unknown</span>
                              )}
                            </div>
                            {entry.affected_user_email && (
                              <div className="text-xs text-gray-500 italic">
                                {entry.affected_user_email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            className={`${getActionColor(entry.action)} flex items-center gap-1 w-fit`}
                          >
                            {getActionIcon(entry.action)}
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {formatFieldName(entry.field_name)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {entry.old_value_decrypted || (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {entry.new_value_decrypted || (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${getActionColor(entry.action)} flex items-center gap-1`}
                          >
                            {getActionIcon(entry.action)}
                            {entry.action}
                          </Badge>
                          <Badge className={getRoleColor(entry.changed_by_role)}>
                            {entry.changed_by_role}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(entry.changed_at).toLocaleDateString()}{' '}
                          {new Date(entry.changed_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                        className="ml-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-500 mb-1">Changed By</p>
                        <p className="text-sm font-medium text-gray-900">{entry.changed_by_name}</p>
                        <p className="text-xs text-gray-500">{entry.changed_by_email}</p>
                      </div>

                      {entry.affected_user_name && (
                        <div className="border-t pt-2">
                          <p className="text-xs text-gray-500 mb-1">Affected User</p>
                          <p className="text-sm font-medium text-gray-900">
                            {entry.affected_user_name}
                          </p>
                          {entry.affected_user_email && (
                            <p className="text-xs text-gray-500">{entry.affected_user_email}</p>
                          )}
                        </div>
                      )}

                      <div className="border-t pt-2">
                        <p className="text-xs text-gray-500 mb-1">Field Changed</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatFieldName(entry.field_name)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t pt-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Old Value</p>
                          <p className="text-sm text-gray-600 truncate">
                            {entry.old_value_decrypted || (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">New Value</p>
                          <p className="text-sm text-gray-600 truncate">
                            {entry.new_value_decrypted || (
                              <span className="text-gray-400 italic">Empty</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <span className="hidden sm:inline">
                      Page {currentPage} of {totalPages}
                    </span>
                    <span className="sm:hidden">
                      Page {currentPage}/{totalPages}
                    </span>
                    <span className="ml-2">({total} total records)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <span className="text-sm text-gray-600 px-2">{currentPage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-base font-semibold text-gray-900">Change Details</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
                <p className="text-xs font-medium text-orange-700">Affected User</p>
                <p className="text-sm font-semibold text-orange-900">
                  {selectedEntry.affected_user_name || 'Unknown User'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Date/Time:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(selectedEntry.changed_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Changed By:</span>{' '}
                  <span className="text-gray-900">{selectedEntry.changed_by_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Action:</span>{' '}
                  <Badge className={getActionColor(selectedEntry.action)}>
                    {selectedEntry.action}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Field:</span>{' '}
                  <span className="text-gray-900">{formatFieldName(selectedEntry.field_name)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs font-medium text-red-700 mb-1">Old Value</p>
                  <p className="text-sm text-red-900 break-words">
                    {selectedEntry.old_value_decrypted || (
                      <span className="text-red-400 italic">Empty</span>
                    )}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-xs font-medium text-green-700 mb-1">New Value</p>
                  <p className="text-sm text-green-900 break-words">
                    {selectedEntry.new_value_decrypted || (
                      <span className="text-green-400 italic">Empty</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Changers Card */}
      {stats && stats.recentChangers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Most Active Users</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentChangers.map((changer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{changer.name}</p>
                      <p className="text-sm text-gray-600">{changer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{changer.count}</p>
                    <p className="text-xs text-gray-600">changes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
