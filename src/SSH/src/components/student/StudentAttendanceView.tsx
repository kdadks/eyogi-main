import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { getStudentAttendanceSummary, getAttendanceRecords } from '../../lib/api/attendance'
import { StudentAttendanceSummary, AttendanceRecord } from '../../types'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'

interface StudentAttendanceViewProps {
  studentId?: string // If provided, shows attendance for this student (used by parents)
}

const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({ studentId }) => {
  const { profile } = useSupabaseAuth()
  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [detailedRecords, setDetailedRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: '',
  })

  // Use provided studentId or current user's ID
  const effectiveStudentId = studentId || profile?.id

  useEffect(() => {
    if (effectiveStudentId) {
      fetchAttendanceSummary()
    }
  }, [effectiveStudentId])

  useEffect(() => {
    if (selectedBatchId && effectiveStudentId) {
      fetchDetailedRecords()
    }
  }, [selectedBatchId, effectiveStudentId, dateFilter])

  const fetchAttendanceSummary = async () => {
    if (!effectiveStudentId) {
      console.log('StudentAttendanceView: No student ID available')
      setLoading(false)
      return
    }

    console.log('StudentAttendanceView: Fetching attendance for student:', effectiveStudentId)
    setLoading(true)
    try {
      const data = await getStudentAttendanceSummary(effectiveStudentId)
      console.log('StudentAttendanceView: Received attendance data:', data)
      setSummaries(data)

      // Auto-select first batch if available
      if (data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(data[0].batch_id)
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedRecords = async () => {
    if (!effectiveStudentId || !selectedBatchId) return

    try {
      const records = await getAttendanceRecords({
        batch_id: selectedBatchId,
        student_id: effectiveStudentId,
        start_date: dateFilter.start || undefined,
        end_date: dateFilter.end || undefined,
      })
      setDetailedRecords(records)
    } catch (error) {
      console.error('Error fetching detailed records:', error)
    }
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

  const selectedSummary = summaries.find((s) => s.batch_id === selectedBatchId)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
          <p className="text-gray-600">
            You are not enrolled in any batches yet or no attendance has been marked.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Batch Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedBatchId || ''}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {summaries.map((summary) => (
              <option key={summary.batch_id} value={summary.batch_id}>
                {summary.batch_name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {selectedSummary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedSummary.stats.total_classes}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedSummary.stats.present}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <XCircleIcon className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-600 mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{selectedSummary.stats.absent}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-600 mb-1">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{selectedSummary.stats.late}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <DocumentCheckIcon className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-600 mb-1">Excused</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedSummary.stats.excused}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <ChartBarIcon className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-600 mb-1">Attendance %</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedSummary.stats.attendance_percentage.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Percentage Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Overall Attendance</h3>
                <span
                  className={`text-2xl font-bold ${
                    selectedSummary.stats.attendance_percentage >= 75
                      ? 'text-green-600'
                      : selectedSummary.stats.attendance_percentage >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {selectedSummary.stats.attendance_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className={`h-6 rounded-full flex items-center justify-end px-3 text-white text-sm font-medium transition-all ${
                    selectedSummary.stats.attendance_percentage >= 75
                      ? 'bg-green-600'
                      : selectedSummary.stats.attendance_percentage >= 50
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{
                    width: `${Math.max(selectedSummary.stats.attendance_percentage, 5)}%`,
                  }}
                >
                  {selectedSummary.stats.attendance_percentage > 5 && (
                    <span>{selectedSummary.stats.attendance_percentage.toFixed(1)}%</span>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {selectedSummary.stats.attendance_percentage >= 75 ? (
                  <span className="text-green-600 font-medium">✓ Excellent attendance!</span>
                ) : selectedSummary.stats.attendance_percentage >= 50 ? (
                  <span className="text-yellow-600 font-medium">
                    ⚠ Try to improve your attendance
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    ⚠ Low attendance - please contact your teacher
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance Records */}
      {detailedRecords.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
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
                  {detailedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.class_date)}
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600">
              No attendance records available for the selected date range.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StudentAttendanceView
