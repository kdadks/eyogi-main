import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What is eYogi Gurukul?',
    answer: 'eYogi Gurukul is an integrated educational platform that harmonizes ancient wisdom with modern education, offering courses in yoga, spirituality, and traditional Hindu knowledge.',
  },
  {
    question: 'How do I enroll in courses?',
    answer: 'You can enroll in courses directly through our website by creating an account and selecting the courses you wish to take. Some courses are free, while others require membership.',
  },
  {
    question: 'What is a Gurukul?',
    answer: 'A Gurukul is an ancient Indian residential educational institution where students learn directly from a master (Guru). We recreate this traditional learning model in a modern online environment.',
  },
  {
    question: 'Are the courses accredited?',
    answer: 'Our courses are designed to provide valuable knowledge and skills. Upon completion, you receive a certificate of completion recognized by our community.',
  },
  {
    question: 'What are the membership benefits?',
    answer: 'Membership provides access to premium courses, one-on-one mentoring, exclusive webinars, priority support, and certificates of completion.',
  },
  {
    question: 'Can I cancel my membership anytime?',
    answer: 'Yes, you can cancel your membership at any time. If you cancel, you will retain access to your courses until the end of the current billing period.',
  },
]

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="py-32 px-6 md:px-12 lg:px-20 sunrise-hero -mt-20"
        style={{ animation: 'sunriseGradient 12s ease-in-out infinite', paddingTop: '120px' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-4">
            Have Questions?
          </p>
          <h1
            className="font-sans font-semibold text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          >
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about eYogi Gurukul, our courses, and membership.
          </p>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 px-6 md:px-12 lg:px-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-stone-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-center justify-between gap-4 p-6">
                  <h3 className="text-lg font-semibold text-stone-900 flex-1 text-left">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-orange-600 flex-shrink-0 transition-transform duration-200 ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {expandedIndex === index && (
                  <div className="px-6 pb-6 border-t border-stone-200 bg-stone-50">
                    <p className="text-stone-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 lg:px-20 bg-stone-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-sans font-semibold text-stone-900 leading-tight mb-4"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}
          >
            Didn't Find Your Answer?
          </h2>
          <p className="text-lg text-stone-600 mb-8">
            We're here to help! Contact our support team and we'll respond as soon as possible.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  )
}
