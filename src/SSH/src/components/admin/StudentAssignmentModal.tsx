import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import {
  getBatchStudents,
  assignStudentToBatch,
  removeStudentFromBatch,
} from '../../lib/api/batches'
import { getAllUsers } from '../../lib/api/users'
import { Batch, BatchStudent, User } from '../../types'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'

interface StudentAssignmentModalProps {
  batch: Batch
  onClose: () => void
  onSuccess: () => void
}

const StudentAssignmentModal: React.FC<StudentAssignmentModalProps> = ({
  batch,
  onClose,
  onSuccess,
}) => {
  const [assignedStudents, setAssignedStudents] = useState<BatchStudent[]>([])
  const [availableStudents, setAvailableStudents] = useState<User[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const { profile } = useSupabaseAuth()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [batchStudents, allUsers] = await Promise.all([
        getBatchStudents(batch.id),
        getAllUsers(),
      ])

      setAssignedStudents(batchStudents)

      // Filter out already assigned students
      const assignedStudentIds = new Set(batchStudents.map((bs) => bs.student_id))
      const students = allUsers.filter(
        (user) => user.role === 'student' && !assignedStudentIds.has(user.id),
      )
      setAvailableStudents(students)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [batch.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleAssignStudents = async () => {
    if (!profile || selectedStudents.length === 0) return

    setAssigning(true)
    try {
      // Assign each selected student
      await Promise.all(
        selectedStudents.map((studentId) => assignStudentToBatch(batch.id, studentId, profile.id)),
      )

      // Refresh data and clear selection
      await fetchData()
      setSelectedStudents([])
      onSuccess()
    } catch (error) {
      console.error('Error assigning students:', error)
      alert('Failed to assign students. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!profile) return

    if (window.confirm('Are you sure you want to remove this student from the batch?')) {
      try {
        await removeStudentFromBatch(batch.id, studentId)
        await fetchData()
        onSuccess()
      } catch (error) {
        console.error('Error removing student:', error)
        alert('Failed to remove student. Please try again.')
      }
    }
  }

  const filteredAvailableStudents = availableStudents.filter(
    (student) =>
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Manage Students</h2>
            <p className="text-gray-600">Batch: {batch.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currently Assigned Students */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Assigned Students ({assignedStudents.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No students assigned to this batch yet.
                  </div>
                ) : (
                  assignedStudents.map((batchStudent) => (
                    <div
                      key={batchStudent.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {batchStudent.student?.full_name || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-600">{batchStudent.student?.email}</div>
                        {batchStudent.student?.student_id && (
                          <div className="text-sm text-gray-500">
                            ID: {batchStudent.student.student_id}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned: {new Date(batchStudent.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveStudent(batchStudent.student_id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Students */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Available Students ({filteredAvailableStudents.length})
                </h3>
                {selectedStudents.length > 0 && (
                  <Button
                    onClick={handleAssignStudents}
                    disabled={assigning}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>{assigning ? 'Assigning...' : `Assign ${selectedStudents.length}`}</span>
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailableStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? 'No students found matching your search.'
                      : 'No available students to assign.'}
                  </div>
                ) : (
                  filteredAvailableStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudents.includes(student.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStudentSelect(student.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{student.full_name || 'Unnamed Student'}</div>
                        <div className="text-sm text-gray-600">{student.email}</div>
                        {student.student_id && (
                          <div className="text-sm text-gray-500">ID: {student.student_id}</div>
                        )}
                        <Badge variant="outline" className="text-xs mt-1">
                          {student.role}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentAssignmentModal
