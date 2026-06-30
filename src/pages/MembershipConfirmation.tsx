/**
 * Membership Confirmation Page
 * Displayed after successful SumUp payment
 * Completes the registration by creating member account
 */

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function MembershipConfirmation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing your registration...')
  const [memberData, setMemberData] = useState<any>(null)
  const hasCalledRef = useRef(false)

  useEffect(() => {
    // Prevent StrictMode from calling the effect twice
    if (hasCalledRef.current) return
    hasCalledRef.current = true
    
    completeRegistration()
  }, [])

  const completeRegistration = async () => {
    try {
      // Get registration data from sessionStorage (was stored before redirect to SumUp)
      let checkoutData = sessionStorage.getItem('membershipCheckout')
      const registrationIdFromUrl = searchParams.get('registration_id')
      
      // If sessionStorage is empty AND we have registration_id, fetch from backend
      if (!checkoutData && registrationIdFromUrl) {
        console.log('📋 [CONFIRMATION] SessionStorage empty, fetching from backend with registration_id:', registrationIdFromUrl)
        try {
          const response = await fetch(`/api/members/checkout-status/${registrationIdFromUrl}`)
          if (response.ok) {
            const data = await response.json()
            checkoutData = JSON.stringify(data.checkout)
            console.log('✅ [CONFIRMATION] Retrieved checkout data from backend')
          } else {
            console.warn('⚠️  [CONFIRMATION] Backend returned status:', response.status)
          }
        } catch (err) {
          console.warn('⚠️  [CONFIRMATION] Could not fetch from backend:', err)
        }
      }
      
      if (!checkoutData) {
        // Checkout data not found in session or backend
        // Show error message with action button
        setStatus('error')
        setMessage('We couldn\'t retrieve your registration details. This can happen if you close the payment page or return later. Please try the registration again by clicking below.')
        toast.error('Registration details not found')
        return
      }

      const checkout = JSON.parse(checkoutData)
      
      // Prefer the checkout ID captured before redirect; URL params can contain references.
      const checkoutIdFromStorage = checkout.checkout_id || checkout.checkoutId
      const checkoutIdFromUrl =
        searchParams.get('id') || searchParams.get('checkout_id') || searchParams.get('reference')

      let checkoutId = checkoutIdFromStorage || checkoutIdFromUrl
      if (checkoutIdFromUrl && /^c-/i.test(checkoutIdFromUrl)) {
        checkoutId = checkoutIdFromUrl
      }
      const isDevMode = searchParams.get('dev_mode') === 'true' || checkout.dev_mode === true
      
      if (!checkoutId) {
        setStatus('error')
        setMessage('Payment reference not found. Please try again.')
        toast.error('Payment reference missing')
        return
      }

      console.log('📋 [CONFIRMATION] Verifying payment:', checkoutId)

      const { registrationData, amount, membershipType } = checkout

      // Create abort controller to cancel request if component unmounts
      const abortController = new AbortController()

      try {
        // Call the payment verification endpoint which also completes registration
        const response = await fetch('/api/members/register-with-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkoutId: checkoutId,
            registrationData,
            amount,
            membershipType,
            isDevMode, // Include dev mode flag
          }),
          signal: abortController.signal,
        })

        const rawBody = await response.text()
        let data: any = {}
        try {
          data = rawBody ? JSON.parse(rawBody) : {}
        } catch {
          data = { error: rawBody || `HTTP ${response.status}` }
        }

        if (!response.ok) {
          const statusDetails = [
            data.checkoutStatus ? `Checkout: ${data.checkoutStatus}` : null,
            Array.isArray(data.transactionStatuses) && data.transactionStatuses.length > 0
              ? `Transactions: ${data.transactionStatuses
                  .map((t: any) => `${t.id || 'n/a'}=${t.status || 'unknown'}`)
                  .join(', ')}`
              : null,
            data.checkoutId ? `Checkout ID: ${data.checkoutId}` : null,
          ]
            .filter(Boolean)
            .join(' | ')

          const detailedMessage =
            statusDetails.length > 0
              ? `${data.error || 'Failed to complete registration'} (${statusDetails})`
              : data.error || 'Failed to complete registration'

          setStatus('error')
          setMessage(detailedMessage)
          toast.error(detailedMessage)
          console.error('Registration error:', data)
          return
        }

        // Success!
        setStatus('success')
        setMemberData(data.member)
        setMessage('Registration completed successfully!')
        toast.success('Welcome to eYogi!')

        // Clear sessionStorage
        sessionStorage.removeItem('membershipCheckout')

        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/members/login')
        }, 5000)
      } catch (error) {
        // Only show error if not aborted
        if (error instanceof Error && error.name !== 'AbortError') {
          throw error
        }
      }
    } catch (error) {
      console.error('Registration completion error:', error)
      setStatus('error')
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred while completing your registration'
      setMessage(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Registration</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && memberData && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to eYogi!</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Member Number:</strong> {memberData.memberNumber}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Name:</strong> {memberData.firstName} {memberData.lastName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {memberData.email}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  📧 Please check your email for instructions to create your password.
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Redirecting to login in 5 seconds...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/membership')}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
