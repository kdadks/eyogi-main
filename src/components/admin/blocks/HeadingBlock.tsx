// src/components/admin/blocks/HeadingBlock.tsx
import type { HeadingBlock } from '@/types/blocks'

interface Props { block: HeadingBlock; onChange: (b: HeadingBlock) => void }

export function HeadingBlock({ block, onChange }: Props) {
  const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3'
  const sizeMap = { 1: 'text-4xl', 2: 'text-3xl', 3: 'text-2xl' }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {([1, 2, 3] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange({ ...block, level: l })}
            className={`px-2 py-1 text-xs font-bold rounded border ${block.level === l ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
          >
            H{l}
          </button>
        ))}
      </div>
      <Tag
        contentEditable
        suppressContentEditableWarning
        className={`${sizeMap[block.level]} font-bold outline-none border-b border-slate-200 focus:border-orange-400 pb-1 w-full`}
        onBlur={(e) => onChange({ ...block, text: e.currentTarget.textContent ?? '' })}
      >
        {block.text || ''}
      </Tag>
    </div>
  )
}
