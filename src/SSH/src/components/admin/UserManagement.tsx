import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { User } from '@/types'
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/api/users'
import { formatDate, toSentenceCase } from '@/lib/utils'
import { getRoleColor } from '@/lib/auth/authUtils'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [deleteLoading, setDeleteLoading] = useState(false)
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
  useEffect(() => {
    loadUsers()
  }, [])
  const filterUsers = useCallback(() => {
    let filtered = users
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.student_id?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }
    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [users, searchTerm, roleFilter])
  useEffect(() => {
    filterUsers()
  }, [filterUsers])
  const loadUsers = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }
  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    try {
      await updateUserRole(userId, newRole)
      await loadUsers()
      setEditingUser(null)
      toast.success('User role updated successfully')
    } catch {
      toast.error('Failed to update user role')
    }
  }
  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId)
    if (!userToDelete) return

    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete "${userToDelete.full_name || userToDelete.email}"? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteLoading(true)
        try {
          await deleteUser(userId)
          await loadUsers()
          toast.success('User deleted successfully')
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        } catch {
          toast.error('Failed to delete user')
        } finally {
          setDeleteLoading(false)
        }
      },
    })
  }
  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    admins: users.filter((u) => u.role === 'admin').length,
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <UserGroupIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
            <div className="text-sm text-gray-600">Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.teachers}</div>
            <div className="text-sm text-gray-600">Teachers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
      </div>
      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-bold">User Management</h2>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">No users match your current filters.</p>
            </div>
          ) : (
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
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.age && (
                                <div className="text-xs text-gray-400">Age: {user.age}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingUser?.id === user.id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={editingUser.role}
                                onChange={(e) =>
                                  setEditingUser({
                                    ...editingUser,
                                    role: e.target.value as User['role'],
                                  })
                                }
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateRole(user.id, editingUser.role)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Badge className={getRoleColor(user.role)} size="sm">
                              {toSentenceCase(user.role)}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.student_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setViewingUser(user)
                              }}
                              title="View User Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(user)}>
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {filteredUsers.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4 px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                    {filteredUsers.length} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: Math.ceil(filteredUsers.length / itemsPerPage) },
                        (_, i) => i + 1,
                      )
                        .slice(
                          Math.max(0, currentPage - 2),
                          Math.min(Math.ceil(filteredUsers.length / itemsPerPage), currentPage + 2),
                        )
                        .map((page) => (
                          <Button
                            key={page}
                            size="sm"
                            variant={currentPage === page ? 'primary' : 'ghost'}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setCurrentPage(
                          Math.min(Math.ceil(filteredUsers.length / itemsPerPage), currentPage + 1),
                        )
                      }
                      disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* User Details Modal */}
      {(() => {
        if (viewingUser) {
          return true
        }
        return false
      })() &&
        viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingUser.full_name || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{viewingUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <Badge className={getRoleColor(viewingUser.role)} size="sm">
                          {toSentenceCase(viewingUser.role)}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Student ID
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingUser.student_id || 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingUser.age || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingUser.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date of Birth
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {viewingUser.date_of_birth
                            ? formatDate(viewingUser.date_of_birth)
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <Badge
                          className={
                            viewingUser.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                          size="sm"
                        >
                          {toSentenceCase(viewingUser.status || 'active')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {/* Address Information */}
                  {(viewingUser.address_line_1 || viewingUser.city) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Street Address
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingUser.address_line_1 || 'Not provided'}
                          </p>
                          {viewingUser.address_line_2 && (
                            <p className="mt-1 text-sm text-gray-900">
                              {viewingUser.address_line_2}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingUser.city || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">State</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingUser.state || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            ZIP Code
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingUser.zip_code || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Country</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {viewingUser.country || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(viewingUser.created_at)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Updated
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(viewingUser.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}
