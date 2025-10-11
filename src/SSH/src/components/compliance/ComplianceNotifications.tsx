import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader } from '../ui/Card'
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '../../lib/api/compliance'
import type { ComplianceNotification } from '../../types/compliance'

interface ComplianceNotificationsProps {
  userId: string
  className?: string
}

export default function ComplianceNotifications({
  userId,
  className = '',
}: ComplianceNotificationsProps) {
  const [notifications, setNotifications] = useState<ComplianceNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(userId)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read_at: new Date().toISOString() } : notif,
        ),
      )
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to update notification')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission_approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'submission_rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'form_submitted':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />
      case 'deadline_reminder':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'new_compliance_item':
        return <BellIcon className="h-5 w-5 text-purple-600" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'submission_approved':
        return 'border-green-200 bg-green-50'
      case 'submission_rejected':
        return 'border-red-200 bg-red-50'
      case 'form_submitted':
        return 'border-blue-200 bg-blue-50'
      case 'deadline_reminder':
        return 'border-yellow-200 bg-yellow-50'
      case 'new_compliance_item':
        return 'border-purple-200 bg-purple-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

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
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BellIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">{unreadCount} new</Badge>
            )}
          </div>

          {notifications.length > 5 && (
            <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {displayNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      notification.read_at ? 'opacity-60' : ''
                    } ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3 inline mr-1" />
                              {getTimeAgo(notification.created_at)}
                            </span>

                            {!notification.read_at && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Additional context for specific notification types */}
                    {notification.type === 'submission_rejected' &&
                      notification.metadata?.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-100 rounded-md">
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700">
                            {notification.metadata.rejection_reason}
                          </p>
                        </div>
                      )}

                    {notification.type === 'deadline_reminder' &&
                      notification.metadata?.due_date && (
                        <div className="mt-3 p-3 bg-yellow-100 rounded-md">
                          <p className="text-sm font-medium text-yellow-800">
                            Due: {new Date(notification.metadata.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  // Mark all unread notifications as read
                  const unreadNotifications = notifications.filter((n) => !n.read_at)
                  await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)))

                  setNotifications((prev) =>
                    prev.map((notif) => ({
                      ...notif,
                      read_at: notif.read_at || new Date().toISOString(),
                    })),
                  )

                  toast.success('All notifications marked as read')
                } catch (error) {
                  console.error('Error marking all notifications as read:', error)
                  toast.error('Failed to update notifications')
                }
              }}
              className="w-full"
            >
              Mark All as Read ({unreadCount})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
