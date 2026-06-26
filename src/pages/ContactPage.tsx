export default function ContactPage() {
  return (
    <div className="py-24 px-6 md:px-12 lg:px-20 max-w-3xl mx-auto">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4">
        Contact
      </p>
      <h1
        className="font-cormorant font-light text-stone-900 leading-tight mb-8"
        style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
      >
        Get in Touch
      </h1>
      <p className="text-stone-500 mb-4">
        Email us at{' '}
        <a href="mailto:office@eyogigurukul.com" className="text-amber-600 hover:underline">
          office@eyogigurukul.com
        </a>
      </p>
    </div>
  )
}
