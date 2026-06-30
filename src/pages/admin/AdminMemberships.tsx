
import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import {
  Download,
  Mail,
  Plus,
  Users,
  UserCheck,
  DollarSign,
} from 'lucide-react'
import {
  AdminLayout,
  StatCard,
  Card,
  CardBody,
  DataTable,
  Button,
  Status,
  Badge,
  Modal,
  Select,
  Input,
} from '@/components/admin'

interface Member {
  member_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'pending'
  subscription_type: 'monthly' | 'annual'
  registration_date: string
  renewal_date?: string
  cancellation_date?: string
}

export default function AdminMemberships() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSubscription, setFilterSubscription] = useState('all')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<Member | null>(null)
  const [viewMember, setViewMember] = useState<Member | null>(null)
  const [sortBy, setSortBy] = useState<string>('registration_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchMembers()
  }, [filterStatus, filterSubscription, sortBy, sortOrder])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      
      // Fetch from backend API endpoint (which uses service role, bypassing RLS)
      const response = await fetch('/api/members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`)
      }
      
      const result = await response.json()
      const data = result.members || []
      
      // Filter based on UI filters
      let filteredData = data
      
      if (filterStatus !== 'all') {
        filteredData = filteredData.filter((member: any) => member.status === filterStatus)
      }
      
      if (filterSubscription !== 'all') {
        filteredData = filteredData.filter((member: any) => member.membership_type === filterSubscription)
      }
      
      // Sort based on sortBy and sortOrder
      const sortKeyMap: Record<string, string> = {
        member_id: 'id',
        registration_date: 'joined_date',
        renewal_date: 'expiry_date',
      }
      const dbSortKey = sortKeyMap[sortBy] || sortBy
      
      filteredData.sort((a: any, b: any) => {
        const aVal = a[dbSortKey] || ''
        const bVal = b[dbSortKey] || ''
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
      
      // Map database columns to component interface
      const mappedMembers = filteredData.map((row: any) => ({
        member_id: row.id,
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email || '',
        phone: row.phone,
        status: row.status || 'pending',
        subscription_type: row.membership_type || 'monthly',
        registration_date: row.joined_date,
        renewal_date: row.expiry_date,
        cancellation_date: undefined,
      }))
      
      setMembers(mappedMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        member.first_name.toLowerCase().includes(searchLower) ||
        member.last_name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.member_id.toLowerCase().includes(searchLower)
      )
    })
  }, [members, searchTerm])

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    revenue: members
      .filter((m) => m.status === 'active')
      .reduce((sum, m) => sum + (m.subscription_type === 'annual' ? 120 : 11), 0),
  }

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.member_id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleSelectRow = (row: Member, selected: boolean) => {
    const newSelected = new Set(selectedMembers)
    if (selected) {
      newSelected.add(row.member_id)
    } else {
      newSelected.delete(row.member_id)
    }
    setSelectedMembers(newSelected)
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setIsEditModalOpen(true)
  }

  const handleView = (member: Member) => {
    setViewMember(member)
  }

  const handleSaveEdit = async () => {
    if (!editingMember) return
    try {
      // Call backend API to update member
      const response = await fetch(`/api/members/${editingMember.member_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: editingMember.first_name,
          last_name: editingMember.last_name,
          email: editingMember.email,
          phone: editingMember.phone,
          status: editingMember.status,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update member: ${response.statusText}`)
      }

      toast.success(`Member ${editingMember.first_name} ${editingMember.last_name} updated successfully`)
      setIsEditModalOpen(false)
      setEditingMember(null)
      await fetchMembers()
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
    }
  }

  const handleDeleteMember = (member: Member) => {
    setDeleteConfirmMember(member)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmMember) return
    try {
      // Call backend API to delete member from database
      const response = await fetch(`/api/members/${deleteConfirmMember.member_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete member: ${response.statusText}`)
      }

      // Remove from UI after successful deletion
      setMembers(members.filter((m) => m.member_id !== deleteConfirmMember.member_id))
      toast.success(`Member ${deleteConfirmMember.first_name} ${deleteConfirmMember.last_name} deleted successfully`)
      setDeleteConfirmMember(null)
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('Failed to delete member')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Member ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'Plan',
      'Registered',
      'Renews',
    ]
    const rows = filteredMembers.map((m) => [
      m.member_id,
      m.first_name,
      m.last_name,
      m.email,
      m.phone || '-',
      m.status,
      m.subscription_type,
      new Date(m.registration_date).toLocaleDateString(),
      m.renewal_date ? new Date(m.renewal_date).toLocaleDateString() : '-',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memberships-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (_value: string, row: Member) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'subscription_type',
      label: 'Plan',
      render: (value: string) => (
        <Badge variant={value === 'annual' ? 'primary' : 'secondary'}>
          {value === 'annual' ? 'Annual (€120)' : 'Monthly (€11)'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Status
          status={value as any}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
        />
      ),
    },
    {
      key: 'registration_date',
      label: 'Registered',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'renewal_date',
      label: 'Renews',
      render: (value: string | undefined) =>
        value ? new Date(value).toLocaleDateString() : '-',
    },
  ]

  return (
    <AdminLayout
      title="Memberships"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Memberships' },
      ]}
      onSearch={setSearchTerm}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value={stats.total}
          color="primary"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Active Memberships"
          value={stats.active}
          color="success"
          icon={<UserCheck className="w-6 h-6" />}
          change={{ value: 8, direction: 'up' }}
        />
        <StatCard
          title="Monthly Revenue"
          value={`€${stats.revenue}`}
          color="warning"
          icon={<DollarSign className="w-6 h-6" />}
          change={{ value: 12, direction: 'up' }}
        />
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
              />

              <Select
                label="Filter by Plan"
                value={filterSubscription}
                onChange={(e) => setFilterSubscription(e.target.value)}
                options={[
                  { value: 'all', label: 'All Plans' },
                  { value: 'monthly', label: 'Monthly (€11)' },
                  { value: 'annual', label: 'Annual (€120)' },
                ]}
              />

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => {
                    setFilterStatus('all')
                    setFilterSubscription('all')
                    setSearchTerm('')
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {selectedMembers.size > 0 && (
                <Button
                  onClick={() => {
                    // Handle bulk email
                  }}
                  icon={<Mail className="w-4 h-4" />}
                  variant="secondary"
                >
                  Email ({selectedMembers.size})
                </Button>
              )}
              <Button onClick={exportToCSV} icon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Member
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredMembers}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectable
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          selectedRows={selectedMembers}
          rowKey="member_id"
          pagination={{
            total: filteredMembers.length,
            limit: 10,
            offset: 0,
          }}
          onView={handleView}
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
        />
      </Card>

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Member"
      >
        <div className="space-y-4">
          <Input label="First Name" placeholder="John" required />
          <Input label="Last Name" placeholder="Doe" required />
          <Input label="Email" type="email" placeholder="john@example.com" required />
          <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
          <Select
            label="Subscription Plan"
            options={[
              { value: 'monthly', label: 'Monthly (€11)' },
              { value: 'annual', label: 'Annual (€120)' },
            ]}
            required
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Add Member</Button>
          </div>
        </div>
      </Modal>

      {/* View Member Modal */}
      {viewMember && (
        <Modal isOpen={!!viewMember} onClose={() => setViewMember(null)}>
          <div className="space-y-4 p-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold">Member Details</h2>
              <button
                onClick={() => setViewMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Member Information */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Member Name</span>
                <span className="text-sm text-gray-900 font-medium">{viewMember.first_name} {viewMember.last_name}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Email</span>
                <span className="text-sm text-gray-900 break-all">{viewMember.email}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Phone</span>
                <span className="text-sm text-gray-900">{viewMember.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Member ID</span>
                <span className="text-sm text-gray-900 font-mono">{viewMember.member_id}</span>
              </div>
            </div>

            {/* Membership Information */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Plan Type</span>
                <Badge variant={viewMember.subscription_type === 'annual' ? 'primary' : 'secondary'}>
                  {viewMember.subscription_type === 'annual' ? 'Annual (€120)' : 'Monthly (€11)'}
                </Badge>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Status</span>
                <Status
                  status={viewMember.status as any}
                  label={viewMember.status.charAt(0).toUpperCase() + viewMember.status.slice(1)}
                />
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Joined Date</span>
                <span className="text-sm text-gray-900">{new Date(viewMember.registration_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-gray-600">Renewal Date</span>
                <span className="text-sm text-gray-900">{viewMember.renewal_date ? new Date(viewMember.renewal_date).toLocaleString() : '-'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                onClick={() => setViewMember(null)}
                variant="secondary"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewMember(null)
                  handleEditMember(viewMember)
                }}
              >
                Edit Member
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingMember && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold">Edit Member</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editingMember.first_name}
                onChange={(e) =>
                  setEditingMember({ ...editingMember, first_name: e.target.value })
                }
              />
              <Input
                label="Last Name"
                value={editingMember.last_name}
                onChange={(e) =>
                  setEditingMember({ ...editingMember, last_name: e.target.value })
                }
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={editingMember.email}
              onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editingMember.phone || ''}
              onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
            />
            <Select
              label="Status"
              value={editingMember.status}
              onChange={(e) =>
                setEditingMember({ ...editingMember, status: e.target.value as any })
              }
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setIsEditModalOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmMember && (
        <Modal isOpen={!!deleteConfirmMember} onClose={() => setDeleteConfirmMember(null)}>
          <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold text-red-600">Delete Member</h2>
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{deleteConfirmMember.first_name} {deleteConfirmMember.last_name}</strong>?
            </p>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setDeleteConfirmMember(null)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
              >
                Delete Member
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
