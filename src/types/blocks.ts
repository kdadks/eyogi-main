export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'video'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'html'
  | 'columns'

export interface HeadingBlock {
  id: string
  type: 'heading'
  level: 1 | 2 | 3
  text: string
}

export interface TextBlock {
  id: string
  type: 'text'
  lexicalState: string
}

export interface ImageBlock {
  id: string
  type: 'image'
  mediaId: string
  publicUrl: string
  alt: string
  caption?: string
}

export interface VideoBlock {
  id: string
  type: 'video'
  url: string
  caption?: string
}

export interface QuoteBlock {
  id: string
  type: 'quote'
  text: string
  attribution?: string
}

export interface CalloutBlock {
  id: string
  type: 'callout'
  text: string
  variant: 'info' | 'warning' | 'tip'
}

export interface DividerBlock {
  id: string
  type: 'divider'
}

export interface HtmlBlock {
  id: string
  type: 'html'
  code: string
}

export interface ColumnsBlock {
  id: string
  type: 'columns'
  left: Block[]
  right: Block[]
}

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | HtmlBlock
  | ColumnsBlock

export function createBlock(type: BlockType): Block {
  const id = crypto.randomUUID()
  switch (type) {
    case 'heading': return { id, type: 'heading', level: 2, text: '' }
    case 'text': return { id, type: 'text', lexicalState: '' }
    case 'image': return { id, type: 'image', mediaId: '', publicUrl: '', alt: '' }
    case 'video': return { id, type: 'video', url: '' }
    case 'quote': return { id, type: 'quote', text: '' }
    case 'callout': return { id, type: 'callout', text: '', variant: 'info' }
    case 'divider': return { id, type: 'divider' }
    case 'html': return { id, type: 'html', code: '' }
    case 'columns': return { id, type: 'columns', left: [], right: [] }
  }
}
