import { useState } from 'react'
import SectionDrawer from '../SectionDrawer'

interface ContactData { eyebrow?: string; heading?: string; email?: string; text?: string }
interface Props { data: ContactData; onSave: (data: ContactData) => Promise<void> }

export default function ContactDrawer({ data, onSave }: Props) {
  const [form, setForm] = useState<ContactData>({
    eyebrow: data.eyebrow ?? 'Contact',
    heading: data.heading ?? 'Get in Touch',
    email: data.email ?? 'office@eyogigurukul.com',
    text: data.text ?? '',
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <SectionDrawer title="Contact Page" onSave={handleSave} saving={saving}>
      <Field label="Eyebrow"><input className={inp} value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} /></Field>
      <Field label="Heading"><input className={inp} value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} /></Field>
      <Field label="Email address"><input className={inp} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
      <Field label="Body text"><textarea className={`${inp} h-20 resize-none`} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} /></Field>
    </SectionDrawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-stone-600">{label}</label>{children}</div>
}
const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
