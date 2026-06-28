import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'
import { Plus, Trash2 } from 'lucide-react'

interface StoryData {
  eyebrow?: string
  heading?: string
  paragraphs?: string[]
  quote?: string
  attribution?: string
}

interface Props { data: StoryData; onSave: (data: StoryData) => Promise<void> }

export default function HomeStoryDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<StoryData>({
    eyebrow: data.eyebrow ?? 'Our Story',
    heading: data.heading ?? 'What is a Gurukul?',
    paragraphs: data.paragraphs ?? [],
    quote: data.quote ?? '',
    attribution: data.attribution ?? '',
  })
  const [saving, setSaving] = useState(false)

  const updatePara = (i: number, v: string) => {
    const paragraphs = [...(form.paragraphs ?? [])]
    paragraphs[i] = v
    setForm((f) => ({ ...f, paragraphs }))
  }
  const addPara = () => setForm((f) => ({ ...f, paragraphs: [...(f.paragraphs ?? []), ''] }))
  const removePara = (i: number) => setForm((f) => ({ ...f, paragraphs: (f.paragraphs ?? []).filter((_, idx) => idx !== i) }))

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="Story Section" onSave={handleSave} saving={saving}>
      <Field label="Eyebrow"><input className={inp} value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} /></Field>
      <Field label="Heading"><input className={inp} value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} /></Field>

      <div className="border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Paragraphs</p>
          <button onClick={addPara} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
            <Plus className="w-3 h-3" /> Add paragraph
          </button>
        </div>
        <div className="space-y-3">
          {(form.paragraphs ?? []).map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea className={`${inp} h-24 resize-none flex-1`} value={p} onChange={(e) => updatePara(i, e.target.value)} />
              <button onClick={() => removePara(i)} className="mt-2 text-stone-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Pull Quote</p>
        <Field label="Quote text">
          <textarea className={`${inp} h-20 resize-none`} value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} />
        </Field>
        <Field label="Attribution">
          <input className={inp} value={form.attribution} onChange={(e) => setForm((f) => ({ ...f, attribution: e.target.value }))} />
        </Field>
      </div>
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-stone-600">{label}</label>{children}</div>
}
const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
