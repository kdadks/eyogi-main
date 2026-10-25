import { getPayload } from 'payload'
import config from '@payload-config'
import RichText from '@/components/RichText'

export const dynamic = 'force-dynamic'

async function PrivacyPolicyPage() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.findGlobal({
      slug: 'privacy-policy',
      depth: 0,
    })

    if (result && result.title && result.content) {
      return (
        <div className="w-full flex justify-center pt-8 sm:pt-0 pb-4">
          <div className="bg-white container rounded-3xl p-6 sm:p-10 shadow-sm">
            <h1 className="text-4xl sm:text-6xl text-center pb-8 font-bold text-gray-900">{result.title}</h1>
            <RichText className="relative pb-8 prose max-w-none" data={result.content} enableGutter={false} />
          </div>
        </div>
      )
    }
  } catch (error) {
    console.error('Error fetching privacy policy from Payload, using fallback:', error)
  }

  // Graceful fallback UI ensuring builds and requests always succeed
  return (
    <div className="w-full flex justify-center pt-8 sm:pt-0 pb-4">
      <div className="bg-white container rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-6 text-gray-800">
        <h1 className="text-4xl sm:text-6xl text-center pb-8 font-bold text-gray-900">Privacy Policy</h1>
        
        <p className="text-base sm:text-lg leading-relaxed">
          At <strong>eYogi Gurukul</strong>, we are committed to safeguarding the privacy, confidentiality, and trust of all individuals associated with our organization, including volunteers, members, donors, and stakeholders. As a registered Irish charity (Charity Number: 20205851), we operate in full compliance with the regulations of the Charities Regulator of Ireland and all applicable national and international data protection laws.
        </p>

        <p className="text-base sm:text-lg leading-relaxed">
          All personal data collected is used strictly for organizational purposes—such as service facilitation, communication, and regulatory compliance—and is processed with the highest standards of responsibility and discretion. We do not share personal information with third parties without prior consent.
        </p>

        <p className="text-base sm:text-lg leading-relaxed">
          All individuals involved with eYogi Gurukul are expected to uphold confidentiality regarding internal communications, intellectual property, and sensitive materials. Volunteers must adhere to clearly defined guidelines concerning content use, media handling, and financial integrity.
        </p>

        <p className="text-base sm:text-lg leading-relaxed">
          We are dedicated to maintaining a culture of transparency, accountability, and respect, in alignment with our mission to preserve and promote Sanatana Dharma with integrity.
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold pt-6 text-gray-900">Safety and Child Safeguarding Policy</h2>

        <p className="text-base sm:text-lg leading-relaxed">
          At <strong>eYogi Gurukul</strong>, we place the highest priority on the safety, welfare, and protection of every child and young person entrusted to our care. As a registered charity in Ireland (Charity Number: 20205851), we are fully committed to complying with all national child safeguarding standards, including those outlined by Tusla under the Children First Act 2015.
        </p>

        <p className="text-base sm:text-lg leading-relaxed">
          Our safeguarding practices are comprehensive and include robust procedures for online safety, anti-bullying measures, supervision, Garda vetting, safe recruitment, and the appropriate handling of any child protection concerns. Every class is supervised by two trained adult volunteers—one male and one female—to uphold the highest standard of care and accountability.
        </p>

        <p className="text-base sm:text-lg leading-relaxed">
          Our volunteers and educators work with integrity to create a respectful, supportive, and secure environment where students can explore the principles of Sanatana Dharma with confidence. Safeguarding is a collective responsibility, and we are committed to ongoing training, review, and improvement of our policies to ensure every child can learn, grow, and thrive safely.
        </p>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
