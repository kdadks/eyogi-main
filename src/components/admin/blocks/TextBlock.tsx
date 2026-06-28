// src/components/admin/blocks/TextBlock.tsx
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import type { TextBlock } from '@/types/blocks'

interface Props { block: TextBlock; onChange: (b: TextBlock) => void }

export function TextBlock({ block, onChange }: Props) {
  return (
    <RichTextEditor
      value={block.lexicalState}
      onChange={(state) => onChange({ ...block, lexicalState: state })}
      placeholder="Write something…"
    />
  )
}
