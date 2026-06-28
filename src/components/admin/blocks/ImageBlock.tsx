// src/components/admin/blocks/ImageBlock.tsx
import { Image } from 'lucide-react'
import type { ImageBlock } from '@/types/blocks'

interface Props {
  block: ImageBlock
  onChange: (b: ImageBlock) => void
  onOpenMediaPicker: () => void
}

export function ImageBlock({ block, onChange, onOpenMediaPicker }: Props) {
  return (
    <div className="space-y-3">
      {block.publicUrl ? (
        <div className="relative group">
          <img src={block.publicUrl} alt={block.alt} className="max-h-80 rounded-lg border border-slate-200 object-contain" />
          <button
            type="button"
            onClick={onOpenMediaPicker}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded-lg"
          >
            Change image
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenMediaPicker}
          className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
        >
          <Image className="w-8 h-8 mb-2" />
          <span className="text-sm">Pick from media library</span>
        </button>
      )}
      <input
        type="text"
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        placeholder="Alt text (accessibility)"
        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
      />
      <input
        type="text"
        value={block.caption ?? ''}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
      />
    </div>
  )
}
