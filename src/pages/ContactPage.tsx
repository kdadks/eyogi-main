import { usePageContent } from '@/hooks/usePageContent'

export default function ContactPage() {
  const { content } = usePageContent('contact')

  const eyebrow = content?.eyebrow ?? 'Contact'
  const heading = content?.heading ?? 'Get in Touch'
  const email = content?.email ?? 'office@eyogigurukul.com'

  return (
    <div className="py-24 px-6 md:px-12 lg:px-20 max-w-3xl mx-auto">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4">
        {eyebrow}
      </p>
      <h1
        className="font-cormorant font-light text-stone-900 leading-tight mb-8"
        style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
      >
        {heading}
      </h1>
      <p className="text-stone-500 mb-4">
        Email us at{' '}
        <a href={`mailto:${email}`} className="text-amber-600 hover:underline">
          {email}
        </a>
      </p>
    </div>
  )
}
