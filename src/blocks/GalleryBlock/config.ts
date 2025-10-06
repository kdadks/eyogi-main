import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'galleryBlock',
  interfaceName: 'GalleryBlock',
  labels: {
    singular: 'Gallery',
    plural: 'Galleries',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        placeholder: 'Gallery title (optional)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        placeholder: 'Gallery description (optional)',
        rows: 2,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          defaultValue: 'grid',
          options: [
            {
              label: 'Grid',
              value: 'grid',
            },
            {
              label: 'Masonry',
              value: 'masonry',
            },
            {
              label: 'Carousel',
              value: 'carousel',
            },
            {
              label: 'Slideshow',
              value: 'slideshow',
            },
          ],
          admin: {
            width: '33%',
          },
        },
        {
          name: 'columns',
          type: 'select',
          defaultValue: '3',
          options: [
            {
              label: '2 Columns',
              value: '2',
            },
            {
              label: '3 Columns',
              value: '3',
            },
            {
              label: '4 Columns',
              value: '4',
            },
            {
              label: '5 Columns',
              value: '5',
            },
          ],
          admin: {
            width: '33%',
            condition: (_, siblingData) => siblingData?.layout === 'grid',
          },
        },
        {
          name: 'aspectRatio',
          type: 'select',
          defaultValue: 'auto',
          options: [
            {
              label: 'Auto',
              value: 'auto',
            },
            {
              label: 'Square (1:1)',
              value: 'square',
            },
            {
              label: 'Landscape (16:9)',
              value: 'landscape',
            },
            {
              label: 'Portrait (3:4)',
              value: 'portrait',
            },
          ],
          admin: {
            width: '34%',
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'array',
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      minRows: 1,
      maxRows: 50,
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
                width: '70%',
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              label: 'Featured',
              admin: {
                width: '15%',
              },
            },
            {
              name: 'order',
              type: 'number',
              min: 0,
              admin: {
                width: '15%',
                placeholder: 'Order',
              },
            },
          ],
        },
        {
          name: 'caption',
          type: 'text',
          admin: {
            placeholder: 'Image caption (optional)',
          },
        },
        {
          name: 'alt',
          type: 'text',
          admin: {
            placeholder: 'Alt text for accessibility (optional)',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Gallery Options',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'enableLightbox',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable lightbox/zoom',
        },
        {
          name: 'showCaptions',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show image captions',
        },
        {
          name: 'lazyLoad',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable lazy loading',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'spacing',
              type: 'select',
              defaultValue: 'normal',
              options: [
                {
                  label: 'Tight',
                  value: 'tight',
                },
                {
                  label: 'Normal',
                  value: 'normal',
                },
                {
                  label: 'Loose',
                  value: 'loose',
                },
              ],
              admin: {
                width: '33%',
              },
            },
            {
              name: 'rounded',
              type: 'checkbox',
              defaultValue: true,
              label: 'Rounded corners',
              admin: {
                width: '33%',
              },
            },
            {
              name: 'shadow',
              type: 'checkbox',
              defaultValue: false,
              label: 'Drop shadow',
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
