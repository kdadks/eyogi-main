/**
 * Payment Modal - Shows SumUp checkout link in a modal dialog
 * User clicks to open payment in a new tab, then returns to confirm
 */

import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { ExternalLink, CheckCircle, Loader2 } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  checkoutUrl: string
  registrationId: string
  amount: number
  currency: string
  onClose: () => void
  onPaymentComplete: () => void
}

export default function PaymentModal({
  isOpen,
  checkoutUrl,
  registrationId,
  amount,
  currency,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentWindowOpen, setPaymentWindowOpen] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const windowRef = useRef<Window | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for payment window closure (indicates payment completed or cancelled)
  useEffect(() => {
    if (!paymentWindowOpen || !windowRef.current) return

    console.log('🔔 Monitoring payment window...')

    pollIntervalRef.current = setInterval(() => {
      try {
        if (windowRef.current && windowRef.current.closed) {
          console.log('✅ Payment window closed - checking payment status')
          clearInterval(pollIntervalRef.current!)
          setPaymentWindowOpen(false)
          setPaymentCompleted(true)
          
          // Don't show success toast yet - backend will verify payment
          // Redirect after short delay to let user see confirmation
          setTimeout(() => {
            console.log('📍 Redirecting to confirmation to verify payment')
            onPaymentComplete()
          }, 1500)
        }
      } catch (err) {
        console.error('Error polling payment window:', err)
      }
    }, 1000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [paymentWindowOpen, onPaymentComplete])

  const handleOpenPayment = () => {
    console.log('🔗 Opening SumUp payment in new window:', checkoutUrl)

    // Open in new window/tab (user-initiated, won't be blocked)
    windowRef.current = window.open(checkoutUrl, 'SumUpPayment', 'width=800,height=700')

    if (!windowRef.current) {
      console.error('❌ Failed to open payment window')
      toast.error('Could not open payment window. Please check browser popup settings.')
      return
    }

    setPaymentWindowOpen(true)
    console.log('✅ Payment window opened')
  }

  const handleContinueManually = () => {
    console.log('📍 User manually continuing to confirmation')
    onPaymentComplete()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Complete Payment</h2>
          <p className="text-stone-600">
            Amount: <span className="font-semibold text-orange-600">{currency} {amount.toFixed(2)}</span>
          </p>
        </div>

        {!paymentCompleted ? (
          <>
            {!paymentWindowOpen ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-stone-700">
                    A secure payment window will open when you click the button below.
                  </p>
                  <ul className="text-sm text-stone-600 space-y-2">
                    <li>✓ Complete your payment securely</li>
                    <li>✓ The window will close automatically when done</li>
                    <li>✓ You'll be returned to confirmation</li>
                  </ul>
                </div>

                <button
                  onClick={handleOpenPayment}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={20} />
                  Complete Payment
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-stone-700 hover:text-stone-900 font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Loader2 className="animate-spin text-amber-600 flex-shrink-0 mt-1" size={20} />
                    <div className="text-sm">
                      <p className="font-semibold text-stone-900">Payment window is open</p>
                      <p className="text-stone-600 mt-1">
                        Complete your payment in the opened window. This page will update automatically when done.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinueManually}
                  className="w-full bg-stone-200 hover:bg-stone-300 text-stone-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  Payment Window Closed?
                </button>

                <p className="text-xs text-center text-stone-500">
                  If you've closed the payment window, click above. Otherwise, this page will update automatically.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <CheckCircle size={64} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600 mb-2">Verifying Payment...</p>
              <p className="text-stone-600 mb-4">Please wait while we verify your payment with SumUp</p>
            </div>
            <button
              disabled
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg opacity-75 cursor-not-allowed"
            >
              <Loader2 className="inline animate-spin mr-2" size={20} />
              Verifying...
            </button>
          </>
        )}
      </div>
    </div>
  )
}
