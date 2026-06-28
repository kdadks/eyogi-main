// src/components/admin/blocks/HtmlBlock.tsx
import type { HtmlBlock } from '@/types/blocks'

interface Props { block: HtmlBlock; onChange: (b: HtmlBlock) => void }

export function HtmlBlock({ block, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Raw HTML</p>
      <textarea
        value={block.code}
        onChange={(e) => onChange({ ...block, code: e.target.value })}
        placeholder="<div>Raw HTML code…</div>"
        rows={6}
        className="w-full font-mono text-sm p-3 bg-slate-900 text-green-400 rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-orange-400"
      />
    </div>
  )
}
