import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'
import { Plus, Trash2 } from 'lucide-react'

interface HeroData {
  headline?: string
  subheadline?: string
  subtext?: string
  ctaPrimary?: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  stats?: { value: string; label: string }[]
}

interface Props {
  data: HeroData
  onSave: (data: HeroData) => Promise<void>
}

export default function HomeHeroDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<HeroData>({
    headline: data.headline ?? 'Ancient Wisdom,',
    subheadline: data.subheadline ?? 'Modern Minds.',
    subtext: data.subtext ?? '',
    ctaPrimary: data.ctaPrimary ?? { label: 'Learn More', href: '/about' },
    ctaSecondary: data.ctaSecondary ?? { label: 'Donate', href: '/donation' },
    stats: data.stats ?? [],
  })
  const [saving, setSaving] = useState(false)

  const field = (key: keyof HeroData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const updateStat = (i: number, k: 'value' | 'label', v: string) => {
    const stats = [...(form.stats ?? [])]
    stats[i] = { ...stats[i], [k]: v }
    setForm((f) => ({ ...f, stats }))
  }
  const addStat = () => setForm((f) => ({ ...f, stats: [...(f.stats ?? []), { value: '', label: '' }] }))
  const removeStat = (i: number) => setForm((f) => ({ ...f, stats: (f.stats ?? []).filter((_, idx) => idx !== i) }))

  return (
    <SectionDrawer title="Home Hero" onSave={handleSave} saving={saving}>
      <Field label="Headline">
        <input className={inp} value={form.headline} onChange={field('headline')} />
      </Field>
      <Field label="Sub-headline">
        <input className={inp} value={form.subheadline} onChange={field('subheadline')} />
      </Field>
      <Field label="Body text">
        <textarea className={`${inp} h-24 resize-none`} value={form.subtext} onChange={field('subtext')} />
      </Field>

      <div className="border-t border-stone-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Primary CTA</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Label">
            <input className={inp} value={form.ctaPrimary?.label} onChange={(e) => setForm((f) => ({ ...f, ctaPrimary: { ...f.ctaPrimary!, label: e.target.value } }))} />
          </Field>
          <Field label="Link">
            <input className={inp} value={form.ctaPrimary?.href} onChange={(e) => setForm((f) => ({ ...f, ctaPrimary: { ...f.ctaPrimary!, href: e.target.value } }))} />
          </Field>
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Secondary CTA</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Label">
            <input className={inp} value={form.ctaSecondary?.label} onChange={(e) => setForm((f) => ({ ...f, ctaSecondary: { ...f.ctaSecondary!, label: e.target.value } }))} />
          </Field>
          <Field label="Link">
            <input className={inp} value={form.ctaSecondary?.href} onChange={(e) => setForm((f) => ({ ...f, ctaSecondary: { ...f.ctaSecondary!, href: e.target.value } }))} />
          </Field>
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Stats</p>
          <button onClick={addStat} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
            <Plus className="w-3 h-3" /> Add stat
          </button>
        </div>
        <div className="space-y-2">
          {(form.stats ?? []).map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={inp} placeholder="Value" value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)} />
              <input className={inp} placeholder="Label" value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} />
              <button onClick={() => removeStat(i)} className="text-stone-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone-600">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
