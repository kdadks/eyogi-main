import React, { useState, useEffect } from 'react'
import { X, User, Mail, Shield, Save, Loader2 } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import toast from 'react-hot-toast'
import AddressForm from '../forms/AddressForm'
import { AddressFormData } from '../../lib/address-utils'
interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: any // For editing existing user
  mode: 'create' | 'edit'
}
const roleOptions = [
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  { value: 'business_admin', label: 'Business Admin', color: 'bg-orange-100 text-orange-800' },
  { value: 'parent', label: 'Parent', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'student', label: 'Student', color: 'bg-blue-100 text-blue-800' },
  { value: 'teacher', label: 'Teacher', color: 'bg-green-100 text-green-800' },
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
    age: '',
    phone: '',
    parent_guardian_name: '',
    parent_guardian_email: '',
    parent_guardian_phone: '',
    student_id: '',
  })
  const [addressData, setAddressData] = useState<AddressFormData>({
    country: '',
    state: '',
    city: '',
    address_line_1: '',
    address_line_2: '',
    zip_code: '',
  })
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        email: user.email || '',
        password: '', // Don't populate password for editing
        full_name: user.full_name || '',
        role: user.role || 'student',
        age: user.age?.toString() || '',
        phone: user.phone || '',
        parent_guardian_name: user.parent_guardian_name || '',
        parent_guardian_email: user.parent_guardian_email || '',
        parent_guardian_phone: user.parent_guardian_phone || '',
        student_id: user.student_id || '',
      })
      setAddressData({
        country: user.country || '',
        state: user.state || '',
        city: user.city || '',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        zip_code: user.zip_code || '',
      })
    } else {
      // Reset form for create mode
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        age: '',
        phone: '',
        parent_guardian_name: '',
        parent_guardian_email: '',
        parent_guardian_phone: '',
        student_id: '',
      })
      setAddressData({
        country: '',
        state: '',
        city: '',
        address_line_1: '',
        address_line_2: '',
        zip_code: '',
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
  const handleAddressChange = (data: AddressFormData) => {
    setAddressData(data)
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
        const baseProfileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          age: formData.age ? parseInt(formData.age) : null,
          phone: formData.phone || null,
          country: addressData.country || null,
          state: addressData.state || null,
          city: addressData.city || null,
          address_line_1: addressData.address_line_1 || null,
          address_line_2: addressData.address_line_2 || null,
          zip_code: addressData.zip_code || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Only include parent guardian and student fields for relevant roles
        const profileData = {
          ...baseProfileData,
          // Only include parent guardian fields for student and parent roles
          ...(formData.role === 'student' || formData.role === 'parent'
            ? {
                parent_guardian_name: formData.parent_guardian_name || null,
                parent_guardian_phone: formData.parent_guardian_phone || null,
              }
            : {}),
          // Only include student_id for student role
          ...(formData.role === 'student'
            ? {
                student_id: formData.student_id || null,
              }
            : {}),
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
        const baseUpdateData = {
          full_name: formData.full_name,
          role: formData.role,
          age: formData.age ? parseInt(formData.age) : null,
          phone: formData.phone || null,
          country: addressData.country || null,
          state: addressData.state || null,
          city: addressData.city || null,
          address_line_1: addressData.address_line_1 || null,
          address_line_2: addressData.address_line_2 || null,
          zip_code: addressData.zip_code || null,
          updated_at: new Date().toISOString(),
        }

        // Only include parent guardian and student fields for relevant roles
        const updateData = {
          ...baseUpdateData,
          // Only include parent guardian fields for student and parent roles
          ...(formData.role === 'student' || formData.role === 'parent'
            ? {
                parent_guardian_name: formData.parent_guardian_name || null,
                parent_guardian_phone: formData.parent_guardian_phone || null,
              }
            : {}),
          // Only include student_id for student role
          ...(formData.role === 'student'
            ? {
                student_id: formData.student_id || null,
              }
            : {}),
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
      toast.error(error.message || 'An error occurred while saving the user')
    } finally {
      setLoading(false)
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-blue-100 rounded">
              <User className="h-3 w-3 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={loading}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        {/* Form - Compact with scroll */}
        <form onSubmit={handleSubmit} className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Mail className="h-3 w-3 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User className="h-3 w-3 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            {(mode === 'create' || mode === 'edit') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password {mode === 'create' ? '*' : '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={mode === 'create' ? 'Enter password' : 'Enter new password'}
                  required={mode === 'create'}
                  minLength={6}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Shield className="h-3 w-3 inline mr-1" />
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="25"
                min="0"
                max="120"
              />
            </div>
          </div>
          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User className="h-3 w-3 inline mr-1" />
                Student ID
              </label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="STU123456"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parent Guardian Name
              </label>
              <input
                type="text"
                name="parent_guardian_name"
                value={formData.parent_guardian_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Parent or guardian name"
              />
            </div>
          </div>
          {/* Parent Guardian Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Mail className="h-3 w-3 inline mr-1" />
                Parent Guardian Email
              </label>
              <input
                type="email"
                name="parent_guardian_email"
                value={formData.parent_guardian_email}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="parent@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parent Guardian Phone
              </label>
              <input
                type="tel"
                name="parent_guardian_phone"
                value={formData.parent_guardian_phone}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          {/* Address Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Address Information</h4>
            <AddressForm data={addressData} onChange={handleAddressChange} className="space-y-3" />
          </div>
          {/* Footer - Compact */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  <span>{mode === 'create' ? 'Create' : 'Update'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
