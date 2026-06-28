import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'

interface AboutSection { section: string; icon?: string; title: string; content: string }
interface AboutData {
  hero?: { eyebrow?: string; title?: string; subtitle?: string }
  sections?: AboutSection[]
}

interface Props { data: AboutData; onSave: (data: AboutData) => Promise<void> }

export default function AboutDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<AboutData>({
    hero: data.hero ?? { eyebrow: 'About Us', title: '', subtitle: '' },
    sections: data.sections ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'hero' | 'sections'>('sections')

  const updateSection = (i: number, k: keyof AboutSection, v: string) => {
    const sections = [...(form.sections ?? [])]
    sections[i] = { ...sections[i], [k]: v }
    setForm((f) => ({ ...f, sections }))
  }

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="About Page" onSave={handleSave} saving={saving}>
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
        {(['hero', 'sections'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {t === 'sections' ? `Content Sections (${form.sections?.length ?? 0})` : 'Hero'}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <>
          <Field label="Eyebrow"><input className={inp} value={form.hero?.eyebrow} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, eyebrow: e.target.value } }))} /></Field>
          <Field label="Title"><input className={inp} value={form.hero?.title} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, title: e.target.value } }))} /></Field>
          <Field label="Subtitle"><textarea className={`${inp} h-20 resize-none`} value={form.hero?.subtitle} onChange={(e) => setForm((f) => ({ ...f, hero: { ...f.hero!, subtitle: e.target.value } }))} /></Field>
        </>
      )}

      {tab === 'sections' && (
        <div className="space-y-4">
          {(form.sections ?? []).map((s, i) => (
            <div key={i} className="p-4 border border-stone-200 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-stone-500 capitalize">{s.section}</p>
              <Field label="Title"><input className={inp} value={s.title} onChange={(e) => updateSection(i, 'title', e.target.value)} /></Field>
              <Field label="Content"><textarea className={`${inp} h-28 resize-none`} value={s.content} onChange={(e) => updateSection(i, 'content', e.target.value)} /></Field>
            </div>
          ))}
          {(form.sections ?? []).length === 0 && (
            <p className="text-sm text-stone-500 text-center py-4">No sections found. Run the seed script to populate content.</p>
          )}
        </div>
      )}
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-stone-600">{label}</label>{children}</div>
}
const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
