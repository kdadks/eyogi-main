import type { GlobalConfig } from 'payload'

export const HeaderMenu: GlobalConfig = {
  slug: 'headerMenu',
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
      defaultValue: 'Header Navigation',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description:
          'Configure header menu items. Items will be sorted by the sort order you assign in each menu item.',
      },
    },
    {
      name: 'menuItems',
      type: 'relationship',
      relationTo: 'menuItems' as any,
      hasMany: true,
      admin: {
        description:
          'Header menu items are managed in the Menu Items collection. Create items with "Header Menu" or "Header Submenu" type. Sort order controls display sequence.',
      },
    },
    {
      name: 'enableSearch',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show search bar in header',
      },
    },
    {
      name: 'enableUserMenu',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show user account menu in header',
      },
    },
    {
      name: 'logoUrl',
      type: 'text',
      admin: {
        description: 'Optional: Override default logo URL',
      },
    },
    {
      name: 'backgroundColor',
      type: 'text',
      admin: {
        description: 'Optional: Custom CSS background color (e.g., "bg-white", "#ffffff")',
      },
    },
    {
      name: 'sticky',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Keep header sticky at top when scrolling',
      },
    },
  ],
  admin: {
    group: 'Navigation',
  },
}
