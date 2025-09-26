import React, { useState, useEffect } from 'react'
import { X, UserPlus, AlertCircle } from 'lucide-react'
import CountrySelect from '../forms/CountrySelect'
import StateSelect from '../forms/StateSelect'
import { countries, normalizeToCountryCode } from '../../lib/address-utils'

interface ChildFormData {
  fullName: string
  date_of_birth: string
  grade: string
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
}

export default function AddChildModal({
  isOpen,
  onClose,
  onAddChild,
  loading = false,
  parentInfo,
  initialData,
  isEditMode = false,
}: AddChildModalProps) {
  // Helper function to get country code from country name
  const getCountryCodeByName = (countryName?: string): string => {
    if (!countryName) return 'US'

    // If it's already a code (2 characters), return as is
    if (countryName.length === 2) return countryName

    // Find country by name
    const country = countries.find(
      (c) =>
        c.name.toLowerCase() === countryName.toLowerCase() ||
        c.name.toLowerCase().includes(countryName.toLowerCase()) ||
        countryName.toLowerCase().includes(c.name.toLowerCase()),
    )
    return country?.code || 'US'
  }

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
    fullName: '',
    date_of_birth: '',
    grade: '',
    phone: '',
    address: {
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
    },
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Initialize form data when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (isEditMode && initialData) {
      // Edit mode: populate with child data
      const formattedDate = formatDateForDisplay(initialData.date_of_birth)
      const countryCode = normalizeToCountryCode(initialData.address.country)
      setFormData({
        fullName: initialData.fullName,
        date_of_birth: formattedDate,
        grade: initialData.grade,
        phone: initialData.phone || '',
        address: {
          address_line_1: initialData.address.address_line_1,
          address_line_2: initialData.address.address_line_2 || '',
          city: initialData.address.city,
          state: initialData.address.state,
          zip_code: initialData.address.zip_code,
          country: countryCode,
        },
      })
    } else {
      // Add mode: reset to defaults
      setFormData({
        fullName: '',
        date_of_birth: '',
        grade: '',
        phone: '',
        address: {
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'US',
        },
      })
    }
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode]) // Intentionally omitting initialData to prevent infinite loops

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
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

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required'
    }

    if (!formData.address.address_line_1.trim()) {
      newErrors.address_line_1 = 'Address is required'
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.address.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.address.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required'
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
      // Convert date format for database storage (MM/DD/YYYY -> YYYY-MM-DD)
      const dataToSubmit = {
        ...formData,
        date_of_birth: parseDateFromInput(formData.date_of_birth),
      }
      await onAddChild(dataToSubmit)
      // Reset form after successful submission
      setFormData({
        fullName: '',
        date_of_birth: '',
        grade: '',
        phone: '',
        address: {
          address_line_1: parentInfo?.address?.street || '',
          address_line_2: '',
          city: parentInfo?.address?.city || '',
          state: parentInfo?.address?.state || '',
          zip_code: parentInfo?.address?.postal_code || '',
          country: getCountryCodeByName(parentInfo?.address?.country), // Convert name to code
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

  const handleAddressChange = (field: keyof ChildFormData['address'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }
  if (!isOpen) return null

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
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Basic Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter child's full name"
                  disabled={loading}
                  required
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.fullName}
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

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                <select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.grade ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  required
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.grade}
                  </p>
                )}
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
            </div>

            {/* Address Information Row */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-900">Address Information</h4>

              {/* Address Lines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.address.address_line_1}
                    onChange={(e) => handleAddressChange('address_line_1', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address_line_1 ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter street address"
                    disabled={loading}
                    required
                  />
                  {errors.address_line_1 && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.address_line_1}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.address.address_line_2}
                    onChange={(e) => handleAddressChange('address_line_2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Apartment, suite, etc."
                    disabled={loading}
                  />
                </div>
              </div>

              {/* City, State, Country, ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="City"
                    disabled={loading}
                    required
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <CountrySelect
                    value={formData.address.country}
                    onChange={(countryCode) => handleAddressChange('country', countryCode)}
                    disabled={loading}
                    required
                    className={errors.country ? 'border-red-300' : ''}
                  />
                  {errors.country && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.country}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.address.country === 'US'
                      ? 'State'
                      : formData.address.country === 'CA'
                        ? 'Province'
                        : 'State/Province'}{' '}
                    *
                  </label>
                  <StateSelect
                    countryCode={formData.address.country}
                    value={formData.address.state}
                    onChange={(stateCode) => handleAddressChange('state', stateCode)}
                    disabled={loading}
                    required
                    className={errors.state ? 'border-red-300' : ''}
                  />
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.state}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.address.country === 'US'
                      ? 'ZIP Code'
                      : formData.address.country === 'CA'
                        ? 'Postal Code'
                        : 'ZIP/Postal Code'}{' '}
                    *
                  </label>
                  <input
                    type="text"
                    value={formData.address.zip_code}
                    onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.zip_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={
                      formData.address.country === 'US'
                        ? 'ZIP Code'
                        : formData.address.country === 'CA'
                          ? 'Postal Code'
                          : 'ZIP/Postal Code'
                    }
                    disabled={loading}
                    required
                  />
                  {errors.zip_code && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.zip_code}
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
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 font-medium rounded focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Child' : 'Add Child'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
