import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'
import { bulkMarkAttendance, createAttendanceSession } from '../../lib/api/attendance'
import { Batch } from '../../types'
import { toast } from 'react-hot-toast'
import { supabaseAdmin } from '../../lib/supabase'
import { decryptProfileFields } from '../../lib/encryption'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'

interface AttendanceMarkingModalProps {
  batch: Batch
  selectedDate: string
  onClose: () => void
  onSuccess: () => void
}

interface StudentAttendance {
  student_id: string
  student_name: string
  student_email: string
  student_number?: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes: string
}

interface BatchStudentRow {
  student_id: string
  student: Array<{
    id: string
    full_name: string
    email: string
    student_id: string
  }>
}

const AttendanceMarkingModal: React.FC<AttendanceMarkingModalProps> = ({
  batch,
  selectedDate,
  onClose,
  onSuccess,
}) => {
  const { user } = useWebsiteAuth()
  const profile = user // useWebsiteAuth returns 'user' which is the profile
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionTopic, setSessionTopic] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBatchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseAdmin
        .from('batch_students')
        .select(
          `
          student_id,
          student:profiles!batch_students_student_id_fkey (
            id,
            full_name,
            email,
            student_id
          )
        `,
        )
        .eq('batch_id', batch.id)
        .eq('is_active', true)
        .order('student(full_name)', { ascending: true })

      if (error) throw error

      // Check if attendance is already marked for this date
      const { data: existingRecords } = await supabaseAdmin
        .from('attendance_records')
        .select('student_id, status, notes')
        .eq('batch_id', batch.id)
        .eq('class_date', selectedDate)

      const existingMap = new Map(
        existingRecords?.map((r) => [r.student_id, { status: r.status, notes: r.notes || '' }]) ||
          [],
      )

      const studentList: StudentAttendance[] =
        data?.map((item: BatchStudentRow) => {
          const decryptedStudent = item.student ? decryptProfileFields(item.student) : null
          return {
            student_id: item.student_id,
            student_name: decryptedStudent?.full_name || 'Unknown',
            student_email: decryptedStudent?.email || '',
            student_number: decryptedStudent?.student_id || undefined,
            status: existingMap.get(item.student_id)?.status || 'present',
            notes: existingMap.get(item.student_id)?.notes || '',
          }
        }) || []

      setStudents(studentList)
    } catch (error) {
      console.error('Error fetching batch students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }, [batch.id, selectedDate])

  useEffect(() => {
    fetchBatchStudents()
  }, [fetchBatchStudents])

  const handleStatusChange = (studentId: string, status: StudentAttendance['status']) => {
    setStudents((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, status } : s)))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, notes } : s)))
  }

  const handleMarkAll = (status: StudentAttendance['status']) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })))
  }

  const handleSave = async () => {
    if (!profile) {
      toast.error('User not authenticated')
      return
    }

    setSaving(true)
    try {
      // Create attendance session if topic is provided
      if (sessionTopic.trim()) {
        const sessionNumber =
          (await supabaseAdmin
            .from('attendance_sessions')
            .select('session_number', { count: 'exact' })
            .eq('batch_id', batch.id)
            .order('session_number', { ascending: false })
            .limit(1)
            .then((res) => (res.data?.[0]?.session_number || 0) + 1)) || 1

        await createAttendanceSession({
          batch_id: batch.id,
          class_date: selectedDate,
          session_number: sessionNumber,
          topic: sessionTopic,
          notes: sessionNotes,
          created_by: profile.id,
        })
      }

      // Mark attendance for all students
      const result = await bulkMarkAttendance({
        batch_id: batch.id,
        class_date: selectedDate,
        marked_by: profile.id,
        attendance_records: students.map((s) => ({
          student_id: s.student_id,
          status: s.status,
          notes: s.notes || undefined,
        })),
      })

      if (result.success) {
        toast.success('Attendance marked successfully')
        onSuccess()
      } else {
        toast.error(`Failed to mark attendance for some students: ${result.errors.join(', ')}`)
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast.error('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'absent':
        return <XCircleIcon className="h-5 w-5" />
      case 'late':
        return <ClockIcon className="h-5 w-5" />
      case 'excused':
        return <DocumentCheckIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 text-white border-green-600'
      case 'absent':
        return 'bg-red-500 text-white border-red-600'
      case 'late':
        return 'bg-yellow-500 text-white border-yellow-600'
      case 'excused':
        return 'bg-blue-500 text-white border-blue-600'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_number?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const attendanceStats = {
    total: students.length,
    present: students.filter((s) => s.status === 'present').length,
    absent: students.filter((s) => s.status === 'absent').length,
    late: students.filter((s) => s.status === 'late').length,
    excused: students.filter((s) => s.status === 'excused').length,
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-4 border-blue-500 ring-4 ring-blue-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {batch.name} -{' '}
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
              disabled={saving}
            >
              <XMarkIcon className="h-5 w-5 text-red-600" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-white rounded-md p-2 text-center border border-gray-200">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg font-bold text-gray-900">{attendanceStats.total}</p>
            </div>
            <div className="bg-green-500 rounded-md p-2 text-center">
              <p className="text-xs text-white">Present</p>
              <p className="text-lg font-bold text-white">{attendanceStats.present}</p>
            </div>
            <div className="bg-red-500 rounded-md p-2 text-center">
              <p className="text-xs text-white">Absent</p>
              <p className="text-lg font-bold text-white">{attendanceStats.absent}</p>
            </div>
            <div className="bg-yellow-500 rounded-md p-2 text-center">
              <p className="text-xs text-white">Late</p>
              <p className="text-lg font-bold text-white">{attendanceStats.late}</p>
            </div>
            <div className="bg-blue-500 rounded-md p-2 text-center">
              <p className="text-xs text-white">Excused</p>
              <p className="text-lg font-bold text-white">{attendanceStats.excused}</p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Session Topic (Optional)
              </label>
              <Input
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g., Introduction to Yoga Philosophy"
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleMarkAll('present')}
                variant="outline"
                size="sm"
                disabled={saving}
                className="bg-green-500 text-white border-green-600 hover:bg-green-600"
              >
                All Present
              </Button>
              <Button
                onClick={() => handleMarkAll('absent')}
                variant="outline"
                size="sm"
                disabled={saving}
                className="bg-red-500 text-white border-red-600 hover:bg-red-600"
              >
                All Absent
              </Button>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg"></div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No students found matching your search' : 'No students in this batch'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.student_id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-3 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row gap-3 items-start">
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {student.student_name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">{student.student_email}</div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-1.5 flex-wrap">
                      {['present', 'absent', 'late', 'excused'].map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusChange(
                              student.student_id,
                              status as StudentAttendance['status'],
                            )
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            student.status === status
                              ? status === 'present'
                                ? 'bg-green-500 text-white border-2 border-green-600'
                                : status === 'absent'
                                  ? 'bg-red-500 text-white border-2 border-red-600'
                                  : status === 'late'
                                    ? 'bg-yellow-500 text-white border-2 border-yellow-600'
                                    : 'bg-blue-500 text-white border-2 border-blue-600'
                              : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                          }`}
                          disabled={saving}
                        >
                          {getStatusIcon(status)}
                          <span className="capitalize hidden sm:inline">{status}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes - shown on focus or when there's content */}
                  <div className="mt-2">
                    <input
                      type="text"
                      value={student.notes}
                      onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                      placeholder="Add notes (optional)..."
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white"
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={saving}
            size="sm"
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            loading={saving}
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AttendanceMarkingModal
