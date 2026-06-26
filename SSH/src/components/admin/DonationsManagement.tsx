import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import {
  Search,
  Download,
  Eye,
  Mail,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface DonationTransactionResponse {
  id: string
  donor_first_name: string
  donor_last_name: string
  donor_email: string
  amount: number
  currency: string
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  created_at: string
  payment_id: string
  checkout_reference: string
  receipt_sent_at?: string
  donation_message?: string
}

interface DonationDetails {
  donation: DonationTransactionResponse & {
    donor_phone?: string
    donation_message?: string
  }
  auditLog: any[]
  transactions: any[]
  receipts: any[]
}

interface FilterState {
  status: string
  search: string
  minAmount: string
  maxAmount: string
  startDate: string
  endDate: string
  sortBy: string
  sortOrder: string
}

const INITIAL_FILTERS: FilterState = {
  status: 'all',
  search: '',
  minAmount: '',
  maxAmount: '',
  startDate: '',
  endDate: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
}

export default function DonationsManagement() {
  const [donations, setDonations] = useState<DonationTransactionResponse[]>([])
  const [selectedDonation, setSelectedDonation] = useState<DonationDetails | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'transactions' | 'receipts'>(
    'overview',
  )

  // Fetch donations
  const fetchDonations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      if (filters.minAmount) params.append('minAmount', filters.minAmount)
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/admin/donations/list?${params}`)
      const data = await response.json()

      setDonations(data.donations || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch donations:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  // Fetch donation details
  const fetchDonationDetails = async (donationId: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}`)
      const data = await response.json()
      setSelectedDonation(data)
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch donation details:', error)
    }
  }

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1)
  }, [filters])

  // Fetch donations when page or filters change
  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  // Export data to CSV
  const handleExport = () => {
    const csv = [
      ['Donor Name', 'Email', 'Amount', 'Currency', 'Status', 'Date', 'Receipt Sent'],
      ...donations.map((d) => [
        `${d.donor_first_name} ${d.donor_last_name}`,
        d.donor_email,
        d.amount.toFixed(2),
        d.currency,
        d.status,
        new Date(d.created_at).toLocaleDateString(),
        d.receipt_sent_at ? 'Yes' : 'No',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalPages = Math.ceil(total / pageSize)
  const isFirstPage = page === 1
  const isLastPage = page >= totalPages

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'pending':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donation Transactions</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all donation transactions with full audit trails
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Filters
          </h2>
          {Object.values(filters).some((v) => v) && (
            <Button
              onClick={handleResetFilters}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Reset All
            </Button>
          )}
        </div>

        {/* Main search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by donor name or email..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
          </Button>
        </div>

        {/* Advanced filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Min Amount</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Max Amount</label>
              <Input
                type="number"
                placeholder="999999"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="created_at">Date</option>
                <option value="amount">Amount</option>
                <option value="donor_first_name">Name</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {donations.filter((d) => d.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receipts Sent</p>
              <p className="text-2xl font-bold text-purple-600">
                {donations.filter((d) => d.receipt_sent_at).length}
              </p>
            </div>
            <Mail className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {donations.filter((d) => d.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : donations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No donations found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Donor
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {donation.donor_first_name} {donation.donor_last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{donation.donor_email}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {donation.currency} {donation.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`gap-1 ${getStatusColor(donation.status)}`}>
                          {getStatusIcon(donation.status)}
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {donation.receipt_sent_at ? (
                          <Badge className="gap-1 bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-gray-50 text-gray-700">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(donation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fetchDonationDetails(donation.id)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{' '}
                {total} donations
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={pageSize.toString()}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={isFirstPage}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-sm font-medium">
                      Page {page} of {totalPages}
                    </span>
                  </div>
                  <Button
                    onClick={() => setPage((p) => (isLastPage ? p : p + 1))}
                    disabled={isLastPage}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl max-h-[90vh] overflow-y-auto p-6 w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Donation Details</h2>
                <p className="text-gray-600 mt-1">
                  Full transaction history and audit trail for this donation
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex gap-4 border-b">
                {(['overview', 'audit', 'transactions', 'receipts'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-4 font-medium ${
                      activeTab === tab
                        ? 'border-b-2 border-orange-500 text-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Donor Name</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedDonation.donation.donor_first_name}{' '}
                        {selectedDonation.donation.donor_last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedDonation.donation.donor_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedDonation.donation.currency}{' '}
                        {selectedDonation.donation.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge
                        className={`mt-1 ${getStatusColor(selectedDonation.donation.status)}`}
                      >
                        {selectedDonation.donation.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Donation Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(selectedDonation.donation.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Receipt Sent</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedDonation.donation.receipt_sent_at
                          ? new Date(selectedDonation.donation.receipt_sent_at).toLocaleString()
                          : 'Not sent'}
                      </p>
                    </div>
                  </div>

                  {selectedDonation.donation.donation_message && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">Donor Message:</p>
                      <p className="text-gray-700">{selectedDonation.donation.donation_message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Audit Log Tab */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  {selectedDonation.auditLog.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No audit logs available</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDonation.auditLog.map((log: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {log.status_before && (
                            <p className="text-sm text-gray-600">
                              {log.status_before} → {log.status_after}
                            </p>
                          )}
                          {log.changed_by && (
                            <p className="text-xs text-gray-500 mt-1">By: {log.changed_by}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-3">
                  {selectedDonation.transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No transactions available</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDonation.transactions.map((txn: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {txn.transaction_type.toUpperCase()}
                            </span>
                            <Badge
                              className={
                                txn.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : txn.status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {txn.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Amount: {txn.currency} {txn.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(txn.initiated_at).toLocaleString()}
                          </p>
                          {txn.transaction_id && (
                            <p className="text-xs font-mono text-gray-500 mt-1">
                              ID: {txn.transaction_id}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Receipts Tab */}
              {activeTab === 'receipts' && (
                <div className="space-y-3">
                  {selectedDonation.receipts.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No receipts sent yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDonation.receipts.map((receipt: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {receipt.email_type.toUpperCase()} EMAIL
                            </span>
                            <Badge
                              className={
                                receipt.delivery_status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : receipt.delivery_status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {receipt.delivery_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">To: {receipt.email_address}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sent: {new Date(receipt.sent_at).toLocaleString()}
                          </p>
                          {receipt.failure_reason && (
                            <p className="text-xs text-red-600 mt-2">
                              Error: {receipt.failure_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
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
