import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'

interface ImpactLevel { amount: string; impact: string }
interface DonationData {
  hero?: { eyebrow?: string; heading?: string; text?: string }
  methods?: Array<{ type: string; title: string; description: string; buttonText?: string; details?: Record<string, string> }>
  impact?: { heading?: string; levels?: ImpactLevel[] }
  tax?: { heading?: string; text?: string }
}

interface Props { data: DonationData; onSave: (data: DonationData) => Promise<void> }

export default function DonationDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<DonationData>({
    hero: data.hero ?? { eyebrow: 'Support Us', heading: 'Support Our Mission', text: '' },
    methods: data.methods ?? [],
    impact: data.impact ?? { heading: 'Your Impact', levels: [] },
    tax: data.tax ?? { heading: 'Tax Deductible', text: '' },
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'hero' | 'bank' | 'impact'>('hero')

  const bankMethod = form.methods?.find((m) => m.type === 'bank')
  const updateBank = (k: string, v: string) => {
    const methods = (form.methods ?? []).map((m) =>
      m.type === 'bank' ? { ...m, details: { ...m.details, [k]: v } } : m
    )
    setForm((f) => ({ ...f, methods }))
  }
  const updateOnlineTitle = (v: string) => {
    const methods = (form.methods ?? []).map((m) =>
      m.type === 'online' ? { ...m, title: v } : m
    )
    setForm((f) => ({ ...f, methods }))
  }
  const updateOnlineDesc = (v: string) => {
    const methods = (form.methods ?? []).map((m) =>
      m.type === 'online' ? { ...m, description: v } : m
    )
    setForm((f) => ({ ...f, methods }))
  }
  const updateLevel = (i: number, k: keyof ImpactLevel, v: string) => {
    const levels = [...(form.impact?.levels ?? [])]
    levels[i] = { ...levels[i], [k]: v }
    setForm((f) => ({ ...f, impact: { ...f.impact!, levels } }))
  }

  const onlineMethod = form.methods?.find((m) => m.type === 'online')

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="Donation Page" onSave={handleSave} saving={saving}>
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
        {(['hero', 'bank', 'impact'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {t === 'bank' ? 'Bank / Online' : t}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <>
          <Field label="Eyebrow"><input className={inp} value={form.hero?.eyebrow} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, eyebrow: e.target.value } }))} /></Field>
          <Field label="Heading"><input className={inp} value={form.hero?.heading} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, heading: e.target.value } }))} /></Field>
          <Field label="Body text"><textarea className={`${inp} h-24 resize-none`} value={form.hero?.text} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, text: e.target.value } }))} /></Field>
          <div className="border-t border-stone-200 pt-4">
            <Field label="Tax notice heading"><input className={inp} value={form.tax?.heading} onChange={(e) => setForm((f) => ({ ...f, tax: { ...f.tax!, heading: e.target.value } }))} /></Field>
            <Field label="Tax notice text"><textarea className={`${inp} h-16 resize-none`} value={form.tax?.text} onChange={(e) => setForm((f) => ({ ...f, tax: { ...f.tax!, text: e.target.value } }))} /></Field>
          </div>
        </>
      )}

      {tab === 'bank' && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Online Donation Card</p>
          <Field label="Title"><input className={inp} value={onlineMethod?.title} onChange={(e) => updateOnlineTitle(e.target.value)} /></Field>
          <Field label="Description"><textarea className={`${inp} h-16 resize-none`} value={onlineMethod?.description} onChange={(e) => updateOnlineDesc(e.target.value)} /></Field>

          <div className="border-t border-stone-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Bank Transfer Details</p>
            {(['iban', 'bic', 'account', 'bank', 'charityNo'] as const).map((k) => (
              <Field key={k} label={k.toUpperCase()}><input className={inp} value={bankMethod?.details?.[k] ?? ''} onChange={(e) => updateBank(k, e.target.value)} /></Field>
            ))}
          </div>
        </>
      )}

      {tab === 'impact' && (
        <>
          <Field label="Section heading"><input className={inp} value={form.impact?.heading} onChange={(e) => setForm((f) => ({ ...f, impact: { ...f.impact!, heading: e.target.value } }))} /></Field>
          <div className="space-y-3">
            {(form.impact?.levels ?? []).map((level, i) => (
              <div key={i} className="p-3 border border-stone-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-stone-500">Level {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount"><input className={inp} value={level.amount} onChange={(e) => updateLevel(i, 'amount', e.target.value)} /></Field>
                  <Field label="Impact"><input className={inp} value={level.impact} onChange={(e) => updateLevel(i, 'impact', e.target.value)} /></Field>
                </div>
              </div>
            ))}
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
