import React, { useState, useEffect } from 'react'
import { X, User, Mail, Shield, Calendar, Save, Loader2 } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: any // For editing existing user
  mode: 'create' | 'edit'
}

const roleOptions = [
  { value: 'student', label: 'Student', color: 'bg-blue-100 text-blue-800' },
  { value: 'teacher', label: 'Teacher', color: 'bg-green-100 text-green-800' },
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  { value: 'parent', label: 'Parent', color: 'bg-yellow-100 text-yellow-800' },
]

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
]

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode,
}: UserFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    status: 'active',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
  })

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        email: user.email || '',
        password: '', // Don't populate password for editing
        full_name: user.full_name || '',
        role: user.role || 'student',
        status: user.status || 'active',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        emergency_contact: user.emergency_contact || '',
      })
    } else {
      // Reset form for create mode
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        status: 'active',
        phone: '',
        date_of_birth: '',
        address: '',
        emergency_contact: '',
      })
    }
  }, [mode, user, isOpen])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.email) {
      toast.error('Email is required')
      return false
    }
    if (mode === 'create' && !formData.password) {
      toast.error('Password is required for new users')
      return false
    }
    if (!formData.full_name) {
      toast.error('Full name is required')
      return false
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (mode === 'create' && formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (mode === 'create') {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
        })

        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`)
        }

        if (!authData.user) {
          throw new Error('Failed to create user account')
        }

        // Create profile in database
        const profileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: profileError } = await supabaseAdmin.from('profiles').insert([profileData])

        if (profileError) {
          // If profile creation fails, try to delete the auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          throw new Error(`Profile creation error: ${profileError.message}`)
        }

        toast.success('User created successfully!')
      } else {
        // Update existing user profile
        const updateData = {
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          updated_at: new Date().toISOString(),
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)

        if (profileError) {
          throw new Error(`Update error: ${profileError.message}`)
        }

        // Update email in auth if changed
        if (formData.email !== user.email) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            email: formData.email,
          })

          if (authError) {
            throw new Error(`Email update error: ${authError.message}`)
          }
        }

        // Update password if provided
        if (formData.password) {
          const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: formData.password,
          })

          if (passwordError) {
            throw new Error(`Password update error: ${passwordError.message}`)
          }
        }

        toast.success('User updated successfully!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.message || 'An error occurred while saving the user')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>

            {(mode === 'create' || mode === 'edit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {mode === 'create' ? '*' : '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={mode === 'create' ? 'Enter password' : 'Enter new password'}
                  required={mode === 'create'}
                  minLength={6}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-1" />
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contact name and phone"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Street address, city, state, zip"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{mode === 'create' ? 'Create User' : 'Update User'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
