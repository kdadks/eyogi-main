
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Download,
  Mail,
  Eye,
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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface Member {
  member_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  status: 'active' | 'cancelled' | 'expired' | 'suspended'
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
  const [sortBy, setSortBy] = useState<string>('registration_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchMembers()
  }, [filterStatus, filterSubscription, sortBy, sortOrder])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      let query = supabase.from('members').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      if (filterSubscription !== 'all') {
        query = query.eq('subscription_type', filterSubscription)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query
      if (error) throw error
      setMembers(data || [])
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
      key: 'member_id',
      label: 'Member ID',
      width: 'w-24',
      sortable: true,
    },
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
          onView={(row) => console.log('View:', row)}
          onEdit={(row) => console.log('Edit:', row)}
          onDelete={(row) => console.log('Delete:', row)}
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
    </AdminLayout>
  )
}
