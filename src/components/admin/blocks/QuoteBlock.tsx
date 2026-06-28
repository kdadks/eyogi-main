// src/components/admin/blocks/QuoteBlock.tsx
import type { QuoteBlock } from '@/types/blocks'

interface Props { block: QuoteBlock; onChange: (b: QuoteBlock) => void }

export function QuoteBlock({ block, onChange }: Props) {
  return (
    <div className="border-l-4 border-orange-400 pl-4 space-y-2">
      <textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Quote text…"
        rows={3}
        className="w-full text-lg italic text-slate-700 bg-transparent resize-none focus:outline-none"
      />
      <input
        type="text"
        value={block.attribution ?? ''}
        onChange={(e) => onChange({ ...block, attribution: e.target.value })}
        placeholder="— Attribution (optional)"
        className="w-full text-sm text-slate-500 bg-transparent focus:outline-none border-b border-slate-200 focus:border-orange-400 pb-1"
      />
    </div>
  )
}
