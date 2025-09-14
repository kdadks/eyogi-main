import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { CollectionConfig } from 'payload'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { slugField } from '@/fields/slug'

export const Faq: CollectionConfig = {
  slug: 'Faq',
  admin: {
    defaultColumns: ['question', 'slug', 'updatedAt'],
    useAsTitle: 'question',
  },
  defaultPopulate: {
    slug: true,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            BlocksFeature({ blocks: [MediaBlock] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'categoriesFaq',
      required: true,
    },
    ...slugField('question'),
  ],
  timestamps: true,
}
