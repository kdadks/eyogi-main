import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'
import { Plus, Trash2 } from 'lucide-react'

interface FAQItem { question: string; answer: string }
interface FAQData {
  hero?: { eyebrow?: string; heading?: string; subtext?: string }
  faqs?: FAQItem[]
  cta?: { heading?: string; text?: string; buttonText?: string; buttonHref?: string }
}

interface Props { data: FAQData; onSave: (data: FAQData) => Promise<void> }

export default function FAQDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<FAQData>({
    hero: data.hero ?? { eyebrow: 'Have Questions?', heading: 'Frequently Asked Questions', subtext: '' },
    faqs: data.faqs ?? [],
    cta: data.cta ?? { heading: "Didn't Find Your Answer?", text: '', buttonText: 'Get in Touch', buttonHref: '/contact' },
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'hero' | 'faqs' | 'cta'>('faqs')

  const updateFAQ = (i: number, k: keyof FAQItem, v: string) => {
    const faqs = [...(form.faqs ?? [])]
    faqs[i] = { ...faqs[i], [k]: v }
    setForm((f) => ({ ...f, faqs }))
  }
  const addFAQ = () => setForm((f) => ({ ...f, faqs: [...(f.faqs ?? []), { question: '', answer: '' }] }))
  const removeFAQ = (i: number) => setForm((f) => ({ ...f, faqs: (f.faqs ?? []).filter((_, idx) => idx !== i) }))

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="FAQ Page" onSave={handleSave} saving={saving}>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
        {(['hero', 'faqs', 'cta'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {t === 'faqs' ? `FAQs (${form.faqs?.length ?? 0})` : t}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <>
          <Field label="Eyebrow"><input className={inp} value={form.hero?.eyebrow} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, eyebrow: e.target.value } }))} /></Field>
          <Field label="Heading"><input className={inp} value={form.hero?.heading} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, heading: e.target.value } }))} /></Field>
          <Field label="Subtext"><textarea className={`${inp} h-20 resize-none`} value={form.hero?.subtext} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, subtext: e.target.value } }))} /></Field>
        </>
      )}

      {tab === 'faqs' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">FAQ Items</p>
            <button onClick={addFAQ} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
              <Plus className="w-3 h-3" /> Add FAQ
            </button>
          </div>
          <div className="space-y-4">
            {(form.faqs ?? []).map((faq, i) => (
              <div key={i} className="p-4 border border-stone-200 rounded-lg space-y-3 relative">
                <button onClick={() => removeFAQ(i)} className="absolute top-3 right-3 text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                <p className="text-xs font-semibold text-stone-500">FAQ {i + 1}</p>
                <Field label="Question"><input className={inp} value={faq.question} onChange={(e) => updateFAQ(i, 'question', e.target.value)} /></Field>
                <Field label="Answer"><textarea className={`${inp} h-24 resize-none`} value={faq.answer} onChange={(e) => updateFAQ(i, 'answer', e.target.value)} /></Field>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'cta' && (
        <>
          <Field label="Heading"><input className={inp} value={form.cta?.heading} onChange={(e) => setForm((f) => ({ ...f, cta: { ...f.cta!, heading: e.target.value } }))} /></Field>
          <Field label="Text"><textarea className={`${inp} h-20 resize-none`} value={form.cta?.text} onChange={(e) => setForm((f) => ({ ...f, cta: { ...f.cta!, text: e.target.value } }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Label"><input className={inp} value={form.cta?.buttonText} onChange={(e) => setForm((f) => ({ ...f, cta: { ...f.cta!, buttonText: e.target.value } }))} /></Field>
            <Field label="Button Link"><input className={inp} value={form.cta?.buttonHref} onChange={(e) => setForm((f) => ({ ...f, cta: { ...f.cta!, buttonHref: e.target.value } }))} /></Field>
          </div>
        </>
      )}
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-stone-600">{label}</label>{children}</div>
}
const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
