
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Download,
  Mail,
  Eye,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import {
  AdminLayout,
  StatCard,
  Card,
  CardBody,
  DataTable,
  Button,
  Badge,
  Modal,
  Select,
  Input,
  Status,
  Textarea,
} from '@/components/admin'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface Donation {
  id: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  amount: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  currency: string
  donation_date: string
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
  transaction_id?: string
}

export default function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDonations, setSelectedDonations] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>('donation_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchDonations()
  }, [filterStatus, sortBy, sortOrder])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      let query = supabase.from('donations').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query
      if (error) throw error
      setDonations(data || [])
    } catch (error) {
      console.error('Error fetching donations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        donation.donor_name.toLowerCase().includes(searchLower) ||
        donation.donor_email.toLowerCase().includes(searchLower) ||
        donation.id.toLowerCase().includes(searchLower)
      )
    })
  }, [donations, searchTerm])

  const stats = {
    total: donations.length,
    completed: donations.filter((d) => d.status === 'completed').length,
    totalAmount: donations
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0),
    pending: donations.filter((d) => d.status === 'pending').length,
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
      setSelectedDonations(new Set(filteredDonations.map((d) => d.id)))
    } else {
      setSelectedDonations(new Set())
    }
  }

  const handleSelectRow = (row: Donation, selected: boolean) => {
    const newSelected = new Set(selectedDonations)
    if (selected) {
      newSelected.add(row.id)
    } else {
      newSelected.delete(row.id)
    }
    setSelectedDonations(newSelected)
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Donor', 'Email', 'Amount', 'Status', 'Date', 'Payment Method']
    const rows = filteredDonations.map((d) => [
      d.id,
      d.donor_name,
      d.donor_email,
      `${d.currency}${d.amount}`,
      d.status,
      new Date(d.donation_date).toLocaleDateString(),
      d.payment_method || 'Unknown',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'donor_name',
      label: 'Donor',
      sortable: true,
    },
    {
      key: 'donor_email',
      label: 'Email',
      render: (value: string) => <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: Donation) => `${row.currency}${value.toFixed(2)}`,
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (value: string | undefined) => (
        <Badge variant="secondary">{value || 'Unknown'}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge
          variant={
            value === 'completed'
              ? 'success'
              : value === 'pending'
                ? 'warning'
                : value === 'failed'
                  ? 'danger'
                  : 'secondary'
          }
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'donation_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      title="Donations"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Donations' },
      ]}
      onSearch={setSearchTerm}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Donations"
          value={stats.total}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          color="success"
          change={{ value: 15, direction: 'up' }}
        />
        <StatCard
          title="Total Revenue"
          value={`€${stats.totalAmount.toFixed(2)}`}
          color="info"
          change={{ value: 24, direction: 'up' }}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          color="warning"
        />
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'refunded', label: 'Refunded' },
                ]}
              />

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => {
                    setFilterStatus('all')
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
              {selectedDonations.size > 0 && (
                <Button
                  onClick={() => {
                    // Handle bulk email
                  }}
                  icon={<Mail className="w-4 h-4" />}
                  variant="secondary"
                >
                  Send Receipt ({selectedDonations.size})
                </Button>
              )}
              <Button onClick={exportToCSV} icon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredDonations}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectable
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          selectedRows={selectedDonations}
          rowKey="id"
          pagination={{
            total: filteredDonations.length,
            limit: 10,
            offset: 0,
          }}
          onView={(row) => console.log('View:', row)}
          onEdit={(row) => console.log('Edit:', row)}
          onDelete={(row) => console.log('Delete:', row)}
        />
      </Card>
    </AdminLayout>
  )
}
