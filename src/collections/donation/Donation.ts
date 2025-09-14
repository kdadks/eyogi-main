import { revalidateDonationPage } from '@/hooks/revalidateDonation'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { GlobalConfig } from 'payload'

export const Donation: GlobalConfig = {
  slug: 'donation',
  label: 'Donation',
  access: {
    read: () => true,
    update: () => true,
  },
  admin: {
    description: 'Edit the Donation content',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: false,
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
    afterChange: [revalidateDonationPage],
  },
}
