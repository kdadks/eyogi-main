import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import {
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  getAttendanceRecords,
  getBatchAttendanceSummary,
  getAttendanceSessions,
} from '../../lib/api/attendance'
import { getBatches } from '../../lib/api/batches'
import { Batch, AttendanceRecord, BatchAttendanceSummary, AttendanceSession } from '../../types'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import AttendanceMarkingModal from './AttendanceMarkingModal'
import { toast } from 'react-hot-toast'

const AttendanceManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [summary, setSummary] = useState<BatchAttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMarkingModal, setShowMarkingModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Filter states
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: '',
  })

  const { user } = useWebsiteAuth()
  const profile = user // useWebsiteAuth returns 'user' which is the profile

  // Simplified permissions - teachers, business_admin, and super_admin can manage attendance
  const canCreate =
    profile?.role === 'teacher' ||
    profile?.role === 'business_admin' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'admin'
  const canUpdate = canCreate
  const canDelete = canCreate
  const canViewReports = canCreate

  const fetchBatches = useCallback(async () => {
    try {
      const batchData = await getBatches({
        teacher_id: profile?.role === 'teacher' ? profile.id : undefined,
        is_active: true,
      })
      setBatches(batchData)

      // Auto-select first batch if available
      if (batchData.length > 0 && !selectedBatch) {
        setSelectedBatch(batchData[0])
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Failed to fetch batches')
    }
  }, [profile, selectedBatch])

  const fetchAttendanceData = useCallback(async () => {
    if (!selectedBatch) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [recordsData, sessionsData, summaryData] = await Promise.all([
        getAttendanceRecords({
          batch_id: selectedBatch.id,
          start_date: dateFilter.start || undefined,
          end_date: dateFilter.end || undefined,
        }),
        getAttendanceSessions({
          batch_id: selectedBatch.id,
          start_date: dateFilter.start || undefined,
          end_date: dateFilter.end || undefined,
        }),
        getBatchAttendanceSummary(selectedBatch.id),
      ])

      setAttendanceRecords(recordsData)
      setSessions(sessionsData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast.error('Failed to fetch attendance data')
    } finally {
      setLoading(false)
    }
  }, [selectedBatch, dateFilter])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  const handleMarkAttendance = () => {
    if (!selectedBatch) {
      toast.error('Please select a batch first')
      return
    }
    setShowMarkingModal(true)
  }

  const handleModalClose = () => {
    setShowMarkingModal(false)
    fetchAttendanceData()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'late':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'excused':
        return <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success'
      case 'absent':
        return 'danger'
      case 'late':
        return 'warning'
      case 'excused':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateAttendancePercentage = (stats: {
    present: number
    late: number
    excused: number
    total_classes: number
  }) => {
    if (stats.total_classes === 0) return 0
    return Math.round(((stats.present + stats.late + stats.excused) / stats.total_classes) * 100)
  }

  if (loading && batches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Instructions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Attendance Management</h1>
        <p className="text-blue-100 text-lg mb-4">
          Track and manage student attendance for your batches
        </p>
        {/* Step-by-step guide */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center">
            <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
              📋
            </span>
            How to Mark Attendance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-blue-50">
            <div className="flex items-start">
              <span className="bg-white/30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                1
              </span>
              <span>Select the batch from the dropdown below</span>
            </div>
            <div className="flex items-start">
              <span className="bg-white/30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                2
              </span>
              <span>Choose the date for taking attendance</span>
            </div>
            <div className="flex items-start">
              <span className="bg-white/30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                3
              </span>
              <span>Click "Mark Attendance" button below</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Batch Selector */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              1
            </span>
            <CardTitle>Step 1: Select Your Batch</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Available</h3>
              <p className="text-sm text-gray-600 mb-4">
                {profile?.role === 'teacher'
                  ? 'You have not been assigned to any batches yet. Create a new batch or contact your administrator.'
                  : 'No active batches found. Create a new batch to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Batch <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBatch?.id || ''}
                  onChange={(e) => {
                    const batch = batches.find((b) => b.id === e.target.value)
                    setSelectedBatch(batch || null)
                  }}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Select a batch to manage attendance --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.gurukul?.name}) - {batch.student_count || 0} students
                    </option>
                  ))}
                </select>
                {!selectedBatch && (
                  <p className="text-sm text-gray-500 mt-2">Please select a batch to continue</p>
                )}
              </div>
            </div>
          )}

          {/* Batch Information & Date Selection */}
          {selectedBatch && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Batch Selected: {selectedBatch.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>{' '}
                    <Badge
                      variant={
                        selectedBatch.status === 'active' || selectedBatch.status === 'in_progress'
                          ? 'success'
                          : selectedBatch.status === 'completed'
                            ? 'default'
                            : 'warning'
                      }
                      size="sm"
                    >
                      {selectedBatch.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Students:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {selectedBatch.student_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gurukul:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {selectedBatch.gurukul?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 & 3: Date Selection and Mark Attendance */}
      {selectedBatch && canCreate && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <div className="flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              <CardTitle>Step 2: Choose Date & Mark Attendance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Attendance Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Attendance for:{' '}
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <Button
                  onClick={handleMarkAttendance}
                  variant="primary"
                  size="lg"
                  className="w-full shadow-lg bg-green-600 hover:bg-green-700 text-white py-4"
                >
                  <span className="bg-white/30 rounded-full w-6 h-6 inline-flex items-center justify-center text-xs font-bold mr-2">
                    3
                  </span>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Mark Attendance for {selectedBatch.name}
                </Button>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Opens a form to record attendance for all students in this batch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Historical Records - Date Range Filter */}
      {selectedBatch && (
        <Card>
          <CardHeader>
            <CardTitle>View Historical Attendance Records (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Start Date
                </label>
                <Input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  placeholder={
                    selectedBatch?.start_date
                      ? new Date(selectedBatch.start_date).toISOString().split('T')[0]
                      : undefined
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter End Date
                </label>
                <Input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  placeholder={
                    selectedBatch?.end_date
                      ? new Date(selectedBatch.end_date).toISOString().split('T')[0]
                      : undefined
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_students}</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_sessions}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.average_attendance_percentage.toFixed(1)}%
                  </p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Attendance Summary */}
      {summary && summary.student_summaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Excused
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.student_summaries.map((studentSummary) => (
                    <tr key={studentSummary.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {studentSummary.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {studentSummary.student_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {studentSummary.stats.total_classes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="success">{studentSummary.stats.present}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="danger">{studentSummary.stats.absent}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="warning">{studentSummary.stats.late}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{studentSummary.stats.excused}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`text-sm font-semibold ${
                              studentSummary.stats.attendance_percentage >= 75
                                ? 'text-green-600'
                                : studentSummary.stats.attendance_percentage >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {studentSummary.stats.attendance_percentage.toFixed(1)}%
                          </span>
                          <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                studentSummary.stats.attendance_percentage >= 75
                                  ? 'bg-green-600'
                                  : studentSummary.stats.attendance_percentage >= 50
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                              }`}
                              style={{
                                width: `${studentSummary.stats.attendance_percentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance Records */}
      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marked By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.slice(0, 10).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.class_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.student?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{record.student?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.marked_by_user?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!selectedBatch && (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Batch Selected</h3>
            <p className="text-gray-600">Please select a batch to view attendance records</p>
          </CardContent>
        </Card>
      )}

      {selectedBatch && attendanceRecords.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
            <p className="text-gray-600 mb-4">Start marking attendance for {selectedBatch.name}</p>
            {canCreate && (
              <Button onClick={handleMarkAttendance} variant="primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Mark Attendance
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Marking Modal */}
      {showMarkingModal && selectedBatch && (
        <AttendanceMarkingModal
          batch={selectedBatch}
          selectedDate={selectedDate}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}
    </div>
  )
}

export default AttendanceManagement
