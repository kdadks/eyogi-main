/**
 * Payment Return Page
 * SumUp redirects here after successful payment
 * Auto-completes registration or shows button if needed
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Loader } from 'lucide-react'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'action-needed'>('loading')
  const [isProcessing, setIsProcessing] = useState(false)

  const registrationId = searchParams.get('registration_id')

  useEffect(() => {
    if (registrationId) {
      // Auto-redirect to confirmation page with registration_id
      setTimeout(() => {
        navigate(`/membership/confirmation?registration_id=${registrationId}`)
      }, 2000)
    } else {
      setStatus('action-needed')
    }
  }, [registrationId, navigate])

  const handleContinue = () => {
    if (registrationId) {
      navigate(`/membership/confirmation?registration_id=${registrationId}`)
    } else {
      navigate('/membership')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Redirecting to complete your registration...
            </p>
            <p className="text-sm text-gray-500">This page will redirect automatically in 2 seconds.</p>
            
            {registrationId && (
              <button
                onClick={handleContinue}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue Now
              </button>
            )}
          </>
        )}

        {status === 'action-needed' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
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
