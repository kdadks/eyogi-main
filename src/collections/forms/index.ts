import { revalidateForms, revalidateFormsDelete } from '@/hooks/revalidateFormLinks'
import { CollectionConfig } from 'payload'

export const FormLinks: CollectionConfig = {
  slug: 'formLinks',
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
      name: 'link',
      type: 'text',
      required: true,
      minLength: 10,
      maxLength: 250,
    },
  ],
  hooks: {
    afterChange: [revalidateForms],
    afterDelete: [revalidateFormsDelete],
  },
  timestamps: true,
}
