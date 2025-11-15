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
        data?.map((item: BatchStudentRow) => ({
          student_id: item.student_id,
          student_name: item.student?.[0]?.full_name || 'Unknown',
          student_email: item.student?.[0]?.email || '',
          student_number: item.student?.[0]?.student_id || undefined,
          status: existingMap.get(item.student_id)?.status || 'present',
          notes: existingMap.get(item.student_id)?.notes || '',
        })) || []

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
        return 'bg-green-100 text-green-800 border-green-300'
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-300'
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
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
              <p className="text-sm text-gray-600 mt-1">
                {batch.name} -{' '}
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={saving}
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-sm text-green-600">Present</p>
              <p className="text-xl font-bold text-green-700">{attendanceStats.present}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-sm text-red-600">Absent</p>
              <p className="text-xl font-bold text-red-700">{attendanceStats.absent}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-sm text-yellow-600">Late</p>
              <p className="text-xl font-bold text-yellow-700">{attendanceStats.late}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-600">Excused</p>
              <p className="text-xl font-bold text-blue-700">{attendanceStats.excused}</p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Topic (Optional)
              </label>
              <Input
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g., Introduction to Yoga Philosophy"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Any additional notes about this session..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleMarkAll('present')}
                variant="outline"
                size="sm"
                disabled={saving}
              >
                Mark All Present
              </Button>
              <Button
                onClick={() => handleMarkAll('absent')}
                variant="outline"
                size="sm"
                disabled={saving}
              >
                Mark All Absent
              </Button>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'No students found matching your search' : 'No students in this batch'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.student_id}
                  className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(student.status)}`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{student.student_name}</div>
                      <div className="text-sm text-gray-600">{student.student_email}</div>
                      {student.student_number && (
                        <div className="text-xs text-gray-500">ID: {student.student_number}</div>
                      )}
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2 flex-wrap md:flex-nowrap">
                      {['present', 'absent', 'late', 'excused'].map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusChange(
                              student.student_id,
                              status as StudentAttendance['status'],
                            )
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                            student.status === status
                              ? getStatusColor(status) + ' border-2'
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                          }`}
                          disabled={saving}
                        >
                          {getStatusIcon(status)}
                          <span className="capitalize">{status}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={student.notes}
                      onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                      placeholder="Add notes (optional)..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <Button onClick={onClose} variant="outline" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary" loading={saving} disabled={loading}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AttendanceMarkingModal
