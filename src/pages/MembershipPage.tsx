import { BookOpen, Users, Award, Zap, ArrowRight } from 'lucide-react'
import { useMembershipModal } from '@/contexts/MembershipModalContext'

const membershipBenefits = [
  {
    icon: BookOpen,
    title: 'Premium Course Access',
    description: 'Access to all premium courses and exclusive content',
  },
  {
    icon: Users,
    title: 'Expert Guidance',
    description: 'One-on-one mentoring from experienced teachers',
  },
  {
    icon: Award,
    title: 'Certification',
    description: 'Earn recognized certificates upon course completion',
  },
  {
    icon: Zap,
    title: 'Community Support',
    description: 'Join our exclusive community of learners',
  },
]

export default function MembershipPage() {
  const { openModal } = useMembershipModal()
  return (
    <div>
      {/* Hero Section */}
      <section 
        className="py-32 px-6 md:px-12 lg:px-20 sunrise-hero -mt-20"
        style={{ animation: 'sunriseGradient 12s ease-in-out infinite', paddingTop: '120px' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-4">
            Premium Benefits
          </p>
          <h1
            className="font-sans font-semibold text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          >
            Join eYogi Membership
          </h1>
          <p className="text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Become part of the eYogi community and get access to exclusive content, resources, and teachings.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-900/40 transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Membership Benefits Section */}
      <section className="py-24 px-6 md:px-12 lg:px-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="font-sans font-semibold text-stone-900 leading-tight mb-4"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              Membership Benefits
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Get access to everything you need for your learning journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {membershipBenefits.map((benefit) => (
              <div key={benefit.title} className="p-6 rounded-lg border border-stone-200 hover:border-orange-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-stone-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 md:px-12 lg:px-20 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 rounded-lg bg-orange-50 border border-orange-200">
              <h3 className="font-semibold text-stone-900 mb-2">Instant Confirmation</h3>
              <p className="text-sm text-stone-600">
                Get your unique member ID immediately upon successful payment
              </p>
            </div>
            <div className="p-6 rounded-lg bg-orange-50 border border-orange-200">
              <h3 className="font-semibold text-stone-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-stone-600">
                Your payment is processed securely through SumUp
              </p>
            </div>
            <div className="p-6 rounded-lg bg-orange-50 border border-orange-200">
              <h3 className="font-semibold text-stone-900 mb-2">Email Receipt</h3>
              <p className="text-sm text-stone-600">
                Receive a detailed receipt and confirmation email
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-stone-600 mb-6">Ready to start your journey?</p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-200 transition-all duration-300"
            >
              Join Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

