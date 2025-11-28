import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader } from '../ui/Card'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getUserComplianceStatus,
  getComplianceStats,
  markComplianceAsComplete,
} from '../../lib/api/compliance'
import ComplianceFormModal from './ComplianceFormModal'
import type { ComplianceChecklistItem, ComplianceStats, UserRole } from '../../types/compliance'

interface ComplianceChecklistProps {
  userId: string
  userRole: UserRole
  className?: string
}

export default function ComplianceChecklist({
  userId,
  userRole,
  className = '',
}: ComplianceChecklistProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ComplianceChecklistItem[]>([])
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [selectedItem, setSelectedItem] = useState<ComplianceChecklistItem | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)

  const loadComplianceData = useCallback(async () => {
    setLoading(true)
    try {
      const [checklistItems, complianceStats] = await Promise.all([
        getUserComplianceStatus(userId, userRole),
        getComplianceStats(userId, userRole),
      ])

      setItems(checklistItems)
      setStats(complianceStats)
    } catch (error) {
      console.error('Error loading compliance data:', error)
      toast.error('Failed to load compliance information')
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    loadComplianceData()
  }, [loadComplianceData])

  const handleCheckboxChange = async (item: ComplianceChecklistItem) => {
    // Don't allow unchecking or re-checking submitted/approved items
    if (item.status === 'submitted' || item.status === 'approved') {
      toast('This item has already been submitted for review', { icon: 'ℹ️' })
      return
    }

    try {
      await markComplianceAsComplete(item.id, userId)
      toast.success(
        'Thank you for completing this compliance item. Admin will check and provide confirmation.',
        { duration: 5000 },
      )
      // Reload compliance data to show updated status
      await loadComplianceData()
    } catch (error) {
      console.error('Error marking compliance as complete:', error)

      // More detailed error message
      let errorMessage = 'Failed to mark item as complete. '
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage += (error as Error).message
        } else if ('details' in error) {
          errorMessage += String((error as { details: unknown }).details)
        } else {
          errorMessage += 'Please try again.'
        }
      } else {
        errorMessage += 'Please try again.'
      }

      toast.error(errorMessage, { duration: 6000 })
    }
  }

  const handleItemClick = (item: ComplianceChecklistItem, event?: React.MouseEvent) => {
    // Don't open form if clicking on checkbox
    if (event && (event.target as HTMLElement).closest('input[type="checkbox"]')) {
      return
    }

    if (item.has_form && item.can_submit) {
      setSelectedItem(item)
      setShowFormModal(true)
    } else if (item.status === 'rejected') {
      toast.error(item.rejection_reason || 'This submission was rejected. Please resubmit.')
      if (item.has_form) {
        setSelectedItem(item)
        setShowFormModal(true)
      }
    } else if (item.status === 'submitted') {
      toast('Your submission is under review', { icon: 'ℹ️' })
    } else if (item.status === 'approved') {
      toast.success('This item has been completed')
    } else if (!item.has_form) {
      toast('This is an offline compliance item. Please complete it manually.', { icon: 'ℹ️' })
    }
  }

  const getStatusIcon = (status: string, isMandatory: boolean) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'submitted':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
      case 'pending':
      default:
        return isMandatory ? (
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        ) : (
          <ClockIcon className="h-5 w-5 text-gray-400" />
        )
    }
  }

  const getStatusBadge = (item: ComplianceChecklistItem) => {
    const { status, is_mandatory } = item

    switch (status) {
      case 'approved':
        return (
          <Badge size="sm" className="bg-green-100 text-green-800 rounded-sm">
            Completed
          </Badge>
        )
      case 'rejected':
        return (
          <Badge size="sm" className="bg-red-100 text-red-800 rounded-sm">
            Rejected
          </Badge>
        )
      case 'submitted':
        return (
          <Badge size="sm" className="bg-blue-100 text-blue-800 rounded-sm">
            Under Review
          </Badge>
        )
      case 'pending':
      default:
        return (
          <Badge
            size="sm"
            className={`rounded-sm ${is_mandatory ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}
          >
            {is_mandatory ? 'Required' : 'Pending'}
          </Badge>
        )
    }
  }

  const isOverdue = (item: ComplianceChecklistItem) => {
    if (!item.due_date || item.status === 'approved') return false
    return new Date(item.due_date) < new Date()
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compliance Checklist</h3>
              <p className="text-sm text-gray-600">Complete all required compliance items</p>
            </div>
            {stats && (
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${getCompletionColor(stats.completion_percentage)}`}
                >
                  {stats.completion_percentage}%
                </div>
                <div className="text-xs text-gray-500">
                  {stats.completed_items}/{stats.total_items} Complete
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {stats && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.completion_percentage >= 80
                    ? 'bg-green-500'
                    : stats.completion_percentage >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${stats.completion_percentage}%` }}
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No compliance items assigned</p>
            </div>
          ) : (
            items.map((item, index) => {
              const overdue = isOverdue(item)
              const daysUntilDue = item.due_date ? getDaysUntilDue(item.due_date) : null

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      item.status === 'rejected'
                        ? 'bg-red-50 border-red-300 hover:border-red-400 cursor-pointer'
                        : item.status === 'approved'
                          ? 'bg-green-50 border-green-200'
                          : item.status === 'submitted'
                            ? 'bg-blue-100 border-blue-300'
                            : item.has_form && item.can_submit
                              ? 'cursor-pointer hover:bg-gray-50 border-gray-200 hover:border-blue-300'
                              : 'border-gray-200'
                    } ${overdue && item.status !== 'approved' ? 'border-red-400 bg-red-100' : ''}`}
                    onClick={(e) => handleItemClick(item, e)}
                  >
                    <div className="flex items-start justify-between">
                      {/* Checkbox */}
                      <div className="flex items-start mt-1 mr-3">
                        <input
                          type="checkbox"
                          checked={item.status === 'submitted' || item.status === 'approved'}
                          onChange={() => handleCheckboxChange(item)}
                          disabled={item.status === 'submitted' || item.status === 'approved'}
                          className={`h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer
                            ${item.status === 'submitted' ? 'bg-blue-100' : ''}
                            ${item.status === 'approved' ? 'bg-green-100' : ''}
                            ${item.status === 'submitted' || item.status === 'approved' ? 'cursor-not-allowed' : ''}
                          `}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(item.status, item.is_mandatory)}
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          {getStatusBadge(item)}

                          {item.has_form && (
                            <Badge size="sm" className="bg-purple-100 text-purple-800 rounded-sm">
                              <DocumentTextIcon className="h-3 w-3 mr-1" />
                              Form Required
                            </Badge>
                          )}

                          {overdue && (
                            <Badge size="sm" className="bg-red-100 text-red-800 rounded-sm">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                        {/* Due date and status info */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {item.due_date && (
                            <span className={overdue ? 'text-red-600 font-medium' : ''}>
                              Due: {new Date(item.due_date).toLocaleDateString()}
                              {daysUntilDue !== null && !overdue && daysUntilDue <= 7 && (
                                <span className="text-yellow-600 ml-1">
                                  ({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left)
                                </span>
                              )}
                            </span>
                          )}

                          {item.status === 'rejected' && item.rejection_reason && (
                            <span className="text-red-600">Reason: {item.rejection_reason}</span>
                          )}
                        </div>

                        {/* Action hints */}
                        {item.can_submit && item.has_form && (
                          <div className="mt-2">
                            <Button size="sm" variant="outline">
                              {item.status === 'rejected' ? 'Resubmit Form' : 'Fill Form'}
                            </Button>
                          </div>
                        )}

                        {item.status === 'submitted' && (
                          <div className="mt-2 text-xs text-blue-600">
                            ✓ Submitted - Awaiting review
                          </div>
                        )}

                        {item.status === 'approved' && (
                          <div className="mt-2 text-xs text-green-600">
                            ✓ Completed successfully
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}

          {/* Summary Stats */}
          {stats && stats.total_items > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {stats.completed_items}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">{stats.pending_items}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{stats.overdue_items}</div>
                  <div className="text-xs text-gray-500">Overdue</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{stats.total_items}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Form Modal */}
      {showFormModal && selectedItem && (
        <ComplianceFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false)
            setSelectedItem(null)
            // Refresh data after form submission
            loadComplianceData()
          }}
          complianceItemId={selectedItem.id}
          userId={userId}
          title={selectedItem.title}
        />
      )}
    </>
  )
}
