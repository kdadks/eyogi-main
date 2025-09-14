import { revalidateMembership, revalidateMembershipDelete } from '@/hooks/revalidateMembership'
import { CollectionConfig } from 'payload'

export const Membership: CollectionConfig = {
  slug: 'membership',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      minLength: 10,
      maxLength: 250,
    },
    {
      name: 'subsection',
      type: 'group',
      fields: [
        {
          name: 'first',
          type: 'textarea',
          required: true,
          minLength: 10,
          maxLength: 500,
        },
        {
          name: 'list',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 10,
          fields: [
            {
              name: 'item',
              type: 'text',
              required: true,
              minLength: 5,
              maxLength: 150,
            },
          ],
        },
        {
          name: 'last',
          type: 'textarea',
          required: true,
          minLength: 10,
          maxLength: 500,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateMembership],
    afterDelete: [revalidateMembershipDelete],
  },
  timestamps: true,
}
