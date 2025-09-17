import React, { useState, useEffect } from 'react'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../lib/supabase'
import toast from 'react-hot-toast'
import UserFormModal from './UserFormModal'

type Profile = Database['public']['Tables']['profiles']['Row']

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const { user: currentUser } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading users:', error)
        toast.error('Failed to load users')
        return
      }

      // Filter out Supabase auth users (users without proper profile data)
      const validUsers = (data || []).filter(
        (user) => user.full_name && user.email && user.role && user.id !== currentUser?.id, // Don't show current admin user
      )

      setUsers(validUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: Profile) => {
    // Prevent editing super admin users
    if (user.role === 'super_admin' && currentUser?.id !== user.id) {
      toast.error('Cannot edit super admin users')
      return
    }

    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteUser = async (userId: string, userRole: string) => {
    // Prevent deleting super admin users
    if (userRole === 'super_admin') {
      toast.error('Cannot delete super admin users')
      return
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId)

      if (error) {
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
        return
      }

      toast.success('User deleted successfully')
      loadUsers() // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleUserSaved = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    loadUsers() // Refresh the list
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.student_id && user.student_id.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

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
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage students, teachers, and administrators</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search */}
          <div className="relative">
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
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
              <option value="parent">Parents</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending</option>
            </select>
          </div>

          {/* Results count */}
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredUsers.length} of {users.length} users
          </div>
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
                  Student ID
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
              {filteredUsers.map((user) => (
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
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}
                    >
                      {user.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.student_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          /* View user details */
                        }}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="View user"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleEditUser(user)}
                        disabled={isProtectedUser(user) && currentUser?.id !== user.id}
                        className={`p-1 ${
                          isProtectedUser(user) && currentUser?.id !== user.id
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-900'
                        }`}
                        title={isProtectedUser(user) ? 'Protected user' : 'Edit user'}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id, user.role)}
                        disabled={isProtectedUser(user)}
                        className={`p-1 ${
                          isProtectedUser(user)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        title={isProtectedUser(user) ? 'Protected user' : 'Delete user'}
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

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUserSaved}
        user={editingUser}
        mode={editingUser ? 'edit' : 'create'}
      />
    </div>
  )
}

export default AdminUserManagement
