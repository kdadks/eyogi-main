import { useState, useEffect } from 'react'
import { X, Heart, CreditCard, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { browserClient } from '@/lib/supabase/browser'
import { useDonationModal } from '@/contexts/DonationModalContext'

interface PaymentSettings {
  sumup_api_key?: string
  sumup_merchant_code?: string
  sumup_enabled?: boolean
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500]

export default function DonationModal() {
  const { isOpen, closeModal } = useDonationModal()
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({})
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings()
    }
  }, [isOpen])

  const handleCloseModal = () => {
    // Reset form when closing
    setAmount(50)
    setCustomAmount('')
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setError('')
    closeModal()
  }

  const fetchPaymentSettings = async () => {
    try {
      const { data } = await browserClient
        .from('settings')
        .select('key, value')
        .in('key', ['sumup_api_key', 'sumup_merchant_code', 'sumup_enabled'])
        .eq('category', 'payment')

      if (data) {
        const settings: PaymentSettings = {}
        data.forEach((item) => {
          settings[item.key as keyof PaymentSettings] = item.value
        })
        setPaymentSettings(settings)
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err)
    }
  }

  const handleAmountSelect = (value: number) => {
    setAmount(value)
    setCustomAmount('')
    setError('')
  }

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseFloat(value)
    setCustomAmount(value)
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!lastName.trim()) {
      setError('Last name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    // Phone validation (basic international format)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid phone number')
      return
    }

    if (!amount || amount < 5) {
      setError('Minimum donation amount is €5')
      return
    }

    setLoading(true)

    try {
      // Check if SumUp is enabled
      if (!paymentSettings.sumup_enabled) {
        setError('Online payments are temporarily unavailable. Please use bank transfer.')
        setLoading(false)
        return
      }

      // Create donation record
      const { data: donation, error: donationError } = await browserClient
        .from('donations')
        .insert({
          amount,
          donor_first_name: firstName.trim(),
          donor_last_name: lastName.trim(),
          donor_email: email.trim(),
          donor_phone: phone.trim(),
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (donationError) throw donationError

      // Initialize SumUp payment
      await initiateSumUpPayment(donation.id, amount, email)
    } catch (err: any) {
      console.error('Donation error:', err)
      setError(err.message || 'Failed to process donation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const initiateSumUpPayment = async (donationId: string, amount: number, email: string) => {
    try {
      // Call your backend API to create SumUp checkout
      const response = await fetch('/api/payments/sumup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'EUR',
          checkout_reference: donationId,
          description: 'Donation to eYogi Gurukul',
          merchant_code: paymentSettings.sumup_merchant_code,
          return_url: `${window.location.origin}/donation/success`,
          email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const { checkout_url } = await response.json()

      // Redirect to SumUp checkout
      window.location.href = checkout_url
    } catch (err) {
      throw new Error('Failed to initialize payment gateway')
    }
  }

  const finalAmount = customAmount ? parseFloat(customAmount) : amount

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold text-stone-900">
            <Heart className="w-6 h-6 text-orange-600" />
            Support Our Mission
          </DialogTitle>
          <DialogDescription className="text-stone-600">
            Your donation helps preserve and propagate Vedic wisdom for future generations. eYogi
            Gurukul is a registered Irish charity (No. 20208551).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Preset amounts */}
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-3">
              Choose Amount (EUR)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAmountSelect(preset)}
                  className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                    amount === preset && !customAmount
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-stone-200 hover:border-orange-300 text-stone-700'
                  }`}
                >
                  €{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label htmlFor="custom-amount" className="block text-sm font-semibold text-stone-900 mb-2">
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">
                €
              </span>
              <input
                id="custom-amount"
                type="number"
                min="5"
                step="0.01"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="50.00"
                className="w-full pl-8 pr-4 py-3 border-2 border-stone-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-stone-500 mt-1">Minimum donation: €5</p>
          </div>

          {/* Donor details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-stone-900 mb-2">
                First Name <span className="text-orange-600">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-stone-900 mb-2">
                Last Name <span className="text-orange-600">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-stone-900 mb-2">
                Email <span className="text-orange-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-stone-900 mb-2">
                Phone Number <span className="text-orange-600">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+353 1 234 5678"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Summary & Submit */}
          <div className="border-t-2 border-stone-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-600 font-medium">Total Donation:</span>
              <span className="text-3xl font-bold text-orange-600">
                €{finalAmount.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !finalAmount || finalAmount < 5}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              <CreditCard className="w-5 h-5" />
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>

            <p className="text-xs text-stone-500 text-center mt-4">
              Secure payment powered by SumUp • All donations are tax-deductible
            </p>
          </div>
        </form>

        {/* Alternative payment method */}
        <div className="mt-6 pt-6 border-t-2 border-stone-200">
          <p className="text-sm font-semibold text-stone-900 mb-3">Or donate via bank transfer:</p>
          <div className="bg-stone-50 rounded-lg p-4 text-sm space-y-1 text-stone-600">
            <div className="flex justify-between">
              <span className="font-medium">IBAN:</span>
              <span className="font-mono">IE92AIBK93123324399060</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">BIC:</span>
              <span className="font-mono">AIBKIE2DXXX</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Account:</span>
              <span>eYogi Gurukul</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
