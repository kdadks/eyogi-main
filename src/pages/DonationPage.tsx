import { useState } from 'react'
import { Heart, CreditCard, Building2, HandHeart } from 'lucide-react'
import DonationModal from '@/components/DonationModal/DonationModal'

export default function DonationPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600 mb-4">
            Support Us
          </p>
          <h1
            className="font-sans font-semibold text-stone-900 leading-tight mb-6"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          >
            Support Our Mission
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            eYogi Gurukul is a registered Irish charity (No. 20208551). Your donation helps us
            preserve and propagate Vedic wisdom for future generations.
          </p>
        </div>

        {/* Donation Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Online Donation Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl transform group-hover:scale-105 transition-transform duration-200"></div>
            <div className="relative bg-white rounded-2xl border-2 border-orange-200 p-8 h-full flex flex-col">
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <CreditCard className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-sans text-xl font-semibold text-stone-900 mb-3">
                Donate Online
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-6 flex-1">
                Make a secure online donation via credit/debit card. Quick, easy, and instant
                receipt.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold uppercase tracking-wide text-sm transition-all shadow-lg hover:shadow-xl"
              >
                <Heart className="w-5 h-5" />
                Donate Now
              </button>
            </div>
          </div>

          {/* Bank Transfer Card */}
          <div className="bg-stone-50 rounded-2xl border-2 border-stone-200 p-8 flex flex-col">
            <div className="w-14 h-14 rounded-xl bg-stone-200 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-stone-600" />
            </div>
            <h3 className="font-sans text-xl font-semibold text-stone-900 mb-3">Bank Transfer</h3>
            <p className="text-stone-600 text-sm leading-relaxed mb-6">
              Prefer direct bank transfer? Use our account details below:
            </p>
            <dl className="space-y-3 text-sm flex-1">
              <div className="flex justify-between items-start">
                <dt className="font-semibold text-stone-700 w-24">IBAN:</dt>
                <dd className="font-mono text-stone-600 text-right">IE92AIBK93123324399060</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="font-semibold text-stone-700 w-24">BIC:</dt>
                <dd className="font-mono text-stone-600 text-right">AIBKIE2DXXX</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="font-semibold text-stone-700 w-24">Account:</dt>
                <dd className="text-stone-600 text-right">eYogi Gurukul</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="font-semibold text-stone-700 w-24">Bank:</dt>
                <dd className="text-stone-600 text-right">AIB Ireland</dd>
              </div>
              <div className="flex justify-between items-start">
                <dt className="font-semibold text-stone-700 w-24">Charity No.:</dt>
                <dd className="text-stone-600 text-right">20208551</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-10 text-white">
          <div className="flex items-center gap-3 mb-6">
            <HandHeart className="w-8 h-8 text-orange-400" />
            <h2 className="font-sans text-2xl font-semibold">Your Impact</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-orange-400 mb-2">€25</div>
              <p className="text-stone-300 text-sm">
                Provides course materials for one student
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400 mb-2">€100</div>
              <p className="text-stone-300 text-sm">Sponsors a scholarship for a deserving student</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400 mb-2">€250</div>
              <p className="text-stone-300 text-sm">
                Funds a complete course development
              </p>
            </div>
          </div>
        </div>

        {/* Tax Deductible Notice */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-900">
            <strong>Tax Deductible:</strong> As a registered Irish charity, all donations are
            tax-deductible. You will receive a receipt for your records.
          </p>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
