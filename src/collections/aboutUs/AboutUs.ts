import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  HeadingFeature,
  BlocksFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  HorizontalRuleFeature,
} from '@payloadcms/richtext-lexical'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { GlobalConfig } from 'payload'
import { revalidateAboutUs } from '@/hooks/revalidateAbout'

export const AboutUs: GlobalConfig = {
  slug: 'about-us',
  label: 'About Us',
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'About Us Page Content',
      admin: { readOnly: true },
    },

    // Section 1
    {
      name: 'whatIsGurukul',
      label: 'What is Gurukul?',
      type: 'group',
      fields: [
        {
          name: 'description',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
              BlocksFeature({ blocks: [MediaBlock] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
              HorizontalRuleFeature(),
            ],
          }),
        },
        {
          name: 'photo',
          type: 'relationship',
          relationTo: 'media',
          required: true,
        },
      ],
    },

    // Section 2
    {
      name: 'whatIsEYogiGurukul',
      label: 'What is eYogi Gurukul?',
      type: 'group',
      fields: [
        {
          name: 'description',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
              BlocksFeature({ blocks: [MediaBlock] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
              HorizontalRuleFeature(),
            ],
          }),
        },
        {
          name: 'photo',
          type: 'relationship',
          relationTo: 'media',
          required: true,
        },
      ],
    },

    // Section 3
    {
      name: 'lecturesAndWorkshops',
      label: 'Lectures & Workshops',
      type: 'array',
      minRows: 1,
      maxRows: 1,
      required: true,
      fields: [
        {
          name: 'ytLink',
          label: 'YouTube Link',
          type: 'text',
          required: true,
        },
      ],
    },

    // Section 4
    {
      name: 'graduationEvents',
      label: 'Graduation Events & Celebrations',
      type: 'group',
      fields: [
        {
          name: 'description',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
              BlocksFeature({ blocks: [MediaBlock] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
              HorizontalRuleFeature(),
            ],
          }),
        },
        {
          name: 'photos',
          type: 'array',
          minRows: 4,
          maxRows: 4,
          required: true,
          fields: [
            {
              name: 'photo',
              type: 'relationship',
              relationTo: 'media',
              required: true,
            },
          ],
        },
      ],
    },

    // Gallery
    {
      name: 'gallery',
      label: 'Gallery',
      type: 'group',
      fields: [
        {
          name: 'galleryImages',
          type: 'array',
          label: 'Gallery Images',
          minRows: 8,
          required: true,
          fields: [
            {
              name: 'image',
              type: 'relationship',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          name: 'ytLinks',
          type: 'array',
          label: 'Videos (YouTube Links)',
          minRows: 3,
          required: true,
          fields: [
            {
              name: 'Link',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateAboutUs],
  },
}
