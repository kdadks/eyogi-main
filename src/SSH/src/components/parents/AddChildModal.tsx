import React, { useState } from 'react'
import { X, User, Calendar, GraduationCap } from 'lucide-react'

interface Child {
  student_id: string
  full_name: string
  age: number
  grade: string
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
  onAddChild: (childData: {
    fullName: string
    date_of_birth: string
    grade: string
    phone?: string
    address_line_1?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }) => void
  existingChildren: Child[]
  parentInfo?: ParentInfo
  editMode?: boolean
  childToEdit?: {
    fullName: string
    grade: string
    date_of_birth: string
    phone?: string
    address_line_1?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
  }
}

const gradeOptions = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
]

export default function AddChildModal({
  isOpen,
  onClose,
  onAddChild,
  existingChildren,
  parentInfo,
  editMode = false,
  childToEdit,
}: AddChildModalProps) {
  const [formData, setFormData] = useState({
    fullName: editMode && childToEdit ? childToEdit.fullName : '',
    grade: editMode && childToEdit ? childToEdit.grade : '',
    phone: editMode && childToEdit ? childToEdit.phone || '' : parentInfo?.phone || '',
    address_line_1:
      editMode && childToEdit
        ? childToEdit.address_line_1 || ''
        : parentInfo?.address?.street || '',
    city: editMode && childToEdit ? childToEdit.city || '' : parentInfo?.address?.city || '',
    state: editMode && childToEdit ? childToEdit.state || '' : parentInfo?.address?.state || '',
    zip_code:
      editMode && childToEdit ? childToEdit.zip_code || '' : parentInfo?.address?.postal_code || '',
    country:
      editMode && childToEdit
        ? childToEdit.country || 'United States'
        : parentInfo?.address?.country || 'United States',
    date_of_birth: editMode && childToEdit ? childToEdit.date_of_birth : '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s']+$/.test(formData.fullName)) {
      newErrors.fullName = 'Full name can only contain letters, spaces, and apostrophes'
    }

    // Validate date of birth
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required'
    } else {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const calculatedAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age

      if (calculatedAge < 3 || calculatedAge > 18) {
        newErrors.date_of_birth = 'Child must be between 3 and 18 years old'
      }
    }

    if (!formData.grade) {
      newErrors.grade = 'Grade level is required'
    }

    // Check for duplicate names
    const nameExists = existingChildren.some(
      (child: Child) => child.full_name?.toLowerCase() === formData.fullName.toLowerCase(),
    )
    if (nameExists) {
      newErrors.fullName = 'A child with this name already exists'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onAddChild({
        fullName: formData.fullName.trim(),
        date_of_birth: formData.date_of_birth,
        grade: formData.grade,
        phone: formData.phone.trim() || undefined,
        address_line_1: formData.address_line_1.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zip_code: formData.zip_code.trim() || undefined,
        country: formData.country.trim() || undefined,
      })

      // Reset form
      setFormData({
        fullName: '',
        grade: '',
        phone: parentInfo?.phone || '',
        address_line_1: parentInfo?.address?.street || '',
        city: parentInfo?.address?.city || '',
        state: parentInfo?.address?.state || '',
        zip_code: parentInfo?.address?.postal_code || '',
        country: parentInfo?.address?.country || 'United States',
        date_of_birth: '',
      })
      setErrors({})
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {editMode ? 'Edit Child' : 'Add New Child'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Primary Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter child's full name"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Date of Birth"
                required
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
              )}
            </div>
          </div>

          {/* Grade */}
          <div className="mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <GraduationCap className="h-4 w-4 inline mr-1" />
                Grade Level *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.grade ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select grade level</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
            </div>
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📞 Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter phone number"
            />
          </div>

          {/* Address Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              🏠 Address (Auto-populated from parent)
            </h4>

            {/* Street Address */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address_line_1}
                onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter street address"
              />
            </div>

            {/* City, State, Zip Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Zip code"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Country"
              />
            </div>
          </div>

          {/* Auto-generated info note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> A unique Student ID and email address will be automatically
              generated for this child.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {editMode ? 'Update Child' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
