import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'
import { Plus, Trash2 } from 'lucide-react'

interface MissionCard {
  icon: string
  title: string
  body: string
  href: string
  cta: string
}
interface MissionData {
  eyebrow?: string
  heading?: string
  cards?: MissionCard[]
}

interface Props { data: MissionData; onSave: (data: MissionData) => Promise<void> }

export default function HomeMissionDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<MissionData>({
    eyebrow: data.eyebrow ?? 'Our Purpose',
    heading: data.heading ?? 'Education rooted in tradition, built for today.',
    cards: data.cards ?? [],
  })
  const [saving, setSaving] = useState(false)

  const updateCard = (i: number, k: keyof MissionCard, v: string) => {
    const cards = [...(form.cards ?? [])]
    cards[i] = { ...cards[i], [k]: v }
    setForm((f) => ({ ...f, cards }))
  }
  const addCard = () => setForm((f) => ({ ...f, cards: [...(f.cards ?? []), { icon: 'Target', title: '', body: '', href: '/', cta: 'Learn More' }] }))
  const removeCard = (i: number) => setForm((f) => ({ ...f, cards: (f.cards ?? []).filter((_, idx) => idx !== i) }))

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="Mission Section" onSave={handleSave} saving={saving}>
      <Field label="Eyebrow text">
        <input className={inp} value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} />
      </Field>
      <Field label="Heading">
        <input className={inp} value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
      </Field>

      <div className="border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Cards</p>
          <button onClick={addCard} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
            <Plus className="w-3 h-3" /> Add card
          </button>
        </div>
        <div className="space-y-4">
          {(form.cards ?? []).map((card, i) => (
            <div key={i} className="p-4 border border-stone-200 rounded-lg space-y-3 relative">
              <button onClick={() => removeCard(i)} className="absolute top-3 right-3 text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              <p className="text-xs font-semibold text-stone-500">Card {i + 1}</p>
              <Field label="Title"><input className={inp} value={card.title} onChange={(e) => updateCard(i, 'title', e.target.value)} /></Field>
              <Field label="Body"><textarea className={`${inp} h-20 resize-none`} value={card.body} onChange={(e) => updateCard(i, 'body', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA Label"><input className={inp} value={card.cta} onChange={(e) => updateCard(i, 'cta', e.target.value)} /></Field>
                <Field label="CTA Link"><input className={inp} value={card.href} onChange={(e) => updateCard(i, 'href', e.target.value)} /></Field>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-stone-600">{label}</label>{children}</div>
}
const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
