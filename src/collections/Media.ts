import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    // {
    //   name: 'caption',
    //   type: 'richText',
    //   editor: lexicalEditor({
    //     features: ({ rootFeatures }) => {
    //       return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
    //     },
    //   }),
    // },
  ],
  upload: {
    // UploadThing handles the storage, no staticDir needed
    mimeTypes: ['image/*', 'video/*', 'application/pdf'], // Allowed file types
  },
}
