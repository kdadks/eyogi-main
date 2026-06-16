import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { XMarkIcon } from '@heroicons/react/24/outline'
import AddressForm from '../forms/AddressForm'
import { AddressFormData } from '../../lib/address-utils'
import { updateUserProfile, getUserProfile } from '../../lib/api/users'
import type { ChangedByInfo } from '../../lib/api/auditTrail'
import type { Database } from '../../lib/supabase'

// Password hashing function (same as used in signup/login)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'eyogi-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
type Profile = Database['public']['Tables']['profiles']['Row']
const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .regex(/^[a-zA-Z\s']+$/, 'Full name can only contain letters, spaces, and apostrophes'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), 'Phone number can only contain numbers'),
  date_of_birth: z.string().optional(),
  // Address fields handled by AddressForm component
  emergency_contact: z
    .object({
      name: z
        .string()
        .optional()
        .refine(
          (val) => !val || /^[a-zA-Z\s']+$/.test(val),
          'Name can only contain letters, spaces, and apostrophes',
        ),
      relationship: z.string().optional(),
      phone: z
        .string()
        .optional()
        .refine((val) => !val || /^\d+$/.test(val), 'Phone number can only contain numbers'),
      email: z
        .string()
        .optional()
        .refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
          message: 'Please enter a valid email address',
        }),
    })
    .optional(),
  preferences: z
    .object({
      language: z.string().optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          sms: z.boolean().optional(),
          push: z.boolean().optional(),
        })
        .optional(),
      accessibility: z
        .object({
          large_text: z.boolean().optional(),
          high_contrast: z.boolean().optional(),
          reduced_motion: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  password: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val === '' ||
        (val.length >= 8 &&
          /[A-Z]/.test(val) &&
          /[0-9]/.test(val) &&
          /[!@#$%^&*(),.?":{}|<>]/.test(val) &&
          !/\s/.test(val)),
      {
        message:
          'Password must be at least 8 characters with uppercase, digit, special character, and no spaces',
      },
    ),
})
type ProfileForm = z.infer<typeof profileSchema>
interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  user: Profile
  onUpdate: (updatedUser: Profile) => void
}
export default function ProfileEditModal({
  isOpen,
  onClose,
  user,
  onUpdate,
}: ProfileEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [addressData, setAddressData] = useState<AddressFormData>({
    country: '',
    state: '',
    city: '',
    address_line_1: '',
    address_line_2: '',
    zip_code: '',
  })

  // Use ref to track if form has been initialized for this modal session
  const initializedRef = useRef(false)
  const userIdRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      date_of_birth: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone: '',
        email: '',
      },
      preferences: {
        language: 'english',
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
        accessibility: {
          large_text: false,
          high_contrast: false,
          reduced_motion: false,
        },
      },
    },
  })

  // Initialize form only once when modal opens or user ID changes
  useEffect(() => {
    const initializeForm = async () => {
      if (!isOpen || !user?.id) return

      // Only initialize if not already done for this user
      if (initializedRef.current && userIdRef.current === user.id) return

      try {
        // Try to get fresh data from database
        const freshUserData = await getUserProfile(user.id)
        const userData = (freshUserData || user) as Profile

        // Initialize address form data
        setAddressData({
          address_line_1: (userData['address_line_1' as keyof typeof userData] as string) || '',
          address_line_2: (userData['address_line_2' as keyof typeof userData] as string) || '',
          city: (userData['city' as keyof typeof userData] as string) || '',
          state: (userData['state' as keyof typeof userData] as string) || '',
          zip_code: (userData['zip_code' as keyof typeof userData] as string) || '',
          country: (userData['country' as keyof typeof userData] as string) || '',
        })

        // Reset form with user data
        reset({
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          date_of_birth: userData.date_of_birth || '',
          emergency_contact: {
            name: userData.emergency_contact?.name || '',
            relationship: userData.emergency_contact?.relationship || '',
            phone: userData.emergency_contact?.phone || '',
            email: userData.emergency_contact?.email || '',
          },
          preferences: {
            language: userData.preferences?.language || 'english',
            notifications: {
              email: userData.preferences?.notifications?.email !== false,
              sms: userData.preferences?.notifications?.sms !== false,
              push: userData.preferences?.notifications?.push !== false,
            },
            accessibility: {
              large_text: (userData.preferences as any)?.accessibility?.large_text || false,
              high_contrast: (userData.preferences as any)?.accessibility?.high_contrast || false,
              reduced_motion: (userData.preferences as any)?.accessibility?.reduced_motion || false,
            },
          },
        })

        initializedRef.current = true
        userIdRef.current = user.id
      } catch {
        // Fall back to passed user data
        reset({
          full_name: user.full_name || '',
          phone: user.phone || '',
          date_of_birth: user.date_of_birth || '',
          emergency_contact: {
            name: user.emergency_contact?.name || '',
            relationship: user.emergency_contact?.relationship || '',
            phone: user.emergency_contact?.phone || '',
            email: user.emergency_contact?.email || '',
          },
          preferences: {
            language: user.preferences?.language || 'english',
            notifications: {
              email: user.preferences?.notifications?.email !== false,
              sms: user.preferences?.notifications?.sms !== false,
              push: user.preferences?.notifications?.push !== false,
            },
            accessibility: {
              large_text: (user.preferences as any)?.accessibility?.large_text || false,
              high_contrast: (user.preferences as any)?.accessibility?.high_contrast || false,
              reduced_motion: (user.preferences as any)?.accessibility?.reduced_motion || false,
            },
          },
        })

        initializedRef.current = true
        userIdRef.current = user.id
      }
    }

    if (isOpen) {
      initializeForm()
    } else {
      // Reset the initialized flag when modal closes
      initializedRef.current = false
      userIdRef.current = null
    }
  }, [isOpen, user?.id, reset]) // Only depend on isOpen and user.id, not the full user object
  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    try {
      // Build changedBy info for audit trail - the user is changing their own profile
      const changedBy: ChangedByInfo = {
        id: user.id,
        email: user.email || '',
        name: data.full_name || user.email || 'Unknown',
        role: user.role || 'student',
      }

      // Prepare update data
      const updateData: any = {
        full_name: data.full_name,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        // Use addressData instead of form data for address fields
        address_line_1: addressData.address_line_1 || null,
        address_line_2: addressData.address_line_2 || null,
        city: addressData.city || null,
        state: addressData.state || null,
        zip_code: addressData.zip_code || null,
        country: addressData.country || null,
        emergency_contact: data.emergency_contact || null,
        preferences: data.preferences || {},
      }

      // Handle password change if provided - hash it before storing
      if (data.password && data.password.trim() !== '') {
        const hashedPassword = await hashPassword(data.password)
        updateData.password_hash = hashedPassword
        toast.success('Password will be updated')
      }

      const updatedUser = await updateUserProfile(user.id, updateData, changedBy)

      toast.success('Profile updated successfully!')
      // Cast the result back to Profile type since the database returns the correct format
      onUpdate(updatedUser as Profile)
      onClose()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }
  if (!isOpen) return null
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    {...register('full_name')}
                    error={errors.full_name?.message}
                    placeholder="John Doe"
                  />
                  <Input
                    label="Phone (Numbers only)"
                    {...register('phone')}
                    error={errors.phone?.message}
                    placeholder="1234567890"
                  />
                  <Input
                    label="Date of Birth (MM/DD/YYYY)"
                    type="date"
                    className="h-10 sm:h-11 text-xs sm:text-sm"
                    style={{ fontSize: '13px' }}
                    {...register('date_of_birth')}
                    error={errors.date_of_birth?.message}
                  />
                  <div className="text-sm text-gray-600">
                    <strong>Email:</strong> {user.email} (Cannot be changed)
                  </div>
                  {user.student_id && (
                    <div className="text-sm text-gray-600">
                      <strong>Student ID:</strong> {user.student_id} (System Generated)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security - Change Password */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Change Password</h3>
                <p className="text-sm text-gray-600 mt-1">Leave blank to keep current password</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="Enter new password (optional)"
                />
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One digit</li>
                    <li>One special character (!@#$%^&*)</li>
                    <li>No spaces</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            {/* Address */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Address</h3>
                <p className="text-sm text-gray-600 mt-1">Country and State/City are required</p>
              </CardHeader>
              <CardContent>
                <AddressForm
                  data={addressData}
                  onChange={setAddressData}
                  showOptionalFields={true}
                  required={false}
                />
              </CardContent>
            </Card>
            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Name"
                    {...register('emergency_contact.name')}
                    error={errors.emergency_contact?.name?.message}
                    placeholder="Jane Doe"
                  />
                  <Input
                    label="Relationship"
                    {...register('emergency_contact.relationship')}
                    error={errors.emergency_contact?.relationship?.message}
                    placeholder="Mother, Father, Spouse, etc."
                  />
                  <Input
                    label="Contact Phone (Numbers only)"
                    {...register('emergency_contact.phone')}
                    error={errors.emergency_contact?.phone?.message}
                    placeholder="1234567890"
                  />
                  <Input
                    label="Contact Email"
                    type="email"
                    {...register('emergency_contact.email')}
                    error={errors.emergency_contact?.email?.message}
                    placeholder="contact@example.com"
                  />
                </div>
              </CardContent>
            </Card>
            {/* Notifications */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('preferences.notifications.email')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('preferences.notifications.sms')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('preferences.notifications.push')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  </label>
                </div>
              </CardContent>
            </Card>
            {/* Accessibility */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Accessibility Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('preferences.accessibility.large_text')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Large Text</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('preferences.accessibility.high_contrast')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">High Contrast</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('preferences.accessibility.reduced_motion')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Reduced Motion</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <Button type="button" variant="danger" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
