import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Globe, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { EditingProvider, useEditing } from '@/contexts/EditingContext'
import EditableSection from '@/components/admin/EditableSection/EditableSection'
import { usePageContentAdmin } from '@/hooks/usePageContent'

// Drawers
import HomeHeroDrawer from '@/components/admin/SectionDrawer/drawers/HomeHeroDrawer'
import HomeMissionDrawer from '@/components/admin/SectionDrawer/drawers/HomeMissionDrawer'
import HomeStoryDrawer from '@/components/admin/SectionDrawer/drawers/HomeStoryDrawer'
import FAQDrawer from '@/components/admin/SectionDrawer/drawers/FAQDrawer'
import AboutDrawer from '@/components/admin/SectionDrawer/drawers/AboutDrawer'
import MembershipDrawer from '@/components/admin/SectionDrawer/drawers/MembershipDrawer'
import ContactDrawer from '@/components/admin/SectionDrawer/drawers/ContactDrawer'
import DonationDrawer from '@/components/admin/SectionDrawer/drawers/DonationDrawer'

// ─── Page previews ─────────────────────────────────────────────────────────────
// Each preview renders the page sections using the same Tailwind classes as the
// public pages, but is wrapped in EditableSection to enable inline editing.

function HomePreview({ content, onSave }: { content: any; onSave: (k: string, d: any) => Promise<boolean>; }) {
  const { activeSection, closeDrawer } = useEditing()
  const save = async (key: string, data: any) => {
    const ok = await onSave(key, data)
    if (ok) { toast.success('Saved'); closeDrawer() }
    else toast.error('Save failed')
    return ok
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <EditableSection sectionKey="hero" label="Hero">
        <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-32 px-6 md:px-12 lg:px-20 min-h-[420px] flex flex-col justify-center">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-3">eYogi Gurukul</p>
          <h1 className="font-sans font-semibold text-white leading-tight mb-3" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            {content?.hero?.headline ?? 'Ancient Wisdom,'}<br />
            <span className="text-orange-400">{content?.hero?.subheadline ?? 'Modern Minds.'}</span>
          </h1>
          <p className="text-stone-300 max-w-xl text-lg mb-6">{content?.hero?.subtext ?? ''}</p>
          <div className="flex gap-4 flex-wrap">
            <span className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-semibold text-sm">{content?.hero?.ctaPrimary?.label ?? 'Learn More'}</span>
            <span className="px-6 py-2.5 border-2 border-white/30 text-white rounded-lg font-semibold text-sm">{content?.hero?.ctaSecondary?.label ?? 'Donate'}</span>
          </div>
          <div className="flex gap-8 mt-8 flex-wrap">
            {(content?.hero?.stats ?? []).map((s: any) => (
              <div key={s.label}><strong className="text-white font-semibold">{s.value}</strong> <span className="text-stone-400 text-xs uppercase tracking-wider">{s.label}</span></div>
            ))}
          </div>
        </div>
      </EditableSection>

      {/* Mission */}
      <EditableSection sectionKey="mission" label="Mission">
        <div className="bg-white py-16 px-6 md:px-12 lg:px-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600 mb-3">{content?.mission?.eyebrow ?? 'Our Purpose'}</p>
          <h2 className="font-sans font-semibold text-stone-900 mb-10" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)' }}>
            {content?.mission?.heading ?? 'Education rooted in tradition, built for today.'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(content?.mission?.cards ?? []).map((card: any, i: number) => (
              <div key={i} className="p-6 border-2 border-stone-200 rounded-xl">
                <h3 className="font-semibold text-stone-900 mb-2">{card.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{card.body}</p>
                <span className="text-orange-600 text-xs font-semibold uppercase tracking-wide mt-3 block">{card.cta} →</span>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      {/* Story */}
      <EditableSection sectionKey="story" label="Story">
        <div className="bg-stone-50 py-16 px-6 md:px-12 lg:px-20">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600 mb-3">{content?.story?.eyebrow ?? 'Our Story'}</p>
          <h2 className="font-sans font-semibold text-stone-900 mb-6" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.75rem)' }}>
            {content?.story?.heading ?? 'What is a Gurukul?'}
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              {(content?.story?.paragraphs ?? []).map((p: string, i: number) => (
                <p key={i} className="text-stone-600 leading-relaxed">{p}</p>
              ))}
            </div>
            <div className="p-8 bg-white rounded-xl border-2 border-stone-200">
              <p className="text-stone-700 font-medium leading-relaxed italic">"{content?.story?.quote ?? ''}"</p>
              <p className="text-xs text-stone-500 mt-4 uppercase tracking-wider font-semibold">{content?.story?.attribution ?? ''}</p>
            </div>
          </div>
        </div>
      </EditableSection>

      {/* Drawers */}
      {activeSection === 'hero' && <HomeHeroDrawer data={content?.hero ?? {}} onSave={(d) => save('hero', d)} />}
      {activeSection === 'mission' && <HomeMissionDrawer data={content?.mission ?? {}} onSave={(d) => save('mission', d)} />}
      {activeSection === 'story' && <HomeStoryDrawer data={content?.story ?? {}} onSave={(d) => save('story', d)} />}
    </div>
  )
}

function AboutPreview({ content, onSave }: { content: any; onSave: (k: string, d: any) => Promise<boolean> }) {
  const { activeSection, closeDrawer } = useEditing()
  const save = async (key: string, data: any) => {
    const ok = await onSave(key, data)
    if (ok) { toast.success('Saved'); closeDrawer() }
    else toast.error('Save failed')
    return ok
  }

  return (
    <div>
      <EditableSection sectionKey="about" label="About Content">
        <div className="py-16 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-stone-900 to-stone-800">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-3">{content?.hero?.eyebrow ?? 'About Us'}</p>
          <h1 className="font-sans font-semibold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            {content?.hero?.title ?? "eYogi Gurukul - Ireland's Vedic School"}
          </h1>
          <p className="text-stone-300 text-lg max-w-2xl">{content?.hero?.subtitle ?? ''}</p>
        </div>

        <div className="bg-stone-50">
          {(content?.sections ?? []).map((section: any, i: number) => (
            <div key={i} className={`py-12 px-6 md:px-12 lg:px-20 ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
              <div className="max-w-4xl mx-auto">
                <h2 className="font-sans text-2xl font-semibold text-stone-900 mb-3">{section.title}</h2>
                <p className="text-stone-600 leading-relaxed">{section.content}</p>
              </div>
            </div>
          ))}
        </div>
      </EditableSection>

      {activeSection === 'about' && <AboutDrawer data={content ?? {}} onSave={(d) => save('about', { ...d })} />}
    </div>
  )
}

function FAQPreview({ content, onSave }: { content: any; onSave: (k: string, d: any) => Promise<boolean> }) {
  const { activeSection, closeDrawer } = useEditing()
  const save = async (_key: string, data: any) => {
    // FAQ data is stored flat — save all sections together
    const ok = await onSave('faq', data)
    if (ok) { toast.success('Saved'); closeDrawer() }
    else toast.error('Save failed')
    return ok
  }

  const faqs: any[] = content?.faqs ?? []

  return (
    <div>
      <EditableSection sectionKey="faq" label="FAQ Content">
        <div className="py-16 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-stone-900 to-stone-800">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-3">{content?.hero?.eyebrow ?? 'Have Questions?'}</p>
            <h1 className="font-sans font-semibold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
              {content?.hero?.heading ?? 'Frequently Asked Questions'}
            </h1>
            <p className="text-stone-300 text-lg">{content?.hero?.subtext ?? ''}</p>
          </div>
        </div>
        <div className="py-12 px-6 md:px-12 lg:px-20 bg-white">
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-stone-200 rounded-lg p-5">
                <p className="font-semibold text-stone-900">{faq.question}</p>
                <p className="text-stone-600 text-sm mt-2 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
            {faqs.length === 0 && <p className="text-stone-400 text-sm text-center py-8">No FAQ items yet. Click to edit.</p>}
          </div>
        </div>
      </EditableSection>

      {activeSection === 'faq' && (
        <FAQDrawer data={{ hero: content?.hero, faqs: content?.faqs, cta: content?.cta }} onSave={(d) => save('faq', d)} />
      )}
    </div>
  )
}

function MembershipPreview({ content, onSave }: { content: any; onSave: (k: string, d: any) => Promise<boolean> }) {
  const { activeSection, closeDrawer } = useEditing()
  const save = async (_key: string, data: any) => {
    const ok = await onSave('membership', data)
    if (ok) { toast.success('Saved'); closeDrawer() }
    else toast.error('Save failed')
    return ok
  }
  const benefits: any[] = content?.benefits?.items ?? []

  return (
    <div>
      <EditableSection sectionKey="membership" label="Membership Content">
        <div className="py-16 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-stone-900 to-stone-800 text-center">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-3">{content?.hero?.eyebrow ?? 'Premium Benefits'}</p>
          <h1 className="font-sans font-semibold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>{content?.hero?.heading ?? 'Join eYogi Membership'}</h1>
          <p className="text-stone-300 text-lg max-w-2xl mx-auto">{content?.hero?.subtext ?? ''}</p>
        </div>
        <div className="py-12 px-6 md:px-12 lg:px-20 bg-white">
          <h2 className="text-center font-semibold text-stone-900 text-2xl mb-3">{content?.benefits?.heading ?? 'Membership Benefits'}</h2>
          <p className="text-center text-stone-500 mb-8">{content?.benefits?.subheading ?? ''}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {benefits.map((b: any, i: number) => (
              <div key={i} className="p-5 border border-stone-200 rounded-lg">
                <h3 className="font-semibold text-stone-900 mb-1 text-sm">{b.title}</h3>
                <p className="text-stone-600 text-xs">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </EditableSection>

      {activeSection === 'membership' && (
        <MembershipDrawer data={{ hero: content?.hero, benefits: content?.benefits, features: content?.features, cta: content?.cta }} onSave={(d) => save('membership', d)} />
      )}
    </div>
  )
}

function ContactPreview({ content, onSave }: { content: any; onSave: (k: string, d: any) => Promise<boolean> }) {
  const { activeSection, closeDrawer } = useEditing()
  const save = async (_key: string, data: any) => {
    // For contact, merge all top-level keys
    const ok = await onSave('contact', data)
    if (ok) { toast.success('Saved'); closeDrawer() }
    else toast.error('Save failed')
    return ok
  }
  return (
    <div>
      <EditableSection sectionKey="contact" label="Contact Content">
        <div className="py-24 px-6 md:px-12 lg:px-20 max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4">{content?.eyebrow ?? 'Contact'}</p>
          <h1 className="font-sans font-semibold text-stone-900 mb-6" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>{content?.heading ?? 'Get in Touch'}</h1>
          <p className="text-stone-500">Email: <span className="text-amber-600">{content?.email ?? 'office@eyogigurukul.com'}</span></p>
        </div>
      </EditableSection>
      {activeSection === 'contact' && (
        <ContactDrawer data={{ eyebrow: content?.eyebrow, heading: content?.heading, email: content?.email, text: content?.text }} onSave={(d) => save('contact', d)} />
      )}
    </div>
  )
}

function DonationPreview({ content, onSave }: { content: any; onSave: (k: string, d: any) => Promise<boolean> }) {
  const { activeSection, closeDrawer } = useEditing()
  const save = async (_key: string, data: any) => {
    const ok = await onSave('donation', data)
    if (ok) { toast.success('Saved'); closeDrawer() }
    else toast.error('Save failed')
    return ok
  }
  const bankMethod = (content?.methods ?? []).find((m: any) => m.type === 'bank') ?? {}
  const bankDetails = bankMethod.details ?? {}

  return (
    <div>
      <EditableSection sectionKey="donation" label="Donation Content">
        <div className="py-16 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-600 mb-3">{content?.hero?.eyebrow ?? 'Support Us'}</p>
            <h1 className="font-sans font-semibold text-stone-900 mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>{content?.hero?.heading ?? 'Support Our Mission'}</h1>
            <p className="text-stone-600 max-w-2xl mx-auto">{content?.hero?.text ?? ''}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 border-2 border-orange-200 rounded-2xl bg-white">
              <h3 className="font-semibold text-stone-900 mb-2">Donate Online</h3>
              <p className="text-stone-600 text-sm">{(content?.methods ?? []).find((m: any) => m.type === 'online')?.description ?? ''}</p>
            </div>
            <div className="p-6 border-2 border-stone-200 rounded-2xl bg-stone-50">
              <h3 className="font-semibold text-stone-900 mb-2">Bank Transfer</h3>
              <p className="text-stone-500 text-xs font-mono">IBAN: {bankDetails.iban ?? 'IE92AIBK93123324399060'}</p>
            </div>
          </div>
          <div className="bg-stone-900 rounded-2xl p-8 text-white">
            <h2 className="font-semibold text-xl mb-4">{content?.impact?.heading ?? 'Your Impact'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(content?.impact?.levels ?? []).map((l: any, i: number) => (
                <div key={i}><div className="text-2xl font-bold text-orange-400 mb-1">{l.amount}</div><p className="text-stone-300 text-sm">{l.impact}</p></div>
              ))}
            </div>
          </div>
        </div>
      </EditableSection>
      {activeSection === 'donation' && (
        <DonationDrawer data={content ?? {}} onSave={(d) => save('donation', d)} />
      )}
    </div>
  )
}

// ─── Page registry ─────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  about: 'About',
  faq: 'FAQ',
  membership: 'Membership',
  contact: 'Contact',
  donation: 'Donation',
}

function PagePreview({ slug, content, onSave }: { slug: string; content: any; onSave: (k: string, d: any) => Promise<boolean> }) {
  const props = { content, onSave }
  if (slug === 'home') return <HomePreview {...props} />
  if (slug === 'about') return <AboutPreview {...props} />
  if (slug === 'faq') return <FAQPreview {...props} />
  if (slug === 'membership') return <MembershipPreview {...props} />
  if (slug === 'contact') return <ContactPreview {...props} />
  if (slug === 'donation') return <DonationPreview {...props} />
  return <div className="p-8 text-stone-500">No preview available for this page.</div>
}

// ─── Editor shell ─────────────────────────────────────────────────────────────

function EditorShell({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const { content, status, loading, updateSection, updatePageContent, publish, unpublish } = usePageContentAdmin(slug)

  const handlePublish = async () => {
    const ok = status === 'published' ? await unpublish() : await publish()
    if (ok) toast.success(status === 'published' ? 'Unpublished' : 'Published')
    else toast.error('Failed')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Admin toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/pages')}
              className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Pages
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-sm font-semibold text-stone-900">{PAGE_LABELS[slug] ?? slug}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {status === 'published' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={slug === 'home' ? '/' : `/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview live
            </a>
            <button
              onClick={handlePublish}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                status === 'published'
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              {status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-orange-50 border-t border-orange-100">
          <p className="text-xs text-orange-700 text-center">
            Hover over any section and click <strong>Edit</strong> to update its content
          </p>
        </div>
      </div>

      {/* Page preview */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto my-6 bg-white rounded-xl shadow-sm overflow-hidden border border-stone-200">
          <EditingProvider>
            <PagePreview
              slug={slug}
              content={content}
              onSave={async (key, data) => {
                // Flat-page saves (faq, membership, contact, donation) pass
                // key === slug and data = the full page content object.
                // Spread all keys into the top-level content instead of nesting.
                if (key === slug) {
                  return updatePageContent(data)
                }
                return updateSection(key, data)
              }}
            />
          </EditingProvider>
        </div>
      </div>
    </div>
  )
}

export default function AdminPageEditor() {
  const { slug } = useParams<{ slug: string }>()

  if (!slug) return null
  return <EditorShell slug={slug} />
}
