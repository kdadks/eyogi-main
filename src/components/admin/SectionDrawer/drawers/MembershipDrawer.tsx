import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'

interface BenefitItem { icon: string; title: string; description: string }
interface FeatureItem { title: string; description: string }
interface MembershipData {
  hero?: { eyebrow?: string; heading?: string; subtext?: string; buttonText?: string }
  benefits?: { heading?: string; subheading?: string; items?: BenefitItem[] }
  features?: FeatureItem[]
  cta?: { text?: string; buttonText?: string }
}

interface Props { data: MembershipData; onSave: (data: MembershipData) => Promise<void> }

export default function MembershipDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<MembershipData>({
    hero: data.hero ?? { eyebrow: 'Premium Benefits', heading: 'Join eYogi Membership', subtext: '', buttonText: 'Get Started' },
    benefits: data.benefits ?? { heading: 'Membership Benefits', subheading: '', items: [] },
    features: data.features ?? [],
    cta: data.cta ?? { text: 'Ready to start your journey?', buttonText: 'Join Now' },
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'hero' | 'benefits' | 'features'>('hero')

  const updateBenefit = (i: number, k: keyof BenefitItem, v: string) => {
    const items = [...(form.benefits?.items ?? [])]
    items[i] = { ...items[i], [k]: v }
    setForm((f) => ({ ...f, benefits: { ...f.benefits!, items } }))
  }
  const updateFeature = (i: number, k: keyof FeatureItem, v: string) => {
    const features = [...(form.features ?? [])]
    features[i] = { ...features[i], [k]: v }
    setForm((f) => ({ ...f, features }))
  }

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="Membership Page" onSave={handleSave} saving={saving}>
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
        {(['hero', 'benefits', 'features'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <>
          <Field label="Eyebrow"><input className={inp} value={form.hero?.eyebrow} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, eyebrow: e.target.value } }))} /></Field>
          <Field label="Heading"><input className={inp} value={form.hero?.heading} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, heading: e.target.value } }))} /></Field>
          <Field label="Subtext"><textarea className={`${inp} h-20 resize-none`} value={form.hero?.subtext} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, subtext: e.target.value } }))} /></Field>
          <Field label="Button Text"><input className={inp} value={form.hero?.buttonText} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, buttonText: e.target.value } }))} /></Field>
          <div className="border-t border-stone-200 pt-4">
            <Field label="CTA Text"><input className={inp} value={form.cta?.text} onChange={(e) => setForm((f) => ({ ...f, cta: { ...f.cta!, text: e.target.value } }))} /></Field>
            <Field label="CTA Button"><input className={inp} value={form.cta?.buttonText} onChange={(e) => setForm((f) => ({ ...f, cta: { ...f.cta!, buttonText: e.target.value } }))} /></Field>
          </div>
        </>
      )}

      {tab === 'benefits' && (
        <>
          <Field label="Section Heading"><input className={inp} value={form.benefits?.heading} onChange={(e) => setForm((f) => ({ ...f, benefits: { ...f.benefits!, heading: e.target.value } }))} /></Field>
          <Field label="Subheading"><input className={inp} value={form.benefits?.subheading} onChange={(e) => setForm((f) => ({ ...f, benefits: { ...f.benefits!, subheading: e.target.value } }))} /></Field>
          <div className="space-y-3">
            {(form.benefits?.items ?? []).map((item, i) => (
              <div key={i} className="p-3 border border-stone-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-stone-500">Benefit {i + 1}</p>
                <Field label="Title"><input className={inp} value={item.title} onChange={(e) => updateBenefit(i, 'title', e.target.value)} /></Field>
                <Field label="Description"><input className={inp} value={item.description} onChange={(e) => updateBenefit(i, 'description', e.target.value)} /></Field>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'features' && (
        <div className="space-y-3">
          {(form.features ?? []).map((f, i) => (
            <div key={i} className="p-3 border border-stone-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-stone-500">Feature {i + 1}</p>
              <Field label="Title"><input className={inp} value={f.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} /></Field>
              <Field label="Description"><input className={inp} value={f.description} onChange={(e) => updateFeature(i, 'description', e.target.value)} /></Field>
            </div>
          ))}
        </div>
      )}
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-stone-600">{label}</label>{children}</div>
}
const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
