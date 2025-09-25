import React, { useState, useEffect } from 'react'
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
import type { Database } from '../../lib/supabase'
type Profile = Database['public']['Tables']['profiles']['Row']
const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  // Address fields handled by AddressForm component
  emergency_contact: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
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
  const [currentUser, setCurrentUser] = useState<Profile>(user)
  const [addressData, setAddressData] = useState<AddressFormData>({
    country: '',
    state: '',
    city: '',
    address_line_1: '',
    address_line_2: '',
    zip_code: '',
  })
  // Debug: Check what user data we're receiving when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔧 ProfileEditModal - Received user prop:', {
        id: user?.id,
        full_name: user?.full_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        address_line_1: (user as any)?.address_line_1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        city: (user as any)?.city,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hasAddressData: !!((user as any)?.address_line_1 || (user as any)?.city),
      })
    }
  }, [isOpen, user])
  // Load fresh user data when modal opens to ensure we have the latest address data
  useEffect(() => {
    const loadFreshUserData = async () => {
      if (isOpen && user?.id) {
        try {
          const freshUserData = await getUserProfile(user.id)
          if (freshUserData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userData = freshUserData as any
            console.log('ProfileEditModal: Address data loaded:', {
              address_line_1: userData.address_line_1,
              city: userData.city,
              state: userData.state,
              country: userData.country,
              zip_code: userData.zip_code,
            })
            setCurrentUser(freshUserData as Profile)
          }
        } catch (error) {
          // Fall back to the passed user data if there's an error
          setCurrentUser(user)
        }
      }
    }
    if (isOpen) {
      loadFreshUserData()
    } else {
      // Reset to original user when modal closes
      setCurrentUser(user)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id])
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentUser.full_name || '',
      phone: currentUser.phone || '',
      date_of_birth: currentUser.date_of_birth || '',
      // Address fields handled separately by AddressForm component
      emergency_contact: {
        name: currentUser.emergency_contact?.name || '',
        relationship: currentUser.emergency_contact?.relationship || '',
        phone: currentUser.emergency_contact?.phone || '',
        email: currentUser.emergency_contact?.email || '',
      },
      preferences: {
        language: currentUser.preferences?.language || 'english',
        notifications: {
          email: currentUser.preferences?.notifications?.email !== false,
          sms: currentUser.preferences?.notifications?.sms !== false,
          push: currentUser.preferences?.notifications?.push !== false,
        },
        accessibility: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          large_text: (currentUser.preferences as any)?.accessibility?.large_text || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          high_contrast: (currentUser.preferences as any)?.accessibility?.high_contrast || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reduced_motion: (currentUser.preferences as any)?.accessibility?.reduced_motion || false,
        },
      },
    },
  })
  // Reset form when currentUser changes (after fresh data is loaded)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData = currentUser as any
    console.log('ProfileEditModal: Resetting form with currentUser data:', {
      full_name: userData.full_name,
      address_line_1: userData.address_line_1,
      city: userData.city,
      state: userData.state,
      country: userData.country,
    })
    // Initialize address form data
    setAddressData({
      address_line_1: (currentUser['address_line_1' as keyof typeof currentUser] as string) || '',
      address_line_2: (currentUser['address_line_2' as keyof typeof currentUser] as string) || '',
      city: (currentUser['city' as keyof typeof currentUser] as string) || '',
      state: (currentUser['state' as keyof typeof currentUser] as string) || '',
      zip_code: (currentUser['zip_code' as keyof typeof currentUser] as string) || '',
      country: (currentUser['country' as keyof typeof currentUser] as string) || '',
    })
    reset({
      full_name: currentUser.full_name || '',
      phone: currentUser.phone || '',
      date_of_birth: currentUser.date_of_birth || '',
      // Address fields handled separately by AddressForm component
      emergency_contact: {
        name: currentUser.emergency_contact?.name || '',
        relationship: currentUser.emergency_contact?.relationship || '',
        phone: currentUser.emergency_contact?.phone || '',
        email: currentUser.emergency_contact?.email || '',
      },
      preferences: {
        language: currentUser.preferences?.language || 'english',
        notifications: {
          email: currentUser.preferences?.notifications?.email !== false,
          sms: currentUser.preferences?.notifications?.sms !== false,
          push: currentUser.preferences?.notifications?.push !== false,
        },
        accessibility: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          large_text: (currentUser.preferences as any)?.accessibility?.large_text || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          high_contrast: (currentUser.preferences as any)?.accessibility?.high_contrast || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reduced_motion: (currentUser.preferences as any)?.accessibility?.reduced_motion || false,
        },
      },
    })
  }, [currentUser, reset])
  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    try {
      const updatedUser = await updateUserProfile(user.id, {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      toast.success('Profile updated successfully!')
      // Cast the result back to Profile type since the database returns the correct format
      onUpdate(updatedUser as Profile)
      onClose()
    } catch (error) {
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
              className="text-gray-400 hover:text-gray-500 p-2"
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
                  />
                  <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
                  <Input
                    label="Date of Birth"
                    type="date"
                    {...register('date_of_birth')}
                    error={errors.date_of_birth?.message}
                  />
                  <div className="text-sm text-gray-600">
                    <strong>Email:</strong> {currentUser.email} (Cannot be changed)
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Student ID:</strong> {currentUser.student_id} (System Generated)
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Address */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Address</h3>
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
                  />
                  <Input
                    label="Relationship"
                    {...register('emergency_contact.relationship')}
                    error={errors.emergency_contact?.relationship?.message}
                  />
                  <Input
                    label="Contact Phone"
                    {...register('emergency_contact.phone')}
                    error={errors.emergency_contact?.phone?.message}
                  />
                  <Input
                    label="Contact Email"
                    type="email"
                    {...register('emergency_contact.email')}
                    error={errors.emergency_contact?.email?.message}
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
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
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
