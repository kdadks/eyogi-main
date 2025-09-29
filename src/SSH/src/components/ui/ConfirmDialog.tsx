import React from 'react'
import { Button } from './Button'
import { Card, CardContent, CardHeader, CardTitle } from './Card'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger'
      case 'warning':
        return 'secondary'
      default:
        return 'primary'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{message}</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button variant={getButtonVariant()} onClick={onConfirm}>
                {confirmText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
