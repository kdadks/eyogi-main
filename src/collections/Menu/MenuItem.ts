import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const MenuItem: CollectionConfig = {
  slug: 'menuItems',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'menu', 'type', 'sortOrder', 'isActive'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name of the menu item',
      },
    },
    {
      name: 'menu',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Header Menu',
          value: 'header',
        },
        {
          label: 'Footer Menu',
          value: 'footer',
        },
        {
          label: 'Header Submenu',
          value: 'header_submenu',
        },
      ],
      admin: {
        description: 'Which menu this item belongs to',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Page Link',
          value: 'page',
        },
        {
          label: 'Custom URL',
          value: 'custom',
        },
        {
          label: 'External Link',
          value: 'external',
        },
      ],
      admin: {
        description: 'Type of link for this menu item',
      },
    },
    {
      name: 'pageLink',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        condition: (data) => data?.type === 'page',
        description: 'Select a published page from your website',
      },
    },
    {
      name: 'customUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'custom',
        description: 'Enter a custom URL (e.g., /about, /contact)',
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'external',
        description: 'Enter full external URL (e.g., https://example.com)',
      },
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        description: 'Optional: Override title for display (useful for shorter names)',
      },
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Optional: Icon name from lucide-react (e.g., "Home", "Users", "Settings")',
      },
    },
    {
      name: 'badge',
      type: 'text',
      admin: {
        description: 'Optional: Badge text to display next to the menu item (e.g., "New", "Beta")',
      },
    },
    {
      name: 'parentMenu',
      type: 'relationship',
      relationTo: 'menuItems' as any,
      admin: {
        description: 'For submenu items: select the parent menu item',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        step: 1,
        description: 'Order in which menu items appear (lower numbers = first)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Enable/disable this menu item without deleting it',
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Open link in a new tab/window',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional: Tooltip or description shown on hover',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Optional: Additional metadata (custom attributes, styling hints, etc.)',
      },
    },
  ],
  timestamps: true,
}
