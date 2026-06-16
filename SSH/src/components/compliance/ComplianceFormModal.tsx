import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

import {
  XMarkIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getComplianceForm, submitComplianceForm } from '../../lib/api/compliance'
import type {
  ComplianceForm,
  ComplianceFormField,
  FormValidationResult,
} from '../../types/compliance'

interface ComplianceFormModalProps {
  isOpen: boolean
  onClose: () => void
  complianceItemId: string
  userId: string
  title: string
}

interface FormData {
  [key: string]: string | number | boolean | string[] | File[]
}

export default function ComplianceFormModal({
  isOpen,
  onClose,
  complianceItemId,
  userId,
  title,
}: ComplianceFormModalProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<ComplianceForm | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fileErrors, setFileErrors] = useState<string[]>([])

  const loadForm = useCallback(async () => {
    try {
      setLoading(true)
      // For now, we'll need to get the form ID from the compliance item
      // This is a simplified version - in reality, you'd get the form ID from the compliance item
      const formData = await getComplianceForm('form-id') // This needs to be dynamic
      setForm(formData)
      initializeFormData(formData?.fields || [])
    } catch (error) {
      console.error('Error loading form:', error)
      toast.error('Failed to load form')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && complianceItemId) {
      loadForm()
    }
  }, [isOpen, complianceItemId, loadForm])

  const initializeFormData = (fields: ComplianceFormField[]) => {
    const initialData: FormData = {}
    fields.forEach((field) => {
      if (field.type === 'checkbox') {
        initialData[field.name] = []
      } else if (field.type === 'file') {
        initialData[field.name] = []
      } else {
        initialData[field.name] = ''
      }
    })
    setFormData(initialData)
  }

  const validateForm = (): FormValidationResult => {
    const newErrors: Record<string, string> = {}
    const newFileErrors: string[] = []

    if (!form) {
      return { isValid: false, errors: newErrors }
    }

    form.fields.forEach((field) => {
      const value = formData[field.name]

      // Required field validation
      if (field.required) {
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)
        ) {
          newErrors[field.name] = `${field.label} is required`
          return
        }
      }

      // Type-specific validations
      if (value && typeof value === 'string') {
        // Length validations
        if (field.validation?.min_length && value.length < field.validation.min_length) {
          newErrors[field.name] =
            `${field.label} must be at least ${field.validation.min_length} characters`
          return
        }
        if (field.validation?.max_length && value.length > field.validation.max_length) {
          newErrors[field.name] =
            `${field.label} must not exceed ${field.validation.max_length} characters`
          return
        }

        // Pattern validation
        if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
          newErrors[field.name] = `${field.label} format is invalid`
          return
        }

        // Email validation
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.name] = 'Please enter a valid email address'
          return
        }

        // Phone validation (basic)
        if (field.type === 'phone' && !/^\+?[\d\s\-()]+$/.test(value)) {
          newErrors[field.name] = 'Please enter a valid phone number'
          return
        }
      }

      // Number validations
      if (field.type === 'number' && typeof value === 'number') {
        if (field.validation?.min_value && value < field.validation.min_value) {
          newErrors[field.name] = `${field.label} must be at least ${field.validation.min_value}`
          return
        }
        if (field.validation?.max_value && value > field.validation.max_value) {
          newErrors[field.name] = `${field.label} must not exceed ${field.validation.max_value}`
          return
        }
      }

      // File validations
      if (field.type === 'file' && Array.isArray(value)) {
        const files = value as File[]
        files.forEach((file) => {
          // Size validation (default 2MB)
          const maxSize = field.validation?.max_file_size || 2 * 1024 * 1024
          if (file.size > maxSize) {
            newFileErrors.push(`${file.name} exceeds ${formatFileSize(maxSize)} size limit`)
          }

          // Type validation
          if (field.validation?.allowed_file_types) {
            const isAllowed = field.validation.allowed_file_types.some(
              (type) => file.type.includes(type) || file.name.toLowerCase().includes(type),
            )
            if (!isAllowed) {
              newFileErrors.push(`${file.name} is not an allowed file type`)
            }
          }
        })
      }
    })

    setErrors(newErrors)
    setFileErrors(newFileErrors)

    return {
      isValid: Object.keys(newErrors).length === 0 && newFileErrors.length === 0,
      errors: newErrors,
      fileSizeErrors: newFileErrors,
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const handleInputChange = (
    fieldName: string,
    value: string | number | boolean | string[] | File[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleFileChange = (fieldName: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files)
      handleInputChange(fieldName, fileArray)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateForm()
    if (!validation.isValid) {
      toast.error('Please fix the errors before submitting')
      return
    }

    setSubmitting(true)
    try {
      // Separate files from other form data
      const files: File[] = []
      const cleanFormData: Record<string, string | number | boolean | string[]> = {}

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          files.push(...(value as File[]))
        } else {
          cleanFormData[key] = value as string | number | boolean | string[]
        }
      })

      await submitComplianceForm(
        complianceItemId,
        userId,
        cleanFormData,
        files.length > 0 ? files : undefined,
      )

      toast.success('Form submitted successfully! It will be reviewed by an administrator.')
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: ComplianceFormField) => {
    const hasError = errors[field.name]
    const baseClasses = `w-full rounded-lg border-gray-300 shadow-sm transition-colors ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'focus:border-blue-500 focus:ring-blue-500'
    }`

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={(formData[field.name] as string) || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
            required={field.required}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={(formData[field.name] as number) || ''}
            onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={baseClasses}
            required={field.required}
            min={field.validation?.min_value}
            max={field.validation?.max_value}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={(formData[field.name] as string) || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseClasses}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={(formData[field.name] as string) || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} min-h-[100px] resize-y`}
            required={field.required}
            maxLength={field.validation?.max_length}
          />
        )

      case 'select':
        return (
          <select
            value={(formData[field.name] as string) || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseClasses}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  required={field.required}
                />
                <span className="ml-2 text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={((formData[field.name] as string[]) || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = (formData[field.name] as string[]) || []
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option)
                    handleInputChange(field.name, newValues)
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'file': {
        const maxSize = field.validation?.max_file_size || 2 * 1024 * 1024
        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileChange(field.name, e.target.files)}
              className={baseClasses}
              required={field.required}
              multiple={false}
              accept={field.validation?.allowed_file_types?.join(',')}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: {formatFileSize(maxSize)}
              {field.validation?.allowed_file_types && (
                <span className="block">
                  Allowed types: {field.validation.allowed_file_types.join(', ')}
                </span>
              )}
            </p>
            {((formData[field.name] as File[]) || []).length > 0 && (
              <div className="mt-2">
                {(formData[field.name] as File[]).map((file, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    {file.name} ({formatFileSize(file.size)})
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600">Please fill out all required fields</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {form?.description && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{form.description}</p>
                </div>
              )}

              {/* Show file errors if any */}
              {fileErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <h3 className="text-sm font-medium text-red-800">File Upload Errors</h3>
                  </div>
                  <ul className="mt-2 text-sm text-red-700">
                    {fileErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {form?.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {renderField(field)}

                    {field.help_text && <p className="text-xs text-gray-500">{field.help_text}</p>}

                    {errors[field.name] && (
                      <p className="text-sm text-red-600">{errors[field.name]}</p>
                    )}
                  </div>
                ))}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
