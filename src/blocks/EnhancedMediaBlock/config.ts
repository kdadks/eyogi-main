import type { Block } from 'payload'

export const EnhancedMediaBlock: Block = {
  slug: 'enhancedMediaBlock',
  interfaceName: 'EnhancedMediaBlock',
  labels: {
    singular: 'Media Block',
    plural: 'Media Blocks',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'size',
          type: 'select',
          defaultValue: 'medium',
          options: [
            {
              label: 'Small',
              value: 'small',
            },
            {
              label: 'Medium',
              value: 'medium',
            },
            {
              label: 'Large',
              value: 'large',
            },
            {
              label: 'Full Width',
              value: 'fullWidth',
            },
          ],
          admin: {
            width: '25%',
          },
        },
        {
          name: 'alignment',
          type: 'select',
          defaultValue: 'center',
          options: [
            {
              label: 'Left',
              value: 'left',
            },
            {
              label: 'Center',
              value: 'center',
            },
            {
              label: 'Right',
              value: 'right',
            },
          ],
          admin: {
            width: '25%',
          },
        },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        placeholder: 'Enter a caption for this media (optional)',
      },
    },
    {
      name: 'enableLightbox',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable lightbox/zoom on click',
    },
    {
      type: 'collapsible',
      label: 'Advanced Options',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'text',
          admin: {
            description:
              "Alternative text for accessibility. If not provided, will use the media file's alt text.",
            placeholder: 'Describe what this image shows',
          },
        },
        {
          name: 'link',
          type: 'group',
          fields: [
            {
              name: 'type',
              type: 'radio',
              defaultValue: 'none',
              options: [
                {
                  label: 'None',
                  value: 'none',
                },
                {
                  label: 'Internal Link',
                  value: 'internal',
                },
                {
                  label: 'External URL',
                  value: 'external',
                },
              ],
            },
            {
              name: 'internalLink',
              type: 'relationship',
              relationTo: ['posts', 'pages'],
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'internal',
              },
            },
            {
              name: 'externalUrl',
              type: 'url',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'external',
              },
            },
            {
              name: 'newTab',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: (_, siblingData) => siblingData?.type !== 'none',
              },
            },
          ],
        },
        {
          name: 'lazy',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable lazy loading',
        },
      ],
    },
  ],
}
