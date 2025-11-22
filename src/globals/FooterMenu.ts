import type { GlobalConfig } from 'payload'

export const FooterMenu: GlobalConfig = {
  slug: 'footerMenu',
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return !!user
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Footer Navigation',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description:
          'Configure footer menu items and sections. Items will be sorted by the sort order you assign in each menu item.',
      },
    },
    {
      name: 'menuItems',
      type: 'relationship',
      relationTo: 'menuItems' as any,
      hasMany: true,
      admin: {
        description:
          'Footer menu items are managed in the Menu Items collection. Create items with "Footer Menu" type. Sort order controls display sequence.',
      },
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Section heading (e.g., "Learning", "Support", "Legal")',
          },
        },
        {
          name: 'menuItems',
          type: 'relationship',
          relationTo: 'menuItems' as any,
          hasMany: true,
          admin: {
            description: 'Menu items to display in this section',
          },
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          admin: {
            step: 1,
            description: 'Order in which sections appear (lower numbers = first)',
          },
        },
      ],
      maxRows: 10,
      admin: {
        initCollapsed: true,
        description: 'Optional: Organize footer items into named sections/columns',
      },
    },
    {
      name: 'companyInfo',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'Organization name',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Short company description',
          },
        },
        {
          name: 'email',
          type: 'text',
          admin: {
            description: 'Contact email address',
          },
        },
        {
          name: 'phone',
          type: 'text',
          admin: {
            description: 'Contact phone number',
          },
        },
        {
          name: 'address',
          type: 'textarea',
          admin: {
            description: 'Physical address',
          },
        },
      ],
      admin: {
        description: 'Optional: Company information to display in footer',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'GitHub', value: 'github' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Full URL to social profile',
          },
        },
      ],
      maxRows: 10,
      admin: {
        initCollapsed: true,
        description: 'Optional: Social media links',
      },
    },
    {
      name: 'copyrightText',
      type: 'text',
      defaultValue: '© {year} All rights reserved.',
      admin: {
        description: 'Copyright text. Use {year} for current year',
      },
    },
    {
      name: 'backgroundColor',
      type: 'text',
      admin: {
        description: 'Optional: Custom CSS background color',
      },
    },
  ],
  admin: {
    group: 'Navigation',
  },
}
