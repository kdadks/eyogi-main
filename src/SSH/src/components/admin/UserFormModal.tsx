import React, { useState, useEffect } from 'react'
import { X, User, Shield, Save, Loader2 } from 'lucide-react'
import { supabaseAdmin } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { generateRoleId } from '../../lib/id-generator'
import { normalizeCountryToISO3, normalizeStateToISO2 } from '../../lib/iso-utils'
import { encryptProfileFields } from '../../lib/encryption'
// import AddressForm from '../forms/AddressForm'

// Simple password hashing function (for development - use bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'eyogi-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Generate email from full name following format: nameYYYYXXXX@eyogi-student.com
// Example: aadvikgupt20250031@eyogi-student.com
function generateEmailFromName(fullName: string): string {
  if (!fullName) return ''

  // Convert name to lowercase, remove spaces and special characters
  const namePart = fullName
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .substring(0, 10) // Take first 10 letters

  // Add year (4 digits)
  const year = new Date().getFullYear()

  // Add random 4-digit number
  const randomPart = Math.floor(1000 + Math.random() * 9000)

  return `${namePart}${year}${randomPart}@eyogi-student.com`
}
import type { Database } from '../../lib/supabase'
type Profile = Database['public']['Tables']['profiles']['Row']
import { countries, getStatesForCountry } from '../../lib/address-utils'

// Utility to extract address fields from Profile
// No extractAddressData needed; use address object from user

// Utility to build address object for DB

