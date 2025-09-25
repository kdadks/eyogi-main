import React, { useState } from 'react'
import { X, UserPlus, AlertCircle } from 'lucide-react'
interface Child {
  student_id: string
  full_name: string
  age: number
  grade: string
  address?: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    zip_code: string
    country: string
  }
}
interface ParentInfo {
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
  }
  phone?: string
}
interface AddChildModalProps {
  isOpen: boolean
  onClose: () => void
  onAddChild: (childData: any) => void
  loading?: boolean
  existingChildren?: Child[]
  parentInfo?: ParentInfo
}
export default function AddChildModal({
  isOpen,
  onClose,
  onAddChild,
  loading = false,
  existingChildren = [],
  parentInfo,
}: AddChildModalProps) {
  const [formData, setFormData] = useState({
    child_email: '',
    relationship_type: 'parent' as 'parent' | 'guardian' | 'authorized_user',
    is_primary_contact: true,
    permissions: {
      view_progress: true,
      manage_courses: true,
      view_assignments: true,
      contact_teachers: true,
    },
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.child_email.trim()) {
      newErrors.child_email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.child_email.trim())) {
      newErrors.child_email = 'Please enter a valid email address'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    try {
      await onAddChild({
        child_email: formData.child_email.trim(),
        relationship_type: formData.relationship_type,
        is_primary_contact: formData.is_primary_contact,
        permissions: formData.permissions,
      })
      // Reset form after successful submission
      setFormData({
        child_email: '',
        relationship_type: 'parent',
        is_primary_contact: true,
        permissions: {
          view_progress: true,
          manage_courses: true,
          view_assignments: true,
          contact_teachers: true,
        },
      })
      setErrors({})
    } catch (error) {
    }
  }
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlus className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Add Child</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child's Email Address
            </label>
            <input
              type="email"
              value={formData.child_email}
              onChange={(e) => handleInputChange('child_email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.child_email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter child's email address"
              disabled={loading}
              required
            />
            {errors.child_email && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.child_email}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              The child must already be registered as a student in the system
            </p>
          </div>
          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Type
            </label>
            <select
              value={formData.relationship_type}
              onChange={(e) =>
                setFormData({ ...formData, relationship_type: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
              <option value="authorized_user">Authorized User</option>
            </select>
          </div>
          {/* Primary Contact Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="primary_contact"
              checked={formData.is_primary_contact}
              onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="primary_contact" className="ml-2 text-sm text-gray-700">
              Set as primary contact
            </label>
          </div>
          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-2">
              {Object.entries({
                view_progress: 'View academic progress',
                manage_courses: 'Manage course enrollments',
                view_assignments: 'View assignments and grades',
                contact_teachers: 'Contact teachers and staff',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor={key} className="ml-2 text-sm text-gray-700">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Child
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
