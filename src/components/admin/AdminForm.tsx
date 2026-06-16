// ============================================
// ADMIN: FORM FOR CREATING/EDITING CONTENT
// /src/components/admin/AdminForm.tsx
// ============================================

'use client'

import React, { useState } from 'react'
import type { Page, Post, CreatePageDTO, CreatePostDTO } from '@/types/cms'

interface AdminFormProps {
  title: string
  onSubmit: (data: any) => Promise<void>
  initialData?: Page | Post | null
  isLoading?: boolean
  fields: FormField[]
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'richtext' | 'select' | 'checkbox' | 'date' | 'file'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
}

export default function AdminForm({
  title,
  onSubmit,
  initialData,
  isLoading = false,
  fields,
}: AdminFormProps) {
  const [formData, setFormData] = useState(
    initialData ||
      fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.type === 'checkbox' ? false : '',
        }),
        {},
      ),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ submit: 'Failed to submit form. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">{errors.submit}</div>
        )}

        <div className="space-y-6">
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-600">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {field.type === 'richtext' && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <textarea
                    id={field.name}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-2">HTML content support</p>
                </div>
              )}

              {field.type === 'select' && (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <input
                  type="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name] || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {field.type === 'file' && (
                <input
                  type="file"
                  id={field.name}
                  name={field.name}
                  onChange={(e) => {
                    // File handling - could upload to UploadThing here
                    console.log('File:', e.target.files?.[0])
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              )}

              {errors[field.name] && (
                <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={submitting || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            {submitting ? 'Submitting...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
