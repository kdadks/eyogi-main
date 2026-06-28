import { useState } from 'react'
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Copy,
  Type,
  Image as ImageIcon,
  Video,
  Layout,
  MessageSquare,
  FileQuestion,
  FormInput,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/admin/common/Button'
import { Card, CardBody, CardHeader } from '@/components/admin/common/Card'
import { Input } from '@/components/admin/forms/Input'
import { Textarea } from '@/components/admin/forms/Textarea'
import { Select } from '@/components/admin/forms/Select'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { MediaPicker } from './MediaPicker'
import type { AnyContentBlock } from '@/lib/cms-types'

interface ContentBlockEditorProps {
  blocks: AnyContentBlock[]
  onChange: (blocks: AnyContentBlock[]) => void
}

export function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())

  const toggleBlock = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId)
    } else {
      newExpanded.add(blockId)
    }
    setExpandedBlocks(newExpanded)
  }

  const addBlock = (type: string) => {
    const newBlock: AnyContentBlock = {
      id: `block_${Date.now()}`,
      type,
      data: getDefaultBlockData(type),
      settings: {},
    }
    onChange([...blocks, newBlock])
    setExpandedBlocks(new Set([...expandedBlocks, newBlock.id]))
  }

  const getDefaultBlockData = (type: string): Record<string, any> => {
    switch (type) {
      case 'hero':
        return { title: '', subtitle: '', description: '', background_image: '' }
      case 'text':
        return { content: '', format: 'html' }
      case 'image':
        return { image_url: '', alt_text: '', caption: '', size: 'full' }
      case 'video':
        return { video_url: '', provider: 'youtube', controls: true }
      case 'feature_grid':
        return { title: '', features: [], columns: 3 }
      case 'testimonial':
        return { quote: '', author: '', role: '' }
      case 'cta':
        return { title: '', description: '', button_text: '', button_url: '' }
      case 'faq':
        return { title: '', items: [] }
      default:
        return {}
    }
  }

  const updateBlock = (index: number, updates: Partial<AnyContentBlock>) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], ...updates }
    onChange(newBlocks)
  }

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return
    }

    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    onChange(newBlocks)
  }

  const duplicateBlock = (index: number) => {
    const blockToDuplicate = blocks[index]
    const newBlock = {
      ...blockToDuplicate,
      id: `block_${Date.now()}`,
    }
    const newBlocks = [...blocks]
    newBlocks.splice(index + 1, 0, newBlock)
    onChange(newBlocks)
  }

  const getBlockIcon = (type: string) => {
    const icons: Record<string, any> = {
      hero: Layout,
      text: Type,
      image: ImageIcon,
      video: Video,
      feature_grid: Layout,
      testimonial: MessageSquare,
      cta: Layout,
      faq: FileQuestion,
      form: FormInput,
    }
    return icons[type] || Layout
  }

  const renderBlockEditor = (block: AnyContentBlock, index: number) => {
    const isExpanded = expandedBlocks.has(block.id)

    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Input
              label="Title"
              value={block.data.title || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, title: e.target.value } })
              }
            />
            <Input
              label="Subtitle"
              value={block.data.subtitle || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, subtitle: e.target.value } })
              }
            />
            <Textarea
              label="Description"
              value={block.data.description || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, description: e.target.value } })
              }
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Background Image
              </label>
              <MediaPicker
                value={block.data.background_image}
                onChange={(mediaId) =>
                  updateBlock(index, { data: { ...block.data, background_image: mediaId } })
                }
              />
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <Select
              label="Format"
              value={block.data.format || 'html'}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, format: e.target.value } })
              }
            >
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
              <option value="plain">Plain Text</option>
            </Select>
            {block.data.format === 'html' ? (
              <RichTextEditor
                value={block.data.content || ''}
                onChange={(content) =>
                  updateBlock(index, { data: { ...block.data, content } })
                }
              />
            ) : (
              <Textarea
                label="Content"
                value={block.data.content || ''}
                onChange={(e) =>
                  updateBlock(index, { data: { ...block.data, content: e.target.value } })
                }
                rows={8}
              />
            )}
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
            <MediaPicker
              value={block.data.image_id}
              onChange={(mediaId) =>
                updateBlock(index, { data: { ...block.data, image_id: mediaId } })
              }
            />
            <Input
              label="Alt Text"
              value={block.data.alt_text || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, alt_text: e.target.value } })
              }
            />
            <Input
              label="Caption"
              value={block.data.caption || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, caption: e.target.value } })
              }
            />
            <Select
              label="Size"
              value={block.data.size || 'full'}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, size: e.target.value } })
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="full">Full Width</option>
            </Select>
          </div>
        )

      case 'cta':
        return (
          <div className="space-y-4">
            <Input
              label="Title"
              value={block.data.title || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, title: e.target.value } })
              }
            />
            <Textarea
              label="Description"
              value={block.data.description || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, description: e.target.value } })
              }
              rows={3}
            />
            <Input
              label="Button Text"
              value={block.data.button_text || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, button_text: e.target.value } })
              }
            />
            <Input
              label="Button URL"
              value={block.data.button_url || ''}
              onChange={(e) =>
                updateBlock(index, { data: { ...block.data, button_url: e.target.value } })
              }
            />
          </div>
        )

      default:
        return (
          <Textarea
            label="Block Data (JSON)"
            value={JSON.stringify(block.data, null, 2)}
            onChange={(e) => {
              try {
                const data = JSON.parse(e.target.value)
                updateBlock(index, { data })
              } catch (err) {
                // Invalid JSON
              }
            }}
            rows={8}
          />
        )
    }
  }

  const blockTypeOptions = [
    { value: 'hero', label: 'Hero Section', icon: Layout },
    { value: 'text', label: 'Text Content', icon: Type },
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'feature_grid', label: 'Feature Grid', icon: Layout },
    { value: 'testimonial', label: 'Testimonial', icon: MessageSquare },
    { value: 'cta', label: 'Call to Action', icon: Layout },
    { value: 'faq', label: 'FAQ', icon: FileQuestion },
    { value: 'form', label: 'Form', icon: FormInput },
  ]

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const BlockIcon = getBlockIcon(block.type)
        const isExpanded = expandedBlocks.has(block.id)

        return (
          <Card key={block.id}>
            <CardHeader className="flex items-center justify-between">
              <button
                onClick={() => toggleBlock(block.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <BlockIcon className="w-5 h-5 text-stone-500" />
                <span className="font-medium text-stone-900 capitalize">
                  {block.type.replace('_', ' ')}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-auto text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto text-stone-400" />
                )}
              </button>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveBlock(index, 'up')}
                  disabled={index === 0}
                  title="Move Up"
                >
                  <MoveUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveBlock(index, 'down')}
                  disabled={index === blocks.length - 1}
                  title="Move Down"
                >
                  <MoveDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => duplicateBlock(index)}
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBlock(index)}
                  title="Delete"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            {isExpanded && <CardBody>{renderBlockEditor(block, index)}</CardBody>}
          </Card>
        )
      })}

      {/* Add Block Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {blockTypeOptions.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="outline"
            onClick={() => addBlock(value)}
            leftIcon={<Icon className="w-4 h-4" />}
            className="justify-start"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
