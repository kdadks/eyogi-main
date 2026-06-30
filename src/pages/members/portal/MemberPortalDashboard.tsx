/**
 * Member Portal Dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Heart,
  Calendar,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MemberProfile, MemberDonation, MemberPayment } from '@/types/member'
import MemberPortalLayout from '@/components/members/MemberPortalLayout'

const supabase = createClient()

export default function MemberPortalDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [recentDonations, setRecentDonations] = useState<MemberDonation[]>([])
  const [recentPayments, setRecentPayments] = useState<MemberPayment[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        navigate('/members/login')
        return
      }

      // Fetch profile
      const profileRes = await fetch('/api/members/profile', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile')
      }

      const profileData = await profileRes.json()
      setProfile(profileData.profile)

      // Fetch recent donations
      const donationsRes = await fetch('/api/members/donations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (donationsRes.ok) {
        const donationsData = await donationsRes.json()
        setRecentDonations(donationsData.donations.slice(0, 5))
      }

      // Fetch recent payments
      const paymentsRes = await fetch('/api/members/payments', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setRecentPayments(paymentsData.payments.slice(0, 5))
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load your profile'}</p>
          <button
            onClick={() => navigate('/members/login')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  const membershipStatus = profile.member.status
  const daysUntilRenewal = profile.statistics.daysUntilRenewal
  const isExpiringSoon = daysUntilRenewal <= 30

  return (
    <MemberPortalLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile.member.firstName}!
        </h1>
        <p className="text-gray-600">
          Member since {profile.statistics.memberSince} • {profile.member.memberNumber}
        </p>
      </div>

      {/* Membership Status Alert */}
      {isExpiringSoon && membershipStatus === 'active' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900 mb-1">Membership Renewal Due Soon</p>
            <p className="text-sm text-amber-800">
              Your membership expires in {daysUntilRenewal} days. Renew now to continue enjoying all
              member benefits.
            </p>
          </div>
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
            Renew Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Membership Status */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8" />
            <span className="text-sm opacity-90">Membership</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 capitalize">{membershipStatus}</h3>
          <p className="text-sm opacity-90">{profile.member.membershipType} plan</p>
        </div>

        {/* Total Donations */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-sm text-gray-600">Total Donations</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            €{profile.statistics.totalDonations}
          </h3>
          <p className="text-sm text-gray-600">{recentDonations.length} donations</p>
        </div>

        {/* Total Contributions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-sm text-gray-600">Total Contributions</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            €{profile.statistics.totalContributions}
          </h3>
          <p className="text-sm text-gray-600">Including membership</p>
        </div>

        {/* Next Renewal */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-500" />
            <span className="text-sm text-gray-600">Next Renewal</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{daysUntilRenewal} days</h3>
          <p className="text-sm text-gray-600">
            {new Date(profile.member.expiryDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Donations */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Donations</h2>
              <button
                onClick={() => navigate('/members/portal/donations')}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDonations.length > 0 ? (
              recentDonations.map((donation) => (
                <div key={donation.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        €{parseFloat(donation.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(donation.donation_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {donation.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No donations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Membership Payments</h2>
              <button
                onClick={() => navigate('/members/portal/receipts')}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        €{parseFloat(payment.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {payment.payment_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString()
                          : 'Pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                      {payment.receipt_url && (
                        <button className="text-gray-400 hover:text-gray-600">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No payments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/donation')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-100"
          >
            <Heart className="w-6 h-6 text-red-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Make a Donation</p>
              <p className="text-sm text-gray-600">Support our cause</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/members/portal/profile')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-100"
          >
            <CreditCard className="w-6 h-6 text-blue-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Update Profile</p>
              <p className="text-sm text-gray-600">Manage your details</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/members/portal/reports')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-100"
          >
            <TrendingUp className="w-6 h-6 text-green-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Financial Reports</p>
              <p className="text-sm text-gray-600">View Gurukul reports</p>
            </div>
          </button>
        </div>
      </div>
      </div>
    </MemberPortalLayout>
  )
}
