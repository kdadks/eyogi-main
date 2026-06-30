
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
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

interface Donation {
  id: string
  donor_first_name: string
  donor_last_name: string
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

// Helper function to format currency
const formatCurrency = (currency: string, amount: number): string => {
  const symbol = currency === 'EUR' ? '€' : currency
  return `${symbol}${amount.toFixed(2)}`
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
  
  // View/Edit/Delete state
  const [viewDonation, setViewDonation] = useState<Donation | null>(null)
  const [editDonation, setEditDonation] = useState<Donation | null>(null)
  const [deleteDonation, setDeleteDonation] = useState<Donation | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: '',
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchDonations()
  }, [filterStatus, sortBy, sortOrder])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      let query = supabase.schema('gurukul_main').from('donations').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      setDonations(data || [])
    } catch (error) {
      console.error('Error fetching donations:', error)
      // Show a user-friendly error if needed
    } finally {
      setLoading(false)
    }
  }

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const searchLower = searchTerm.toLowerCase()
      const fullName = `${donation.donor_first_name} ${donation.donor_last_name}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
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
    const rows = filteredDonations.map((d) => {
      const symbol = d.currency === 'EUR' ? '€' : d.currency
      return [
        d.id,
        `${d.donor_first_name} ${d.donor_last_name}`,
        d.donor_email,
        `${symbol}${d.amount}`,
        d.status,
        new Date(d.donation_date).toLocaleDateString(),
        d.payment_method || 'Unknown',
      ]
    })

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

  const handleView = (donation: Donation) => {
    setViewDonation(donation)
  }

  const handleEdit = (donation: Donation) => {
    setEditDonation(donation)
    setEditFormData({
      status: donation.status,
      notes: donation.notes || '',
    })
  }

  const handleDelete = (donation: Donation) => {
    setDeleteDonation(donation)
  }

  const confirmDelete = async () => {
    if (!deleteDonation) return
    
    try {
      setActionLoading(true)
      
      console.log('Attempting to delete donation:', deleteDonation.id)
      
      const supabase = createClient()
      
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Current session:', session ? 'Authenticated' : 'Not authenticated', sessionError)
      if (session) {
        console.log('User role:', session.user?.user_metadata?.role)
      }
      
      // Try delete operation
      const { data, error, status, statusText } = await supabase
        .schema('gurukul_main')
        .from('donations')
        .delete()
        .eq('id', deleteDonation.id)
        .select()

      console.log('Delete response:', { data, error, status, statusText })

      if (error) {
        console.error('Delete error details:', error)
        throw error
      }
      
      if (data.length === 0) {
        throw new Error('No rows deleted - possibly blocked by RLS policy or row not found')
      }

      setDonations(donations.filter((d) => d.id !== deleteDonation.id))
      setDeleteDonation(null)
      toast.success('Donation deleted successfully')
    } catch (error: any) {
      console.error('Error deleting donation:', error)
      toast.error(`Failed to delete donation: ${error.message || 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateDonation = async () => {
    if (!editDonation) return

    try {
      setActionLoading(true)
      const supabase = createClient()
      const { error } = await supabase
        .schema('gurukul_main')
        .from('donations')
        .update({
          status: editFormData.status,
          notes: editFormData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editDonation.id)

      if (error) throw error

      // Update local state
      setDonations(
        donations.map((d) =>
          d.id === editDonation.id
            ? { ...d, status: editFormData.status as any, notes: editFormData.notes }
            : d
        )
      )
      setEditDonation(null)
      toast.success('Donation updated successfully')
    } catch (error) {
      console.error('Error updating donation:', error)
      toast.error('Failed to update donation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkEmail = async () => {
    const selected = Array.from(selectedDonations)
    const selectedDonationData = donations.filter((d) => selected.includes(d.id))
    
    toast.success(`Preparing to send receipts to ${selectedDonationData.length} donors`, {
      duration: 4000,
    })
    
    // TODO: Implement actual email sending logic here
    // This would typically call an API endpoint that handles email sending
  }

  const columns = [
    {
      key: 'donor_first_name',
      label: 'Donor',
      sortable: true,
      render: (_: string, row: Donation) => `${row.donor_first_name} ${row.donor_last_name}`,
    },
    {
      key: 'donor_email',
      label: 'Email',
      render: (value: string) => <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: Donation) => {
        const symbol = row.currency === 'EUR' ? '€' : row.currency
        return `${symbol}${value.toFixed(2)}`
      },
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
                  onClick={handleBulkEmail}
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
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* View Donation Modal */}
      {viewDonation && (
        <Modal
          isOpen={true}
          onClose={() => setViewDonation(null)}
          title="Donation Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Donor Name</label>
                <p className="text-gray-900">{viewDonation.donor_first_name} {viewDonation.donor_last_name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <p className="text-gray-900">{viewDonation.donor_email}</p>
              </div>
              {viewDonation.donor_phone && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Phone</label>
                  <p className="text-gray-900">{viewDonation.donor_phone}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">Amount</label>
                <p className="text-gray-900 font-bold text-lg">{formatCurrency(viewDonation.currency, viewDonation.amount)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={
                      viewDonation.status === 'completed'
                        ? 'success'
                        : viewDonation.status === 'pending'
                          ? 'warning'
                          : viewDonation.status === 'failed'
                            ? 'danger'
                            : 'secondary'
                    }
                  >
                    {viewDonation.status.charAt(0).toUpperCase() + viewDonation.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Donation Date</label>
                <p className="text-gray-900">{new Date(viewDonation.donation_date).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Created At</label>
                <p className="text-gray-900">{new Date(viewDonation.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* SumUp Transaction Details */}
            {viewDonation.payment_method === 'SumUp' && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">SumUp Transaction Details</h3>
                <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-700">Payment Method:</span>
                    <span className="text-sm text-gray-900 font-medium">{viewDonation.payment_method}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-700">Amount:</span>
                    <span className="text-sm text-gray-900 font-bold">{formatCurrency(viewDonation.currency, viewDonation.amount)}</span>
                  </div>
                  {viewDonation.transaction_id && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-semibold text-gray-700">Reference ID:</span>
                      <span className="text-sm text-gray-900 font-mono break-all text-right">{viewDonation.transaction_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-700">Status:</span>
                    <span className="text-sm text-gray-900 capitalize">{viewDonation.status}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-gray-700">Transaction Date:</span>
                    <span className="text-sm text-gray-900">{new Date(viewDonation.donation_date).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {viewDonation.notes && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Notes</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">{viewDonation.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setViewDonation(null)} variant="secondary">
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewDonation(null)
                  handleEdit(viewDonation)
                }}
              >
                Edit Donation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Donation Modal */}
      {editDonation && (
        <Modal
          isOpen={true}
          onClose={() => setEditDonation(null)}
          title="Edit Donation"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Donor: <span className="font-semibold text-gray-900">{editDonation.donor_first_name} {editDonation.donor_last_name}</span></p>
              <p className="text-sm text-gray-600">Amount: <span className="font-semibold text-gray-900">{formatCurrency(editDonation.currency, editDonation.amount)}</span></p>
            </div>
            
            <Select
              label="Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              options={[
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />

            <Textarea
              label="Notes"
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              placeholder="Add any notes or comments about this donation..."
              rows={4}
            />

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setEditDonation(null)} variant="secondary" disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleUpdateDonation} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDonation && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteDonation(null)}
          title="Confirm Delete"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-900 font-semibold mb-2">Are you sure you want to delete this donation?</p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><span className="font-semibold">Donor:</span> {deleteDonation.donor_first_name} {deleteDonation.donor_last_name}</p>
                  <p><span className="font-semibold">Amount:</span> {formatCurrency(deleteDonation.currency, deleteDonation.amount)}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(deleteDonation.donation_date).toLocaleDateString()}</p>
                </div>
                <p className="text-red-600 text-sm mt-3">This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setDeleteDonation(null)} variant="secondary" disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} variant="danger" disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete Donation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
