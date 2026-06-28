// src/components/admin/blocks/BlockEditor.tsx
import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { type Block, type BlockType, createBlock } from '@/types/blocks'
import { HeadingBlock } from './HeadingBlock'
import { TextBlock } from './TextBlock'
import { ImageBlock } from './ImageBlock'
import { VideoBlock } from './VideoBlock'
import { QuoteBlock } from './QuoteBlock'
import { CalloutBlock } from './CalloutBlock'
import { DividerBlock } from './DividerBlock'
import { HtmlBlock } from './HtmlBlock'
import { ColumnsBlock } from './ColumnsBlock'

const BLOCK_MENU: { type: BlockType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: '¶' },
  { type: 'heading', label: 'Heading', icon: 'H' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'video', label: 'Video', icon: '▶' },
  { type: 'quote', label: 'Quote', icon: '"' },
  { type: 'callout', label: 'Callout', icon: '!' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'html', label: 'HTML', icon: '<>' },
  { type: 'columns', label: '2 Columns', icon: '⊞' },
]

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  onOpenMediaPicker?: (onSelect: (mediaId: string, publicUrl: string, alt: string) => void) => void
  nested?: boolean
}

export function BlockEditor({ blocks, onChange, onOpenMediaPicker, nested = false }: BlockEditorProps) {
  const [showMenu, setShowMenu] = useState(false)

  function addBlock(type: BlockType) {
    onChange([...blocks, createBlock(type)])
    setShowMenu(false)
  }

  function updateBlock(index: number, updated: Block) {
    const next = [...blocks]
    next[index] = updated
    onChange(next)
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index))
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    const next = [...blocks]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    onChange(next)
  }

  function renderBlock(block: Block, index: number) {
    const sharedProps = { key: block.id }

    switch (block.type) {
      case 'heading':
        return <HeadingBlock {...sharedProps} block={block} onChange={(b) => updateBlock(index, b)} />
      case 'text':
        return <TextBlock {...sharedProps} block={block} onChange={(b) => updateBlock(index, b)} />
      case 'image':
        return (
          <ImageBlock
            {...sharedProps}
            block={block}
            onChange={(b) => updateBlock(index, b)}
            onOpenMediaPicker={() =>
              onOpenMediaPicker?.((mediaId, publicUrl, alt) =>
                updateBlock(index, { ...block, mediaId, publicUrl, alt }),
              )
            }
          />
        )
      case 'video':
        return <VideoBlock {...sharedProps} block={block} onChange={(b) => updateBlock(index, b)} />
      case 'quote':
        return <QuoteBlock {...sharedProps} block={block} onChange={(b) => updateBlock(index, b)} />
      case 'callout':
        return <CalloutBlock {...sharedProps} block={block} onChange={(b) => updateBlock(index, b)} />
      case 'divider':
        return <DividerBlock {...sharedProps} block={block} />
      case 'html':
        return <HtmlBlock {...sharedProps} block={block} onChange={(b) => updateBlock(index, b)} />
      case 'columns':
        return (
          <ColumnsBlock
            {...sharedProps}
            block={block}
            onChange={(b) => updateBlock(index, b)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        )
    }
  }

  return (
    <div className={nested ? 'space-y-3' : 'space-y-4'}>
      {blocks.map((block, index) => (
        <div key={block.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
          {/* Block controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button type="button" onClick={() => removeBlock(index)} className="p-1 rounded hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
          <div className="absolute top-2 left-3 text-xs text-slate-300 font-mono uppercase group-hover:opacity-100 opacity-0 transition-opacity">
            {block.type}
          </div>
          <div className="mt-4">
            {renderBlock(block, index)}
          </div>
        </div>
      ))}

      {/* Add Block */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMenu((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add block
        </button>
        {showMenu && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-10 p-2 grid grid-cols-3 gap-1">
            {BLOCK_MENU.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addBlock(item.type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-left"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
