import React, { useState, useEffect } from 'react'
import { X, UserPlus, AlertCircle } from 'lucide-react'
import CountrySelect from '../forms/CountrySelect'
import StateSelect from '../forms/StateSelect'
import { getStateName } from '../../lib/address-utils'
import { normalizeCountryToISO3, getCountryNameFromISO3 } from '../../lib/iso-utils'
import { supabaseAdmin } from '../../lib/supabase'
import { countryHasStates } from '../../lib/address-utils'

interface ChildFormData {
  firstName: string
  lastName: string
  date_of_birth: string
  grade: string
  email?: string
  phone?: string
  address: {
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
  onAddChild: (childData: ChildFormData) => void
  loading?: boolean
  parentInfo?: ParentInfo
  initialData?: ChildFormData // For edit mode
  isEditMode?: boolean
  childId?: string // Child's student_id for edit mode (to exclude from email uniqueness check)
}

export default function AddChildModal({
  isOpen,
  onClose,
  onAddChild,
  loading = false,
  parentInfo,
  initialData,
  isEditMode = false,
  childId,
}: AddChildModalProps) {
  // Helper function to format date for MM/DD/YYYY display
  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString || dateString === 'null') return ''

    try {
      const cleanDate = dateString.trim()
      if (!cleanDate) return ''

      // Try to parse the date
      const date = new Date(cleanDate)
      if (isNaN(date.getTime())) return ''

      // Format as MM/DD/YYYY
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const year = date.getFullYear()

      return `${month}/${day}/${year}`
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return ''
    }
  }

  // Helper function to parse MM/DD/YYYY to database format (YYYY-MM-DD)
  const parseDateFromInput = (dateString: string): string => {
    if (!dateString) return ''

    try {
      // Handle MM/DD/YYYY format
      const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (match) {
        const [, month, day, year] = match
        const formattedMonth = month.padStart(2, '0')
        const formattedDay = day.padStart(2, '0')
        return `${year}-${formattedMonth}-${formattedDay}`
      }
      return ''
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return ''
    }
  }

  const [formData, setFormData] = useState<ChildFormData>({
    firstName: '',
    lastName: '',
    date_of_birth: '',
    grade: '',
    email: '',
    phone: '',
    address: {
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
    },
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Initialize form data when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (isEditMode && initialData) {
      // Edit mode: populate with child data but use parent's address
      const formattedDate = formatDateForDisplay(initialData.date_of_birth)
      // Split fullName into firstName and lastName if available
      const nameParts = (initialData as any).fullName
        ? (initialData as any).fullName.split(' ')
        : [initialData.firstName || '', initialData.lastName || '']
      const firstName = initialData.firstName || nameParts[0] || ''
      const lastName =
        initialData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')

      setFormData({
        firstName,
        lastName,
        date_of_birth: formattedDate,
        grade: initialData.grade,
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: {
          address_line_1: parentInfo?.address?.street || '',
          address_line_2: '',
          city: parentInfo?.address?.city || '',
          state: parentInfo?.address?.state || '',
          zip_code: parentInfo?.address?.postal_code || '',
          country: normalizeCountryToISO3(parentInfo?.address?.country || 'USA'),
        },
      })
    } else {
      // Add mode: auto-populate with parent's address
      setFormData({
        firstName: '',
        lastName: '',
        date_of_birth: '',
        grade: '',
        email: '',
        phone: '',
        address: {
          address_line_1: parentInfo?.address?.street || '',
          address_line_2: '',
          city: parentInfo?.address?.city || '',
          state: parentInfo?.address?.state || '',
          zip_code: parentInfo?.address?.postal_code || '',
          country: normalizeCountryToISO3(parentInfo?.address?.country || 'USA'),
        },
      })
    }
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode]) // Intentionally omitting initialData to prevent infinite loops

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required'
    } else if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(formData.date_of_birth)) {
      newErrors.date_of_birth = 'Please enter date in MM/DD/YYYY format'
    } else {
      // Validate that it's a valid date
      const parsed = parseDateFromInput(formData.date_of_birth)
      if (!parsed) {
        newErrors.date_of_birth = 'Please enter a valid date'
      }
    }

    // Class/Grade is now optional - no validation needed

    // Address validation - either state or city must be provided
    const normalizedCountry = normalizeCountryToISO3(formData.address.country)
    const hasStates = countryHasStates(normalizedCountry)

    if (hasStates) {
      // If country has states, state is required
      if (!formData.address.state || formData.address.state.trim() === '') {
        newErrors['address.state'] = 'State/Province is required for this country'
      }
    } else {
      // If country doesn't have states, city is required
      if (!formData.address.city || formData.address.city.trim() === '') {
        newErrors['address.city'] = 'City is required for this country'
      }
    }

    // Email validation - only in edit mode
    if (isEditMode) {
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if email already exists in database (excluding current child in edit mode)
  const checkEmailExists = async (email: string, excludeId?: string): Promise<boolean> => {
    try {
      let query = supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1)

      // Exclude current child's ID in edit mode
      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error checking email existence:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking email existence:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    // Check email uniqueness if email is provided in edit mode
    if (isEditMode && formData.email && formData.email.trim()) {
      const emailExists = await checkEmailExists(formData.email.trim(), childId)
      if (emailExists) {
        setErrors({
          email: 'This email address is already in use. Please choose a different email.',
        })
        return
      }
    }

    try {
      // Convert date format for database storage (MM/DD/YYYY -> YYYY-MM-DD)
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      const dataToSubmit = {
        fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        date_of_birth: parseDateFromInput(formData.date_of_birth),
        grade: formData.grade || '', // Allow empty grade/class
        phone: formData.phone,
        address: formData.address, // Already in 3-letter ISO code format
        // Only include email in edit mode, let API auto-generate in add mode
        ...(isEditMode && formData.email ? { email: formData.email } : {}),
      }
      await onAddChild(dataToSubmit)
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        date_of_birth: '',
        grade: '',
        email: '',
        phone: '',
        address: {
          address_line_1: parentInfo?.address?.street || '',
          address_line_2: '',
          city: parentInfo?.address?.city || '',
          state: parentInfo?.address?.state || '',
          zip_code: parentInfo?.address?.postal_code || '',
          country: normalizeCountryToISO3(parentInfo?.address?.country || 'USA'),
        },
      })
      setErrors({})
    } catch (error) {
      console.error('Error adding child:', error)
    }
  }

  const handleInputChange = (field: keyof ChildFormData, value: string) => {
    if (field === 'address') return // Handle address separately

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-auto max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlus className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Edit Child' : 'Add New Child'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Student ID Info Notice */}
            {!isEditMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Student ID Generation</p>
                    <p>
                      A unique student ID will be automatically generated based on the country and
                      state/county from your parent profile address (e.g., IRLDU202500001 for
                      Dublin, Ireland). The address will be automatically copied from your profile.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="First name"
                  disabled={loading}
                  required
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Last name"
                  disabled={loading}
                  required
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth * (MM/DD/YYYY)
                </label>
                <input
                  type="text"
                  value={formData.date_of_birth}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '') // Remove non-digits
                    if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2)
                    if (value.length >= 5)
                      value = value.substring(0, 5) + '/' + value.substring(5, 9)
                    handleInputChange('date_of_birth', value)
                  }}
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  required
                />
                {errors.date_of_birth && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              {/* Class (formerly Grade) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class (Optional)
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5th Grade, Year 10"
                  disabled={loading}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>

              {/* Email - Only show in edit mode */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter child's email"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Address Information - Auto-copied from Parent */}
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Address (Automatically copied from Parent Profile)
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {formData.address.address_line_1 ? (
                    <>
                      <p>{formData.address.address_line_1}</p>
                      {formData.address.address_line_2 && <p>{formData.address.address_line_2}</p>}
                      <p>
                        {formData.address.city}
                        {formData.address.state &&
                          `, ${
                            getStateName(formData.address.country, formData.address.state) ||
                            formData.address.state
                          }`}
                        {formData.address.zip_code && ` ${formData.address.zip_code}`}
                      </p>
                      <p>
                        {/* Display country name from 3-letter ISO code */}
                        {getCountryNameFromISO3(formData.address.country) ||
                          formData.address.country}
                      </p>
                    </>
                  ) : (
                    <p className="text-amber-700">
                      No address found in parent profile. Please update your profile first.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 font-medium rounded focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading ? 'Saving...' : isEditMode ? 'Update Child' : 'Add Child'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
