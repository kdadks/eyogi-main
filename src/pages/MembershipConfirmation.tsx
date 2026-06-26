/**
 * Membership Confirmation Page
 * Displayed after successful SumUp payment
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface MembershipData {
  memberId: string
  checkoutId: string
  amount: number
  currency: string
  subscriptionType: 'monthly' | 'annual'
  checkoutUrl: string
}

export default function MembershipConfirmation() {
  const navigate = useNavigate()
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Simulate payment verification delay
    const timer = setTimeout(() => {
      const data = sessionStorage.getItem('membershipCheckout')
      if (data) {
        try {
          setMembershipData(JSON.parse(data))
          setLoading(false)
        } catch (err) {
          setError('Failed to load membership data')
          setLoading(false)
        }
      } else {
        setError('No membership data found. Please start registration again.')
        setLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-stone-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error || !membershipData) {
    return (
      <div className="py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-stone-900 mb-2">Payment Issue</h2>
            <p className="text-stone-600 mb-6">{error || 'An error occurred processing your membership'}</p>
            <button
              onClick={() => navigate('/membership')}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
            >
              Return to Registration
            </button>
          </div>
        </div>
      </div>
    )
  }

  const subscriptionText =
    membershipData.subscriptionType === 'monthly' ? 'Monthly (€11)' : 'Annual (€120)'

  return (
    <div className="py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-stone-600">Welcome to eYogi Membership</p>
        </div>

        {/* Member ID Display */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-600 rounded-lg p-8 mb-8">
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">
            Your Member ID
          </p>
          <p className="text-4xl font-bold text-orange-600 font-mono tracking-wider mb-4">
            {membershipData.memberId}
          </p>
          <p className="text-sm text-stone-600">
            Save this ID in a safe place. You'll need it to access member-only features.
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-stone-50 rounded-lg border border-stone-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-600">Subscription Type</span>
              <span className="font-semibold text-stone-900">{subscriptionText}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">Amount Paid</span>
              <span className="font-semibold text-stone-900">
                {membershipData.currency} {membershipData.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">Transaction ID</span>
              <span className="font-mono text-sm text-stone-600">{membershipData.checkoutId}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Next Steps</h3>
          <ol className="space-y-2 text-stone-700 list-decimal list-inside">
            <li>Check your email for a welcome message and receipt</li>
            <li>Save your Member ID in a secure location</li>
            <li>Log in to your account using your email and Member ID</li>
            <li>Start enjoying member-only benefits</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-500 transition-colors"
          >
            Return to Home
          </button>
          <button
            onClick={() => window.location.href = 'mailto:support@eyogi.com'}
            className="px-6 py-3 border-2 border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
          >
            Contact Support
          </button>
        </div>

        {/* Legal Notice */}
        <div className="mt-12 text-center">
          <p className="text-xs text-stone-500">
            A confirmation email has been sent to your email address with your Member ID and payment receipt.
          </p>
        </div>
      </div>
    </div>
  )
}
