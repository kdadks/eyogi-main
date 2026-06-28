// src/components/admin/blocks/CalloutBlock.tsx
import type { CalloutBlock } from '@/types/blocks'

interface Props { block: CalloutBlock; onChange: (b: CalloutBlock) => void }

const variantStyles = {
  info: 'bg-blue-50 border-blue-300 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  tip: 'bg-green-50 border-green-300 text-green-800',
}

const variantLabels = { info: 'ℹ️ Info', warning: '⚠️ Warning', tip: '✅ Tip' }

export function CalloutBlock({ block, onChange }: Props) {
  return (
    <div className={`border rounded-lg p-4 space-y-3 ${variantStyles[block.variant]}`}>
      <div className="flex gap-2">
        {(['info', 'warning', 'tip'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange({ ...block, variant: v })}
            className={`text-xs px-2 py-1 rounded font-medium border ${block.variant === v ? 'bg-white border-current opacity-100' : 'opacity-50 hover:opacity-75'}`}
          >
            {variantLabels[v]}
          </button>
        ))}
      </div>
      <textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Callout text…"
        rows={2}
        className="w-full bg-transparent resize-none focus:outline-none font-medium"
      />
    </div>
  )
}
