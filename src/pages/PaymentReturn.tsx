/**
 * Payment Return Page
 * SumUp redirects here after successful payment
 * Auto-completes registration or shows button if needed
 */

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const hasRedirected = useRef(false)

  // Get registration_id from URL or lookup using checkout_id
  useEffect(() => {
    const urlRegistrationId = searchParams.get('registration_id')
    const checkoutId = searchParams.get('checkout_id') || searchParams.get('id')

    console.log('🔄 [PAYMENT-RETURN] URL params:', {
      urlRegistrationId,
      checkoutId,
      allParams: Object.fromEntries(searchParams.entries()),
    })

    // If we have registration_id in URL, use it directly (SumUp should preserve it)
    if (urlRegistrationId) {
      console.log('✅ [PAYMENT-RETURN] Found registration_id in URL, using directly')
      setRegistrationId(urlRegistrationId)
      return
    }

    // If we only have checkout_id, lookup registration_id from database
    if (checkoutId && !hasRedirected.current) {
      hasRedirected.current = true
      console.log('📡 [PAYMENT-RETURN] Looking up registration_id for checkout:', checkoutId)

      fetch(`/api/members/checkout-status/${checkoutId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('✅ [PAYMENT-RETURN] Got checkout data:', data)
          if (data.registration_id) {
            setRegistrationId(data.registration_id)
          } else if (data.checkout_id) {
            // Fallback: use checkout_id if registration_id not available
            console.warn('⚠️ [PAYMENT-RETURN] No registration_id in response, using checkout_id')
            setRegistrationId(data.checkout_id)
          }
        })
        .catch((err) => {
          console.error('❌ [PAYMENT-RETURN] Failed to lookup checkout:', err)
          // Still let user continue - they can provide info manually
          setRegistrationId(checkoutId)
        })
    } else {
      console.warn('⚠️ [PAYMENT-RETURN] No registration_id or checkout_id found in URL')
    }
  }, [searchParams])

  useEffect(() => {
    if (registrationId && !hasRedirected.current) {
      hasRedirected.current = true
      console.log('✅ [PAYMENT-RETURN] Auto-redirecting to confirmation in 2 seconds...')

      const redirectTimer = setTimeout(() => {
        console.log('🚀 [PAYMENT-RETURN] Navigating to confirmation page')
        navigate(`/membership/confirmation?registration_id=${registrationId}`, { replace: true })
      }, 2000)

      return () => clearTimeout(redirectTimer)
    }
  }, [registrationId, navigate])

  const handleContinue = () => {
    if (registrationId) {
      console.log('👆 [PAYMENT-RETURN] User clicked Continue button')
      setIsProcessing(true)
      navigate(`/membership/confirmation?registration_id=${registrationId}`, { replace: true })
    } else {
      console.log('👆 [PAYMENT-RETURN] User clicked Back to Membership')
      navigate('/membership')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-4">
          {!registrationId ? (
            <Loader className="w-16 h-16 text-yellow-600 animate-spin mx-auto" />
          ) : (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>

        {registrationId ? (
          <>
            <p className="text-gray-600 mb-6">
              Your payment has been received. Redirecting to complete your registration...
            </p>
            <p className="text-sm text-gray-500 mb-6">This page will automatically redirect in 2 seconds.</p>

            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isProcessing ? 'Processing...' : 'Continue Now'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Your payment has been processed. Click below to complete your membership registration.
            </p>

            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isProcessing ? 'Processing...' : 'Complete Registration'}
            </button>

            <button
              onClick={() => navigate('/membership')}
              className="mt-3 w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Membership
            </button>
          </>
        )}
      </div>
    </div>
  )
}