// Utility to calculate age from date_of_birth
function calculateAgeFromDateOfBirth(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age >= 0 ? age : null
}
interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: Profile // For editing existing user
  mode: 'create' | 'edit' | 'view'
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
    status: 'pending_activation',
    date_of_birth: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_email: '',
    emergency_contact_relationship: '',
    avatar_url: '',
    student_id: '',
    parent_id: '',
    teacher_id: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    age: '',
    grade: '',
  })
  // For country/state dropdowns
  const [availableStates, setAvailableStates] = useState<{ code: string; name: string }[]>([])
  // Update available states when country changes
  useEffect(() => {
    if (formData.country) {
      setAvailableStates(getStatesForCountry(formData.country))
    } else {
      setAvailableStates([])
    }
  }, [formData.country])
  // No addressData state; use user.address directly
  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && user) {
      // Parse emergency_contact JSONB if exists
      let emergencyContact = { name: '', phone: '', email: '', relationship: '' }
      if (user?.emergency_contact && typeof user.emergency_contact === 'object') {
        emergencyContact = user.emergency_contact as any
      }

      const dateOfBirth = user?.date_of_birth ? String(user.date_of_birth).substring(0, 10) : ''
      const calculatedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth) : null

      setFormData({
        email: user?.email || '',
        password: '',
        full_name: user?.full_name || '',
        role: user?.role || 'student',
        status: user?.status || 'pending_activation',
        date_of_birth: dateOfBirth,
        phone: user?.phone || '',
        emergency_contact_name: emergencyContact.name || '',
        emergency_contact_phone: emergencyContact.phone || '',
        emergency_contact_email: emergencyContact.email || '',
        emergency_contact_relationship: emergencyContact.relationship || '',
        avatar_url: user?.avatar_url || '',
        student_id: user?.student_id || '',
        parent_id: user && 'parent_id' in user && user.parent_id ? String(user.parent_id) : '',
        teacher_id: user?.teacher_id || '',
        address_line_1: user?.address_line_1 || '',
        address_line_2: user?.address_line_2 || '',
        city: user?.city || '',
        state: user?.state || '',
        zip_code: user?.zip_code || '',
        country: user?.country || '',
        age: calculatedAge !== null ? String(calculatedAge) : '',
        grade: user?.grade || '',
      })
    } else {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        status: 'pending_activation',
        date_of_birth: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_email: '',
        emergency_contact_relationship: '',
        avatar_url: '',
        student_id: '',
        parent_id: '',
        teacher_id: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        age: '',
        grade: '',
      })
    }
  }, [mode, user, isOpen])
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }
      // Auto-generate email when full name changes in create mode
      if (mode === 'create' && name === 'full_name' && value) {
        updated.email = generateEmailFromName(value)
      }
      // Auto-calculate age when date of birth changes
      if (name === 'date_of_birth' && value) {
        const calculatedAge = calculateAgeFromDateOfBirth(value)
        updated.age = calculatedAge !== null ? String(calculatedAge) : ''
      }
      return updated
    })
  }
  // No handleAddressChange needed; address is handled via user prop
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
    if (!formData.country) {
      toast.error('Country is required')
      return false
    }
    if (!formData.state) {
      toast.error('State/Province is required')
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

        // Normalize country and state codes to proper ISO format
        const normalizedCountry = normalizeCountryToISO3(formData.country)
        const normalizedState = normalizeStateToISO2(formData.state, normalizedCountry)

        // Generate appropriate ID based on role
        const roleIds = await generateRoleId(formData.role, normalizedCountry, normalizedState)

        // Build emergency_contact JSONB object
        const emergencyContact = {
          name: formData.emergency_contact_name || null,
          phone: formData.emergency_contact_phone || null,
          email: formData.emergency_contact_email || null,
          relationship: formData.emergency_contact_relationship || null,
        }

        // Create profile in database
        const baseProfileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status || 'active',
          date_of_birth: formData.date_of_birth || null,
          phone: formData.phone || null,
          emergency_contact: emergencyContact,
          address_line_1: formData.address_line_1 || null,
          address_line_2: formData.address_line_2 || null,
          city: formData.city || null,
          state: normalizedState || null,
          zip_code: formData.zip_code || null,
          country: normalizedCountry || null,
          age: formData.age ? Number(formData.age) : null,
          grade: formData.grade || null,
          password_hash: await hashPassword(formData.password),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Include role-specific IDs
        const profileData = {
          ...baseProfileData,
          ...roleIds,
        }

        // Encrypt sensitive profile fields before inserting
        const encryptedProfileData = encryptProfileFields(profileData)

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([encryptedProfileData])
        if (profileError) {
          // If profile creation fails, try to delete the auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          throw new Error(`Profile creation error: ${profileError.message}`)
        }
        toast.success('User created successfully!')
      } else {
        // Normalize country and state codes to proper ISO format
        const normalizedCountry = normalizeCountryToISO3(formData.country)
        const normalizedState = normalizeStateToISO2(formData.state, normalizedCountry)

        // Build emergency_contact JSONB object
        const emergencyContact = {
          name: formData.emergency_contact_name || null,
          phone: formData.emergency_contact_phone || null,
          email: formData.emergency_contact_email || null,
          relationship: formData.emergency_contact_relationship || null,
        }

        // Update existing user profile with all correct fields
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status || 'pending_activation',
          date_of_birth: formData.date_of_birth || null,
          phone: formData.phone || null,
          emergency_contact: emergencyContact,
          avatar_url: formData.avatar_url || null,
          student_id: formData.student_id || null,
          parent_id: formData.parent_id || null,
          teacher_id: formData.teacher_id || null,
          address_line_1: formData.address_line_1 || null,
          address_line_2: formData.address_line_2 || null,
          city: formData.city || null,
          state: normalizedState || null,
          zip_code: formData.zip_code || null,
          country: normalizedCountry || null,
          age: formData.age ? Number(formData.age) : null,
          grade: formData.grade || null,
          updated_at: new Date().toISOString(),
        }

        // Add password_hash if password provided
        if (formData.password) {
          updateData.password_hash = await hashPassword(formData.password)
        }

        // Encrypt sensitive profile fields before updating
        const encryptedUpdateData = encryptProfileFields(updateData)

        const { data: updatedData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(encryptedUpdateData)
          .eq('id', user!.id)
          .select()
          .single()

        if (profileError) {
          console.error('Profile update error:', profileError)
          throw new Error(`Update error: ${profileError.message}`)
        }

        if (!updatedData) {
          console.error('No data returned after update for user:', user!.id)
          throw new Error('Update failed: No data returned')
        }

        console.log('Profile updated successfully:', updatedData)
        toast.success('User updated successfully!')
      }
      onSuccess()
      onClose()
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'message' in error) {
        toast.error(
          (error as { message: string }).message || 'An error occurred while saving the user',
        )
      } else {
        toast.error('An error occurred while saving the user')
      }
    } finally {
      setLoading(false)
    }
  }
  if (!isOpen) return null
  const isReadOnly = mode === 'view'
  // Add a gray background to disabled fields in view mode
  const readOnlyClass = isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
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
              {mode === 'create' ? 'Create New User' : mode === 'edit' ? 'Edit User' : 'View User'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            style={{ cursor: 'pointer' }}
            disabled={loading}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        {/* Form - Compact with scroll */}
        <form
          onSubmit={isReadOnly ? undefined : handleSubmit}
          className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto"
        >
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Role dropdown first for add/edit */}
            {(mode === 'create' || mode === 'edit') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Shield className="h-3 w-3 inline mr-1" />
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                  required
                  disabled={isReadOnly}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Email field - hidden in create mode, shown in edit/view mode */}
            {mode !== 'create' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                  required
                  disabled={isReadOnly}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                required
                disabled={isReadOnly}
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
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                  placeholder={mode === 'create' ? 'Enter password' : 'Enter new password'}
                  required={mode === 'create'}
                  minLength={6}
                  disabled={isReadOnly}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 ${readOnlyClass}`}
                placeholder="+353 (123) 4567 890"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={
                  formData.date_of_birth && formData.date_of_birth !== 'null'
                    ? formData.date_of_birth
                    : ''
                }
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
              />
            </div>
            {/* Role-based fields */}
            {formData.role === 'student' && (
              <>
                {/* Student ID - hidden in create mode, auto-generated */}
                {mode === 'edit' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 ${readOnlyClass}`}
                      disabled
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grade</label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                    disabled={isReadOnly}
                  />
                </div>
              </>
            )}
            {formData.role === 'parent' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Parent ID</label>
                <input
                  type="text"
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                  disabled={isReadOnly}
                />
              </div>
            )}
            {formData.role === 'teacher' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teacher ID</label>
                <input
                  type="text"
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                  disabled={isReadOnly}
                />
              </div>
            )}
            {/* Always show these fields */}
            {/* Emergency Contact Fields */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                placeholder="Full Name"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                placeholder="+1234567890"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                name="emergency_contact_email"
                value={formData.emergency_contact_email}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                placeholder="email@example.com"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
              <input
                type="text"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                placeholder="Parent, Guardian, Spouse, etc."
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Avatar URL</label>
              <input
                type="text"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Age (Auto-calculated)
              </label>
              <input
                type="number"
                name="age"
                value={
                  formData.age && formData.age !== 'null' && !isNaN(Number(formData.age))
                    ? formData.age
                    : ''
                }
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                min="0"
                max="120"
                disabled
              />
            </div>
          </div>
          {/* ...removed duplicate role dropdown and age field (already present above)... */}
          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
                required
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Show state/province only if there are available states for the selected country */}
            {availableStates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  State/Province <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                  disabled={isReadOnly}
                  required
                >
                  <option value="">Select State/Province</option>
                  {availableStates.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${readOnlyClass}`}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Footer - Compact */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
                style={{ cursor: 'pointer' }}
                disabled={loading}
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
                  style={{ cursor: 'pointer' }}
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
              )}
            </>
          </div>
        </form>
      </div>
    </div>
  )
}
