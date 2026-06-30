/**
 * Membership Registration Form - Vite + React Router Version
 */

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Zap, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { calculateSavings, formatCurrency, SUBSCRIPTION_PRICES } from '@/lib/memberships/membershipUtils'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface MembershipRegistrationFormProps {
  onSuccess?: () => void
}

export default function MembershipRegistrationForm({ onSuccess }: MembershipRegistrationFormProps = {}) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly')
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const savings = calculateSavings()
  const annualSavingsPercent = savings.savingsPercent

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Call checkout API to create payment session first
      const response = await fetch('/api/members/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          addressLine1: formData.addressLine1.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postalCode: formData.postalCode.trim() || null,
          country: formData.country.trim() || 'Ireland',
          membershipType: selectedPlan,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await response.json()
        : { error: `HTTP ${response.status}` }

      if (!response.ok) {
        toast.error(data.error || 'Failed to create checkout session')
        setLoading(false)
        return
      }

      // Validate that we have a checkout URL
      if (!data.checkout_url) {
        console.error('❌ No checkout URL in response:', data)
        toast.error('Payment gateway error. Please try again.')
        setLoading(false)
        return
      }

      // Store registration data for completion after payment
      sessionStorage.setItem(
        'membershipCheckout',
        JSON.stringify({
          registrationId: data.registration_id,
          registrationData: data.registration_data,
          checkoutId: data.checkout_id,
          amount: data.amount,
          currency: data.currency,
          membershipType: data.membershipType,
          dev_mode: data.dev_mode || false,
        })
      )

      // Show success toast
      toast.success('Opening payment...')

      // Call onSuccess callback if provided (e.g., to close modal)
      if (onSuccess) {
        onSuccess()
      }

      // Try to open SumUp checkout in a popup window
      console.log('🔗 Opening checkout (attempting popup):', data.checkout_url)
      const paymentWindow = window.open(
        data.checkout_url,
        'SumUpCheckout',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      )

      // If popup is blocked, fall back to redirect
      if (!paymentWindow) {
        console.warn('⚠️ Popup blocked - falling back to redirect')
        setTimeout(() => {
          window.location.href = data.checkout_url
        }, 500)
        return
      }

      // Popup opened successfully - poll to detect when payment is complete
      console.log('✅ Popup opened successfully - listening for completion')
      const pollInterval = setInterval(() => {
        try {
          // Check if popup is closed
          if (paymentWindow.closed) {
            console.log('✅ Payment popup closed - redirecting to confirmation')
            clearInterval(pollInterval)
            setLoading(false)

            // Redirect to membership confirmation with registration_id from sessionStorage
            const checkoutData = sessionStorage.getItem('membershipCheckout')
            if (checkoutData) {
              const { registrationId } = JSON.parse(checkoutData)
              console.log('📍 Redirecting to confirmation with registration_id:', registrationId)
              window.location.href = `/membership/confirmation?registration_id=${registrationId}`
            } else {
              console.warn('⚠️ No checkout data in sessionStorage')
              window.location.href = '/membership/confirmation'
            }
            return
          }

          // Try to detect if popup navigated to return_url (payment-return or any non-SumUp URL)
          try {
            const popupUrl = paymentWindow.location.href
            console.log('Popup URL:', popupUrl)

            // If popup is trying to navigate to our site (not blocked by CORS), payment is done
            if (popupUrl && !popupUrl.includes('sumup') && !popupUrl.includes('about:blank')) {
              console.log('✅ Payment popup redirected - payment likely complete')
              paymentWindow.close()
              clearInterval(pollInterval)
              setLoading(false)

              // Redirect to confirmation
              const checkoutData = sessionStorage.getItem('membershipCheckout')
              if (checkoutData) {
                const { registrationId } = JSON.parse(checkoutData)
                console.log('📍 Redirecting to confirmation with registration_id:', registrationId)
                window.location.href = `/membership/confirmation?registration_id=${registrationId}`
              } else {
                window.location.href = '/membership/confirmation'
              }
              return
            }
          } catch (e) {
            // Cross-origin error is expected - popup is on SumUp domain
            // This is fine, we'll just wait for the window to close
          }
        } catch (err) {
          console.error('Error in popup poll:', err)
        }
      }, 1000)

      // Fallback: if popup doesn't close within 15 minutes, stop polling
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 15 * 60 * 1000)
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error('Failed to process checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Plan Selection */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Select Your Plan</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Monthly Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={`relative p-6 rounded-lg border-2 transition-all text-left ${
              selectedPlan === 'monthly'
                ? 'border-orange-600 bg-orange-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-stone-900">Monthly</h4>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(SUBSCRIPTION_PRICES.monthly.amount)}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'monthly' ? 'border-orange-600 bg-orange-600' : 'border-stone-300'
                }`}
              >
                {selectedPlan === 'monthly' && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </div>
            <p className="text-sm text-stone-600">per month</p>
          </button>

          {/* Annual Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan('annual')}
            className={`relative p-6 rounded-lg border-2 transition-all text-left ${
              selectedPlan === 'annual'
                ? 'border-orange-600 bg-orange-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Save {annualSavingsPercent}%
            </div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-stone-900">Annual</h4>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(SUBSCRIPTION_PRICES.annual.amount)}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'annual' ? 'border-orange-600 bg-orange-600' : 'border-stone-300'
                }`}
              >
                {selectedPlan === 'annual' && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </div>
            <p className="text-sm text-stone-600">per year</p>
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name *"
            value={formData.firstName}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name *"
            value={formData.lastName}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50 md:col-span-2"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (Optional)"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
          />
          <input
            type="text"
            name="country"
            placeholder="Country (Optional)"
            value={formData.country}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
          />
        </div>
      </div>

      {/* Address Information */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Address (Optional)</h3>
        <div className="grid gap-4">
          <input
            type="text"
            name="addressLine1"
            placeholder="Street Address"
            value={formData.addressLine1}
            onChange={handleInputChange}
            disabled={loading}
            className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
          />
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              disabled={loading}
              className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
            />
            <input
              type="text"
              name="state"
              placeholder="State/Province"
              value={formData.state}
              onChange={handleInputChange}
              disabled={loading}
              className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
            />
            <input
              type="text"
              name="postalCode"
              placeholder="Postal Code"
              value={formData.postalCode}
              onChange={handleInputChange}
              disabled={loading}
              className="px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-stone-50"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={agreeToTerms}
          onChange={(e) => {
            setAgreeToTerms(e.target.checked)
            setError('')
          }}
          disabled={loading}
          className="mt-1 w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
        />
        <label htmlFor="terms" className="text-sm text-stone-600">
          I agree to the{' '}
          <a href="/terms" className="text-orange-600 hover:underline">
            terms and conditions
          </a>
          {' '}and the{' '}
          <a href="/privacy" className="text-orange-600 hover:underline">
            privacy policy
          </a>
          . *
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Proceed to Payment
          </>
        )}
      </button>

      <p className="text-xs text-stone-500 text-center">
        Your payment will be processed securely by SumUp. No payment information is stored on our servers.
      </p>
    </form>
  )
}
