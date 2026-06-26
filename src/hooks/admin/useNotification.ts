
import React from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

interface UseNotificationReturn {
  notifications: Notification[]
  addNotification: (notif: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export function useNotification(): UseNotificationReturn {
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  const addNotification = (notif: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: Notification = {
      ...notif,
      id,
      duration: notif.duration || 4000,
    }

    setNotifications((prev) => [...prev, notification])

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  }
}
