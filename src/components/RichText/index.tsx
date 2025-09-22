import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as RichTextWithoutBlocks,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/cn'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | CodeBlockProps>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!

  // Handle cases where value is just an ID (number/string) instead of object
  if (typeof value !== 'object' || value === null) {
    console.warn('Link node has invalid document reference:', { value, relationTo })
    // Return a safe fallback URL
    if (relationTo === 'posts') return '/hinduism'
    if (relationTo === 'media') return '#'
    return '/'
  }

  const slug = value.slug

  if (relationTo === 'posts') return `/hinduism/${slug}`
  if (relationTo === 'media') return `${value.url || '#'}`
  return `/${slug || ''}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    mediaBlock: ({ node }) => (
      <MediaBlock
        className=" relative aspect-video"
        imgClassName="!m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <RichTextWithoutBlocks
      converters={jsxConverters}
      className={cn(
        {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose prose-img:m-0 prose-headings:m-0 prose:m-0 prose-p:leading-tight prose-p:tracking-tighter lg:prose-lg':
            enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
