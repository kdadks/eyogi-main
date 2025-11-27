import React, { useState, useEffect, useCallback } from 'react'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline'
import Pagination from '../common/Pagination'
import { supabaseAdmin } from '../../lib/supabase'
import { getStudentEnrollments } from '../../lib/api/enrollments'
import { getChildrenByParentId, deleteChild } from '../../lib/api/children'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
import type { Database } from '../../lib/supabase'
import toast from 'react-hot-toast'
import UserFormModal from './UserFormModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { getUserProfile } from '../../lib/api/users'
import { decryptProfileFields } from '../../lib/encryption'
type Profile = Database['public']['Tables']['profiles']['Row']
const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const { user: currentUser } = useAuth()
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to load users')
        return
      }
      // Decrypt profiles and filter out Supabase auth users
      const decryptedUsers = (data || []).map((user) => decryptProfileFields(user))
      const validUsers = decryptedUsers.filter(
        (user) => user.full_name && user.email && user.role && user.id !== currentUser?.id, // Don't show current admin user
      )
      setUsers(validUsers)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])
  useEffect(() => {
    loadUsers()
  }, [loadUsers])
  const handleCreateUser = () => {
    setEditingUser(null)
    setModalMode('create')
    setIsModalOpen(true)
  }
  const handleViewUser = async (user: Profile) => {
    // Fetch full user profile (with address)
    const fullUser = await getUserProfile(user.id)
    setEditingUser(fullUser || user)
    setModalMode('view')
    setIsModalOpen(true)
  }
  const handleEditUser = async (user: Profile) => {
    // Prevent editing super admin users
    if (user.role === 'super_admin' && currentUser?.id !== user.id) {
      toast.error('Cannot edit super admin users')
      return
    }
    // Fetch full user profile (with address)
    const fullUser = await getUserProfile(user.id)
    setEditingUser(fullUser || user)
    setModalMode('edit')
    setIsModalOpen(true)
  }
  const handleDeleteUser = async (userId: string, userRole: string) => {
    // Prevent deleting super admin users
    if (userRole === 'super_admin') {
      toast.error('Cannot delete super admin users')
      return
    }

    const userToDelete = users.find((u) => u.id === userId)
    if (!userToDelete) return

    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete "${userToDelete.full_name}"?\n\nThis will also delete all their enrollments${userToDelete.role === 'parent' ? ' and all their children' : ''}. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // 1. Delete enrollments if user is a student
          if (userToDelete.role === 'student') {
            const enrollments = await getStudentEnrollments(userId)
            if (enrollments.length > 0) {
              const enrollmentIds = enrollments.map((e) => e.id)
              await supabaseAdmin.from('enrollments').delete().in('id', enrollmentIds)
            }
          }
          // 2. If user is a parent, delete all their children (and their enrollments)
          if (userToDelete.role === 'parent') {
            const children = await getChildrenByParentId(userId)
            for (const child of children) {
              // Delete child enrollments
              const enrollments = await getStudentEnrollments(child.id)
              if (enrollments.length > 0) {
                const enrollmentIds = enrollments.map((e) => e.id)
                await supabaseAdmin.from('enrollments').delete().in('id', enrollmentIds)
              }
              // Delete child profile
              await deleteChild(child.id)
            }
          }
          // 3. Delete user profile
          const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
          if (error) {
            toast.error('Failed to delete user')
            return
          }
          toast.success('User and related data deleted successfully')
          loadUsers() // Refresh the list
        } catch {
          toast.error('Failed to delete user')
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }
  const handleUserSaved = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    loadUsers() // Refresh the list
  }

  const handleActivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)

      if (error) {
        toast.error('Failed to activate user')
        return
      }

      toast.success(`${userName} has been activated successfully`)
      loadUsers() // Refresh the list
    } catch {
      toast.error('Failed to activate user')
    }
  }
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.student_id && user.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' &&
        (user.role === 'admin' || user.role === 'business_admin' || user.role === 'super_admin')) ||
      user.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      user.status === statusFilter ||
      (statusFilter === 'pending_activation' && user.status === 'pending_verification')
    return matchesSearch && matchesRole && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'teacher':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      case 'parent':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'pending_activation':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatusLabel = (status: string) => {
    if (status === 'pending_verification' || status === 'pending_activation') {
      return 'Pending Activation'
    }
    const text = status.replace('_', ' ')
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatRoleLabel = (role: string) => {
    const text = role.replace('_', ' ')
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  const isProtectedUser = (user: Profile): boolean => {
    return user.role === 'super_admin' || user.id === currentUser?.id
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* User Count */}
          <div className="flex items-center text-sm text-gray-500 min-w-fit">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredUsers.length} of {users.length} users
          </div>
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Role Filter */}
          <div className="min-w-fit">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="parent">Parents</option>
            </select>
          </div>
          {/* Status Filter */}
          <div className="min-w-fit">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_activation">Pending Activation</option>
            </select>
          </div>
          {/* Add User Button */}
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer min-w-fit"
            style={{ cursor: 'pointer' }}
          >
            <UserPlusIcon className="h-4 w-4 mr-1.5" />
            Add User
          </button>
        </div>
      </div>
      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {roleFilter === 'student'
                    ? 'Student ID'
                    : roleFilter === 'all'
                      ? 'ID / Role Info'
                      : 'User ID'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </span>
                          {isProtectedUser(user) && (
                            <ShieldExclamationIcon
                              className="h-4 w-4 text-red-500 ml-2"
                              title="Protected user"
                            />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(user.role)}`}
                    >
                      {formatRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(user.status)}`}
                    >
                      {formatStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role === 'student' ? user.student_id || '-' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {(user.status === 'pending_activation' ||
                        user.status === 'pending_verification') && (
                        <button
                          onClick={() => handleActivateUser(user.id, user.full_name)}
                          className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                          title="Activate user"
                          style={{ cursor: 'pointer' }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-gray-600 hover:text-gray-900 p-1 cursor-pointer"
                        title="View user"
                        style={{ cursor: 'pointer' }}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        disabled={isProtectedUser(user) && currentUser?.id !== user.id}
                        className={`p-1 ${
                          isProtectedUser(user) && currentUser?.id !== user.id
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-900 cursor-pointer'
                        }`}
                        title={isProtectedUser(user) ? 'Protected user' : 'Edit user'}
                        style={{
                          cursor:
                            isProtectedUser(user) && currentUser?.id !== user.id
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.role)}
                        disabled={isProtectedUser(user)}
                        className={`p-1 ${
                          isProtectedUser(user)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900 cursor-pointer'
                        }`}
                        title={isProtectedUser(user) ? 'Protected user' : 'Delete user'}
                        style={{ cursor: isProtectedUser(user) ? 'not-allowed' : 'pointer' }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'Get started by adding a new user.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
          itemsPerPageOptions={[10, 25, 50, 100]}
        />
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUserSaved}
        user={editingUser || undefined}
        mode={modalMode}
      />
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  )
}
export default AdminUserManagement
