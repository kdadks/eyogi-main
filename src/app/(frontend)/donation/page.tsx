import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import RichText from '@/components/RichText'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Donation',
}

async function DonationPage() {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.findGlobal({
      slug: 'donation',
      depth: 0,
    })

    if (result && result.content) {
      return (
        <div className="container p-4 lg:p-8 pt-16 lg:pt-0">
          <section className="bg-white p-6 lg:p-10 rounded-3xl shadow-xl space-y-8">
            <RichText data={result.content} enableGutter={false} />
          </section>
        </div>
      )
    }
  } catch (error) {
    console.error('Error fetching donation page from Payload, using fallback:', error)
  }

  // Graceful fallback ensuring production builds and requests always succeed
  return (
    <div className="container p-4 lg:p-8 pt-16 lg:pt-0">
      <section className="bg-white p-6 lg:p-10 rounded-3xl shadow-xl space-y-8 max-w-4xl mx-auto text-gray-800">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Donation Matters</h1>
        <p className="text-base sm:text-lg leading-relaxed">
          <em>eYogi Gurukul</em> is inspired by the legacy of Raja Krishnadevaraya, a patron of Sanatana Dharma, knowledge, and culture. Today, as a fully community-supported initiative, <em>eYogi Gurukul</em> continues this sacred mission by preserving and spreading India’s spiritual heritage through education, yoga, and cultural outreach.
        </p>
        <p className="text-base sm:text-lg leading-relaxed">
          By donating, you are not just offering financial help—you are becoming a modern custodian of Dharma, ensuring that future generations stay rooted in timeless wisdom. Your generosity supports a movement that uplifts minds, empowers youth, and keeps ancient traditions alive in a modern world.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold pt-4 text-gray-900">How Your Support Makes a Difference</h2>
        <p className="text-base sm:text-lg leading-relaxed">
          Every donation to <em>eYogi Gurukul</em> is handled with full transparency and directed exclusively toward:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base sm:text-lg">
          <li><strong>Course Delivery</strong> – Sharing the teachings of yoga, Indian philosophy, and spiritual science with learners globally</li>
          <li><strong>Operational Expenses</strong> – Covering day-to-day running costs without compromising our integrity</li>
          <li><strong>Future Expansion</strong> – Building a dedicated <em>eYogi Gurukul</em> Learning Centre for immersive, in-person experiences</li>
        </ul>
        <p className="text-base sm:text-lg leading-relaxed">
          Importantly, no member, director, or volunteer receives personal financial gain. We maintain audit-grade documentation, and annual reports are available upon request—ensuring complete accountability.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">Donation Information</h2>
          <p className="text-base leading-relaxed"><strong>Charity Name:</strong> eYogi Gurukul</p>
          <p className="text-base leading-relaxed"><strong>Registered Charity Number:</strong> 20205851</p>
          <p className="text-base leading-relaxed"><strong>Bank Name:</strong> AIB Ireland</p>
          <p className="text-base leading-relaxed"><strong>Account Name:</strong> eYogi Gurukul</p>
          <p className="text-base leading-relaxed"><strong>IBAN:</strong> IE92AIBK93123324399060</p>
          <p className="text-base leading-relaxed"><strong>BIC:</strong> AIBKIE2DXXX</p>
          <p className="text-base font-semibold pt-2 text-orange-800 italic">
            Be a giver of wisdom. A guardian of Dharma. Donate today.
          </p>
        </div>
      </section>
    </div>
  )
}

export default DonationPage
