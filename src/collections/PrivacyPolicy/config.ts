import { revalidatePrivacyPolicy } from '@/hooks/revalidatePrivacyPolice'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { GlobalConfig } from 'payload'

export const PrivacyPolicy: GlobalConfig = {
  slug: 'privacy-policy',
  label: 'Privacy Policy',
  access: {
    read: () => true,
    update: () => true,
  },
  admin: {
    description: 'Edit the Privacy Policy content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
    },
  ],
  hooks: {
    afterChange: [revalidatePrivacyPolicy],
  },
}
