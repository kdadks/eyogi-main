// src/components/admin/blocks/ColumnsBlock.tsx
import type { ColumnsBlock, Block } from '@/types/blocks'
// @ts-ignore — BlockEditor is created in Task 6; this import will resolve then
import { BlockEditor } from '@/components/admin/blocks/BlockEditor'

interface Props {
  block: ColumnsBlock
  onChange: (b: ColumnsBlock) => void
  onOpenMediaPicker?: (onSelect: (mediaId: string, publicUrl: string, alt: string) => void) => void
}

export function ColumnsBlock({ block, onChange, onOpenMediaPicker }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Left Column</p>
        <BlockEditor
          blocks={block.left}
          onChange={(left: Block[]) => onChange({ ...block, left })}
          onOpenMediaPicker={onOpenMediaPicker}
          nested
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Right Column</p>
        <BlockEditor
          blocks={block.right}
          onChange={(right: Block[]) => onChange({ ...block, right })}
          onOpenMediaPicker={onOpenMediaPicker}
          nested
        />
      </div>
    </div>
  )
}
