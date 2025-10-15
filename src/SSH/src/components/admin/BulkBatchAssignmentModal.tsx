import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { XMarkIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { getBatches, assignStudentToBatch } from '../../lib/api/batches'
import { Batch, User } from '../../types'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import { sanitizeHtml } from '../../utils/sanitize'

interface BulkBatchAssignmentModalProps {
  students: User[]
  onClose: () => void
  onSuccess: () => void
}

const BulkBatchAssignmentModal: React.FC<BulkBatchAssignmentModalProps> = ({
  students,
  onClose,
  onSuccess,
}) => {
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([])
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const { profile } = useSupabaseAuth()
  const { user } = useWebsiteAuth()

  // Use whichever auth context is available (admin or teacher)
  const currentUserId = profile?.id || user?.id

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const allBatches = await getBatches({ is_active: true })
      const activeBatches = allBatches.filter((batch) => batch.status === 'active')
      setAvailableBatches(activeBatches)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId],
    )
  }

  const handleAssignBatches = async () => {
    if (!currentUserId || selectedBatches.length === 0) return

    setAssigning(true)
    try {
      // Assign each student to each selected batch
      await Promise.all(
        students.flatMap((student) =>
          selectedBatches.map((batchId) =>
            assignStudentToBatch(batchId, student.id, currentUserId),
          ),
        ),
      )

      setSelectedBatches([])
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error assigning batches:', error)
      alert('Failed to assign batches. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const filteredAvailableBatches = availableBatches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.description && batch.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      batch.gurukul?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex flex-col gap-2">
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
            <h2 className="text-xl font-semibold">Assign Students to Batches</h2>
            <p className="text-gray-600">
              Assigning {students.length} student{students.length !== 1 ? 's' : ''} to selected
              batches
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Selected Students List */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Students:</h3>
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <Badge key={student.id} className="bg-blue-100 text-blue-800">
                  {student.full_name || student.email}
                </Badge>
              ))}
            </div>
          </div>

          {/* Available Batches */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Select Batches ({filteredAvailableBatches.length})
              </h3>
              {selectedBatches.length > 0 && (
                <Button
                  onClick={handleAssignBatches}
                  disabled={assigning}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>
                    {assigning
                      ? 'Assigning...'
                      : `Assign to ${selectedBatches.length} Batch${selectedBatches.length !== 1 ? 'es' : ''}`}
                  </span>
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
                placeholder="Search batches..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {filteredAvailableBatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? 'No batches found matching your search.'
                    : 'No active batches available to assign.'}
                </div>
              ) : (
                filteredAvailableBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBatches.includes(batch.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleBatchSelect(batch.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatches.includes(batch.id)}
                      onChange={() => handleBatchSelect(batch.id)}
                      className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{batch.name}</div>
                      {batch.description && (
                        <div
                          className="text-sm text-gray-600 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(batch.description) }}
                        />
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
                        {batch.gurukul && (
                          <span className="text-xs text-gray-500">{batch.gurukul.name}</span>
                        )}
                        {batch.start_date && (
                          <span className="text-xs text-gray-500">
                            Starts: {new Date(batch.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Max students: {batch.max_students || 'Unlimited'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkBatchAssignmentModal
