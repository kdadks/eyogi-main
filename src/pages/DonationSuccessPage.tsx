import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { browserClient } from '@/lib/supabase/browser'

export default function DonationSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [donation, setDonation] = useState<any>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processDonation = async () => {
      try {
        // Get checkout reference or donation_id from URL params
        let checkoutId = searchParams.get('checkout_id')
        const donationId = searchParams.get('donation_id')
        const paymentStatus = searchParams.get('status')

        // If no checkout_id, use donation_id as the cache key
        if (!checkoutId && donationId) {
          checkoutId = donationId
        }

        if (!checkoutId) {
          setStatus('error')
          setMessage('No checkout reference found')
          return
        }

        console.log(`🔍 Processing donation with checkout_id: ${checkoutId}`)

        // If dev mode, skip database lookup and show success
        const devMode = searchParams.get('dev_mode') === 'true'
        if (devMode) {
          console.log('✅ Dev mode - skipping payment verification')
          setStatus('success')
          setMessage('Thank you for your donation! (Dev Mode)')
          setDonation({
            id: checkoutId,
            amount: 50,
            donor_first_name: 'Test',
            donor_last_name: 'Donor',
            donor_email: 'test@example.com',
            created_at: new Date().toISOString(),
          })
          return
        }

        // Try to find the payment by checkout_id
        let payment = null
        let paymentError = null

        try {
          const response = await browserClient
            .from('payments')
            .select('*')
            .eq('checkout_id', checkoutId)
            .single()

          payment = response.data
          paymentError = response.error
        } catch (err) {
          paymentError = err
        }

        // If payment not found in database, try to get from backend cache
        if (!payment && paymentError) {
          console.log('Payment not in database, checking server cache...')
          try {
            const cacheResponse = await fetch(
              `/api/donations/checkout-status/${checkoutId}`
            )
            if (cacheResponse.ok) {
              const cacheData = await cacheResponse.json()
              if (cacheData.success && cacheData.checkout) {
                console.log('✅ Found donation in server cache')
                
                // Save donation to database
                try {
                  const saveResponse = await fetch(
                    '/api/donations/save',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        donation_id: checkoutId,
                        amount: cacheData.checkout.amount,
                        firstName: cacheData.checkout.firstName,
                        lastName: cacheData.checkout.lastName,
                        email: cacheData.checkout.email,
                        phone: cacheData.checkout.phone,
                        status: 'completed',
                        payment_method: 'SumUp',
                      }),
                    }
                  )
                  if (saveResponse.ok) {
                    console.log('✅ Donation saved to database')
                  }
                } catch (err) {
                  console.warn('Could not save donation to database:', err)
                }
                
                setStatus('success')
                setMessage('Thank you for your generous donation!')
                // Format cached data to match donation object structure
                setDonation({
                  id: checkoutId,
                  amount: cacheData.checkout.amount,
                  donor_first_name: cacheData.checkout.firstName,
                  donor_last_name: cacheData.checkout.lastName,
                  donor_email: cacheData.checkout.email,
                  created_at: cacheData.checkout.createdAt || new Date().toISOString(),
                })
                return
              }
            }
          } catch (err) {
            console.warn('Could not fetch from cache:', err)
          }

          console.error('Payment not found:', paymentError)
          setStatus('error')
          setMessage('Payment record not found')
          return
        }

        // Update payment status based on SumUp response
        const newPaymentStatus = paymentStatus === 'completed' ? 'completed' : 'failed'

        const { error: updateError } = await browserClient
          .from('payments')
          .update({
            status: newPaymentStatus,
          })
          .eq('id', payment.id)

        if (updateError) {
          console.error('Error updating payment:', updateError)
          setStatus('error')
          setMessage('Failed to update payment status')
          return
        }

        // Fetch the donation details
        const { data: donationData, error: donationError } = await browserClient
          .from('donations')
          .select('*')
          .eq('id', payment.donation_id)
          .single()

        if (donationError) {
          console.error('Donation not found:', donationError)
          setStatus('error')
          setMessage('Donation record not found')
          return
        }

        setDonation(donationData)

        if (newPaymentStatus === 'completed') {
          setStatus('success')
          setMessage('Thank you for your generous donation!')
        } else {
          setStatus('error')
          setMessage('Your donation could not be processed. Please try again or use bank transfer.')
        }
      } catch (err) {
        console.error('Error processing donation:', err)
        setStatus('error')
        setMessage('An error occurred while processing your donation')
      }
    }

    processDonation()
  }, [searchParams])

  return (
    <div className="py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-2xl mx-auto">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-6">
            <Loader className="w-16 h-16 text-orange-600 animate-spin" />
            <p className="text-lg text-stone-600">Processing your donation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-stone-900 mb-2">Thank You!</h1>
              <p className="text-lg text-stone-600 mb-4">{message}</p>
              {donation && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-left">
                  <h2 className="font-semibold text-stone-900 mb-4">Donation Details</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-stone-600">Amount:</dt>
                      <dd className="font-semibold text-stone-900">€{donation.amount.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-600">Donor:</dt>
                      <dd className="font-semibold text-stone-900">
                        {donation.donor_first_name} {donation.donor_last_name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-600">Reference:</dt>
                      <dd className="font-mono text-stone-600 text-xs break-all">{donation.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-600">Date:</dt>
                      <dd className="font-semibold text-stone-900">
                        {new Date(donation.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-xs text-stone-500 mt-4">
                    A receipt has been sent to {donation.donor_email}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-8 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-all"
            >
              Return to Home
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <AlertCircle className="w-20 h-20 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-stone-900 mb-2">Payment Issue</h1>
              <p className="text-lg text-stone-600 mb-6">{message}</p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-stone-900 mb-2">Alternative Payment Methods:</h3>
                <ul className="space-y-2 text-sm text-stone-700">
                  <li>• Direct bank transfer (details available on donation page)</li>
                  <li>• Try the online donation again</li>
                  <li>• Contact us for payment assistance</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => navigate('/donation')}
              className="mt-8 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-all"
            >
              Return to Donation Page
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
