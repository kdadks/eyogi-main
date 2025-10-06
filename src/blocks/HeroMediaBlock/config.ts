import type { Block } from 'payload'

export const HeroMediaBlock: Block = {
  slug: 'heroMediaBlock',
  interfaceName: 'HeroMediaBlock',
  labels: {
    singular: 'Hero with Media',
    plural: 'Hero with Media',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          defaultValue: 'imageRight',
          options: [
            {
              label: 'Image on Right',
              value: 'imageRight',
            },
            {
              label: 'Image on Left',
              value: 'imageLeft',
            },
            {
              label: 'Background Image',
              value: 'backgroundImage',
            },
            {
              label: 'Video Background',
              value: 'videoBackground',
            },
          ],
          admin: {
            width: '50%',
          },
        },
        {
          name: 'theme',
          type: 'select',
          defaultValue: 'light',
          options: [
            {
              label: 'Light',
              value: 'light',
            },
            {
              label: 'Dark',
              value: 'dark',
            },
          ],
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'content',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          admin: {
            placeholder: 'Small text above headline (optional)',
          },
        },
        {
          name: 'headline',
          type: 'richText',
          required: true,
        },
        {
          name: 'description',
          type: 'richText',
        },
        {
          name: 'actions',
          type: 'array',
          maxRows: 3,
          labels: {
            singular: 'Action Button',
            plural: 'Action Buttons',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  defaultValue: 'primary',
                  options: [
                    {
                      label: 'Primary',
                      value: 'primary',
                    },
                    {
                      label: 'Secondary',
                      value: 'secondary',
                    },
                    {
                      label: 'Outline',
                      value: 'outline',
                    },
                  ],
                  admin: {
                    width: '33%',
                  },
                },
                {
                  name: 'linkType',
                  type: 'select',
                  defaultValue: 'internal',
                  options: [
                    {
                      label: 'Internal Link',
                      value: 'internal',
                    },
                    {
                      label: 'External URL',
                      value: 'external',
                    },
                  ],
                  admin: {
                    width: '33%',
                  },
                },
                {
                  name: 'newTab',
                  type: 'checkbox',
                  label: 'Open in new tab',
                  admin: {
                    width: '34%',
                  },
                },
              ],
            },
            {
              name: 'internalLink',
              type: 'relationship',
              relationTo: ['posts', 'pages'],
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === 'internal',
              },
            },
            {
              name: 'externalUrl',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === 'external',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'media',
      type: 'group',
      fields: [
        {
          name: 'primaryMedia',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Main image or video for the hero section',
          },
        },
        {
          name: 'mobileMedia',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional different media for mobile devices',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'objectPosition',
              type: 'select',
              defaultValue: 'center',
              options: [
                {
                  label: 'Top',
                  value: 'top',
                },
                {
                  label: 'Center',
                  value: 'center',
                },
                {
                  label: 'Bottom',
                  value: 'bottom',
                },
                {
                  label: 'Left',
                  value: 'left',
                },
                {
                  label: 'Right',
                  value: 'right',
                },
              ],
              admin: {
                width: '33%',
                condition: (_, siblingData) => {
                  const layout = siblingData?.layout || 'imageRight'
                  return layout === 'backgroundImage' || layout === 'videoBackground'
                },
              },
            },
            {
              name: 'overlay',
              type: 'select',
              defaultValue: 'none',
              options: [
                {
                  label: 'None',
                  value: 'none',
                },
                {
                  label: 'Light',
                  value: 'light',
                },
                {
                  label: 'Medium',
                  value: 'medium',
                },
                {
                  label: 'Dark',
                  value: 'dark',
                },
              ],
              admin: {
                width: '33%',
                condition: (_, siblingData) => {
                  const layout = siblingData?.layout || 'imageRight'
                  return layout === 'backgroundImage' || layout === 'videoBackground'
                },
              },
            },
            {
              name: 'parallax',
              type: 'checkbox',
              defaultValue: false,
              label: 'Enable parallax effect',
              admin: {
                width: '34%',
                condition: (_, siblingData) => {
                  const layout = siblingData?.layout || 'imageRight'
                  return layout === 'backgroundImage'
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Advanced Options',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'padding',
              type: 'select',
              defaultValue: 'normal',
              options: [
                {
                  label: 'Small',
                  value: 'small',
                },
                {
                  label: 'Normal',
                  value: 'normal',
                },
                {
                  label: 'Large',
                  value: 'large',
                },
              ],
              admin: {
                width: '33%',
              },
            },
            {
              name: 'maxWidth',
              type: 'select',
              defaultValue: 'container',
              options: [
                {
                  label: 'Container',
                  value: 'container',
                },
                {
                  label: 'Full Width',
                  value: 'full',
                },
                {
                  label: 'Narrow',
                  value: 'narrow',
                },
              ],
              admin: {
                width: '33%',
              },
            },
            {
              name: 'animate',
              type: 'checkbox',
              defaultValue: true,
              label: 'Enable animations',
              admin: {
                width: '34%',
              },
            },
          ],
        },
      ],
    },
  ],
}
