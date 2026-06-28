// src/components/admin/blocks/DividerBlock.tsx
import type { DividerBlock } from '@/types/blocks'

interface Props { block: DividerBlock }

export function DividerBlock({ block: _ }: Props) {
  return (
    <div className="flex items-center gap-4 py-2">
      <hr className="flex-1 border-slate-300" />
      <span className="text-slate-400 text-xs">DIVIDER</span>
      <hr className="flex-1 border-slate-300" />
    </div>
  )
}
