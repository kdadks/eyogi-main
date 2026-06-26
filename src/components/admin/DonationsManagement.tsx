
import React, { useCallback, useEffect, useState } from 'react'
import {
  SearchIcon,
  FilterIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MailIcon,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

interface DonationTransactionResponse {
  id: string
  donor_name: string
  donor_email: string
  amount: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  currency: string
  donation_date: string
  created_at: string
  updated_at: string
  transaction_id?: string
  payment_method?: string
  notes?: string
}

interface DonationDetails {
  donation: DonationTransactionResponse & {
    donor_phone?: string
    donation_message?: string
  }
  auditLog?: Array<{
    id: string
    action: string
    performed_by: string
    timestamp: string
    details?: string
  }>
  transactions?: Array<{
    id: string
    amount: number
    status: string
    payment_method: string
    date: string
  }>
  receipts?: Array<{
    id: string
    email: string
    sent_at: string
    status: string
  }>
}

interface FilterState {
  search: string
  status: string
  minAmount: string
  maxAmount: string
  startDate: string
  endDate: string
}

const INITIAL_FILTERS: FilterState = {
  search: '',
  status: '',
  minAmount: '',
  maxAmount: '',
  startDate: '',
  endDate: '',
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  refunded: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4" />,
  pending: <Clock className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  refunded: <AlertCircle className="w-4 h-4" />,
}

export default function DonationsManagement() {
  const [donations, setDonations] = useState<DonationTransactionResponse[]>([])
  const [selectedDonation, setSelectedDonation] = useState<DonationDetails | null>(null)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'transactions' | 'receipts'>(
    'overview',
  )
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    receipts_sent: 0,
    pending: 0,
  })

  // Fetch donations list
  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        if (filters.search) params.append('search', filters.search)
        if (filters.status) params.append('status', filters.status)
        if (filters.minAmount) params.append('minAmount', filters.minAmount)
        if (filters.maxAmount) params.append('maxAmount', filters.maxAmount)
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        params.append('sortBy', sortBy)
        params.append('sortOrder', sortOrder)

        const response = await fetch(`/api/admin/donations/list?${params}`)
        if (response.ok) {
          const data = await response.json()
          setDonations(data.donations || [])
          setStats({
            total: data.stats?.total || 0,
            completed: data.stats?.completed || 0,
            receipts_sent: data.stats?.receipts_sent || 0,
            pending: data.stats?.pending || 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch donations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDonations()
  }, [page, pageSize, filters, sortBy, sortOrder])

  // Fetch donation details
  const fetchDonationDetails = async (donationId: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedDonation(data)
      }
    } catch (error) {
      console.error('Failed to fetch donation details:', error)
    }
  }

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }

  const handleSort = (field: 'date' | 'amount' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Donor Name', 'Email', 'Amount', 'Status', 'Transaction ID']
    const rows = donations.map((d) => [
      new Date(d.donation_date).toLocaleDateString(),
      d.donor_name,
      d.donor_email,
      `${d.currency} ${d.amount.toFixed(2)}`,
      d.status,
      d.transaction_id || 'N/A',
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Donations</p>
              <p className="text-2xl font-bold mt-1">${(stats.total || 0).toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Receipts Sent</p>
              <p className="text-2xl font-bold mt-1">{stats.receipts_sent}</p>
            </div>
            <MailIcon className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-1">
            <div className="flex-1 relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by donor name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FilterIcon className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10000"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('date')}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Donor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('amount')}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading donations...
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No donations found
                  </td>
                </tr>
              ) : (
                donations.map((donation) => (
                  <tr key={donation.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(donation.donation_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{donation.donor_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{donation.donor_email}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {donation.currency} {donation.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[donation.status].bg} ${STATUS_COLORS[donation.status].text} ${STATUS_COLORS[donation.status].border}`}
                      >
                        {STATUS_ICONS[donation.status]}
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => fetchDonationDetails(donation.id)}
                        className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {Math.ceil(donations.length / pageSize) || 1}
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={donations.length < pageSize}
              className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Donation Details</h2>
              <button
                onClick={() => setSelectedDonation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              {(['overview', 'audit', 'transactions', 'receipts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Donor Name</p>
                      <p className="font-semibold">{selectedDonation.donation.donor_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedDonation.donation.donor_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold text-lg">
                        {selectedDonation.donation.currency} {selectedDonation.donation.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedDonation.donation.status].bg} ${STATUS_COLORS[selectedDonation.donation.status].text} ${STATUS_COLORS[selectedDonation.donation.status].border}`}
                        >
                          {STATUS_ICONS[selectedDonation.donation.status]}
                          {selectedDonation.donation.status.charAt(0).toUpperCase() +
                            selectedDonation.donation.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Donation Date</p>
                      <p className="font-semibold">
                        {new Date(selectedDonation.donation.donation_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-semibold text-xs font-mono">
                        {selectedDonation.donation.transaction_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-3">
                  {selectedDonation.auditLog?.length ? (
                    selectedDonation.auditLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-600">
                            {log.performed_by} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No audit logs available</p>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-3">
                  {selectedDonation.transactions?.length ? (
                    selectedDonation.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-semibold">{tx.payment_method}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(tx.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${tx.amount.toFixed(2)}</p>
                          <p
                            className={`text-xs font-medium ${
                              tx.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                            }`}
                          >
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No transactions available</p>
                  )}
                </div>
              )}

              {activeTab === 'receipts' && (
                <div className="space-y-3">
                  {selectedDonation.receipts?.length ? (
                    selectedDonation.receipts.map((receipt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-semibold">{receipt.email}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(receipt.sent_at).toLocaleString()}
                          </p>
                        </div>
                        <p
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            receipt.status === 'sent'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {receipt.status}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No receipts available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
