/**
 * Menu API - Fetches header and footer menu configuration from Payload CMS
 * This provides dynamic menu management through the admin interface
 */

import { PAYLOAD_API_URL } from '@/config'
import { supabaseAdmin } from '../supabase'

export interface MenuItemType {
  id: string
  title: string
  label?: string
  type: 'page' | 'custom' | 'external'
  url?: string
  href?: string
  icon?: string
  badge?: string
  sortOrder: number
  isActive: boolean
  openInNewTab?: boolean
  description?: string
  menu?: string
  children?: MenuItemType[]
  metadata?: Record<string, any>
}

export interface HeaderMenuConfig {
  id: string
  menuItems: MenuItemType[]
  enableSearch: boolean
  enableUserMenu: boolean
  logoUrl?: string
  backgroundColor?: string
  sticky: boolean
}

export interface FooterSectionType {
  title: string
  links: MenuItemType[]
  sortOrder: number
}

export interface FooterMenuConfig {
  id: string
  menuItems: MenuItemType[]
  sections: FooterSectionType[]
  companyInfo?: {
    name: string
    description: string
    email: string
    phone: string
    address: string
  }
  socialLinks?: Array<{
    platform: string
    url: string
  }>
  copyrightText: string
  backgroundColor?: string
}

/**
 * Build menu item URL based on type
 */
function buildMenuUrl(item: any): string {
  switch (item.type) {
    case 'page':
      if (item.pageLink?.slug) {
        return `/${item.pageLink.slug}`
      }
      return '#'
    case 'custom':
      return item.customUrl || '#'
    case 'external':
      return item.externalUrl || '#'
    default:
      return '#'
  }
}

/**
 * Transform menu item from Payload CMS format to frontend format
 */
function transformMenuItem(item: any): MenuItemType {
  return {
    id: item.id,
    title: item.title,
    label: item.label || item.title,
    type: item.type,
    url: buildMenuUrl(item),
    href: buildMenuUrl(item),
    icon: item.icon,
    badge: item.badge,
    sortOrder: item.sortOrder || 0,
    isActive: item.isActive !== false,
    openInNewTab: item.openInNewTab || false,
    description: item.description,
    metadata: item.metadata,
  }
}

/**
 * Fetch header menu configuration from Supabase
 */
export async function getHeaderMenu(): Promise<HeaderMenuConfig | null> {
  try {
    // Fetch header menu items with hierarchical structure
    const menuItems = await getMenuItemsWithHierarchy('header')

    return {
      id: 'header-menu',
      menuItems,
      enableSearch: true,
      enableUserMenu: false,
      logoUrl: undefined,
      backgroundColor: undefined,
      sticky: true,
    }
  } catch (error) {
    console.error('Error fetching header menu:', error)
    return null
  }
}

/**
 * Fetch footer menu configuration from Supabase
 */
export async function getFooterMenu(): Promise<FooterMenuConfig | null> {
  try {
    // Fetch all footer menu items from database
    const allFooterItems = await getMenuItemsFromDB('footer')

    // Organize items into sections based on metadata.section field
    const sectionMap: Record<string, MenuItemType[]> = {}
    const defaultSectionItems: MenuItemType[] = []

    allFooterItems.forEach((item) => {
      // Skip items with parent_menu_id (those are part of a submenu)
      if (item.metadata?.parentMenuId) {
        return
      }

      const sectionName = item.metadata?.section
      if (sectionName) {
        if (!sectionMap[sectionName]) {
          sectionMap[sectionName] = []
        }
        sectionMap[sectionName].push(item)
      } else {
        defaultSectionItems.push(item)
      }
    })

    // Build sections array with proper sort order
    const sections: FooterSectionType[] = []
    const sectionEntries = Object.entries(sectionMap)

    // Add named sections
    sectionEntries.forEach(([title, items], index) => {
      sections.push({
        title,
        links: items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        sortOrder: index,
      })
    })

    // Add default section if there are items without section
    if (defaultSectionItems.length > 0) {
      sections.push({
        title: 'Links',
        links: defaultSectionItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        sortOrder: sections.length,
      })
    }

    return {
      id: 'footer-menu',
      menuItems: allFooterItems,
      sections,
      companyInfo: undefined,
      socialLinks: [],
      copyrightText: '© {year} All rights reserved.',
      backgroundColor: 'bg-gray-900',
    }
  } catch (error) {
    console.error('Error fetching footer menu:', error)
    return null
  }
}

/**
 * Fetch menu items by menu type
 */
export async function fetchMenuItems(
  menuType: 'header' | 'footer' | 'header_submenu',
): Promise<MenuItemType[]> {
  try {
    const response = await fetch(
      `${PAYLOAD_API_URL}/menuItems?where[menu][equals]=${menuType}&limit=999&sort=-isActive,sortOrder`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      console.warn(`Failed to fetch ${menuType} menu items:`, response.statusText)
      return []
    }

    const data = await response.json()
    const items = data.docs || []

    // Transform and sort items
    return items
      .filter((item: any) => item.isActive !== false)
      .map((item: any) => transformMenuItem(item))
      .sort((a: MenuItemType, b: MenuItemType) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error(`Error fetching ${menuType} menu items:`, error)
    return []
  }
}

/**
 * Fetch a single menu item by ID
 */
export async function getMenuItem(id: string): Promise<MenuItemType | null> {
  try {
    const response = await fetch(`${PAYLOAD_API_URL}/menuItems/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return transformMenuItem(data)
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return null
  }
}

/**
 * Fetch menu items with their children/submenus
 */
export async function getMenuItemsWithChildren(
  menuType: 'header' | 'footer' | 'header_submenu',
): Promise<MenuItemType[]> {
  try {
    const items = await fetchMenuItems(menuType)

    // Build parent-child relationships
    const itemsMap = new Map<string, MenuItemType>()
    const parentItems: MenuItemType[] = []

    // First pass: create map of all items
    items.forEach((item) => {
      itemsMap.set(item.id, { ...item, children: [] })
    })

    // Second pass: organize hierarchy
    items.forEach((item) => {
      const mapItem = itemsMap.get(item.id)!
      if (item.metadata?.parentId) {
        const parent = itemsMap.get(item.metadata.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(mapItem)
        }
      } else {
        parentItems.push(mapItem)
      }
    })

    return parentItems.sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error('Error fetching menu items with children:', error)
    return []
  }
}

/**
 * Get combined menu configuration (header + footer)
 */
export async function getMenusConfiguration(): Promise<{
  header: HeaderMenuConfig | null
  footer: FooterMenuConfig | null
}> {
  const [header, footer] = await Promise.all([getHeaderMenu(), getFooterMenu()])

  return { header, footer }
}

/**
 * DATABASE CRUD OPERATIONS
 * Fetch menu items from Supabase database
 */

/**
 * Get all menu items from database
 */
export async function getMenuItemsFromDB(menu?: string): Promise<MenuItemType[]> {
  try {
    let query = supabaseAdmin
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true })

    if (menu) {
      query = query.eq('menu', menu)
    }

    const { data, error } = await query

    if (error) {
      console.error('[MenuAPI] Error fetching menu items:', error)
      return []
    }

    return (data || []).map((item) => {
      // Determine URL based on type
      let url = ''
      if (item.type === 'custom' && item.custom_url) {
        url = item.custom_url
      } else if (item.type === 'external' && item.external_url) {
        url = item.external_url
      } else if (item.type === 'page' && item.page_link_id) {
        url = `/page/${item.page_link_id}`
      }

      return {
        id: item.id,
        title: item.title,
        label: item.label || item.title,
        type: item.type,
        url: url,
        href: url,
        icon: item.icon,
        badge: item.badge,
        sortOrder: item.sort_order || 0,
        isActive: item.is_active !== false,
        openInNewTab: item.open_in_new_tab || false,
        description: item.description,
        menu: item.menu,
        metadata: item.metadata,
      }
    })
  } catch (error) {
    console.error('Error in getMenuItemsFromDB:', error)
    return []
  }
}

/**
 * Get menu items with hierarchical children structure
 */
export async function getMenuItemsWithHierarchy(menu?: string): Promise<MenuItemType[]> {
  try {
    // Get all items
    const allItems = await getMenuItemsFromDB(menu)

    // Build hierarchy
    const itemsMap = new Map<string, MenuItemType>()
    const topLevelItems: MenuItemType[] = []

    // First pass: create a map of all items
    allItems.forEach((item) => {
      itemsMap.set(item.id, { ...item, children: [] })
    })

    // Second pass: organize hierarchy
    allItems.forEach((item) => {
      const mapItem = itemsMap.get(item.id)!
      const parentId = item.metadata?.parentMenuId

      if (parentId) {
        // This is a submenu item
        const parent = itemsMap.get(parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(mapItem)
        }
      } else {
        // This is a top-level item
        topLevelItems.push(mapItem)
      }
    })

    // Sort children by sort order
    topLevelItems.forEach((item) => {
      if (item.children) {
        item.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      }
    })

    return topLevelItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  } catch (error) {
    console.error('Error building menu hierarchy:', error)
    return []
  }
}

/**
 * Get single menu item from database
 */
export async function getMenuItemFromDB(id: string): Promise<MenuItemType | null> {
  try {
    const { data, error } = await supabaseAdmin.from('menu_items').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching menu item:', error)
      return null
    }

    if (!data) return null

    // Determine URL based on type
    let url = ''
    if (data.type === 'custom' && data.custom_url) {
      url = data.custom_url
    } else if (data.type === 'external' && data.external_url) {
      url = data.external_url
    } else if (data.type === 'page' && data.page_link_id) {
      url = `/page/${data.page_link_id}`
    }

    return {
      id: data.id,
      title: data.title,
      label: data.label || data.title,
      type: data.type,
      url: url,
      href: url,
      icon: data.icon,
      badge: data.badge,
      sortOrder: data.sort_order || 0,
      isActive: data.is_active !== false,
      openInNewTab: data.open_in_new_tab || false,
      description: data.description,
      metadata: data.metadata,
    }
  } catch (error) {
    console.error('Error in getMenuItemFromDB:', error)
    return null
  }
}

/**
 * Create menu item in database
 */
export async function createMenuItemInDB(
  item: Omit<MenuItemType, 'id'>,
): Promise<MenuItemType | null> {
  try {
    // Determine menu type from metadata, fallback to 'header'
    const menuType = (item.metadata?.menuType as string) || 'header'

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        title: item.title,
        menu: menuType,
        type: item.type,
        custom_url: item.type === 'custom' ? item.url || item.href || '' : null,
        external_url: item.type === 'external' ? item.url || item.href || '' : null,
        label: item.label || item.title,
        icon: item.icon,
        badge: item.badge,
        sort_order: item.sortOrder || 0,
        is_active: item.isActive !== false,
        open_in_new_tab: item.openInNewTab || false,
        description: item.description,
        metadata: item.metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('[MenuAPI] Error creating menu item:', error)
      return null
    }

    if (!data) {
      return null
    }

    // Determine URL based on type
    let url = ''
    if (data.type === 'custom' && data.custom_url) {
      url = data.custom_url
    } else if (data.type === 'external' && data.external_url) {
      url = data.external_url
    } else if (data.type === 'page' && data.page_link_id) {
      url = `/page/${data.page_link_id}`
    }

    return {
      id: data.id,
      title: data.title,
      label: data.label || data.title,
      type: data.type,
      url: url,
      href: url,
      icon: data.icon,
      badge: data.badge,
      sortOrder: data.sort_order || 0,
      isActive: data.is_active !== false,
      openInNewTab: data.open_in_new_tab || false,
      description: data.description,
      metadata: data.metadata,
    }
  } catch (error) {
    console.error('Error in createMenuItemInDB:', error)
    return null
  }
}

/**
 * Update menu item in database
 */
export async function updateMenuItemInDB(
  id: string,
  updates: Partial<MenuItemType>,
): Promise<MenuItemType | null> {
  try {
    const updateObj: any = {}

    if (updates.title) updateObj.title = updates.title
    if (updates.type) updateObj.type = updates.type
    if (updates.label) updateObj.label = updates.label
    if (updates.icon) updateObj.icon = updates.icon
    if (updates.badge) updateObj.badge = updates.badge
    if (updates.sortOrder !== undefined) updateObj.sort_order = updates.sortOrder
    if (updates.isActive !== undefined) updateObj.is_active = updates.isActive
    if (updates.openInNewTab !== undefined) updateObj.open_in_new_tab = updates.openInNewTab
    if (updates.description) updateObj.description = updates.description

    // Handle menu field - can come from updates.menu or updates.metadata.menu
    if (updates.menu) {
      updateObj.menu = updates.menu
    }

    if (updates.metadata) {
      updateObj.metadata = updates.metadata
      // Update menu field if menuType is in metadata (overrides updates.menu if both present)
      if (updates.metadata.menu) {
        updateObj.menu = updates.metadata.menu
      }
    }

    // Handle URL based on type
    if (updates.type === 'custom' && (updates.url || updates.href)) {
      updateObj.custom_url = updates.url || updates.href
      updateObj.external_url = null
    } else if (updates.type === 'external' && (updates.url || updates.href)) {
      updateObj.external_url = updates.url || updates.href
      updateObj.custom_url = null
    }

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[MenuAPI] Error updating menu item:', error)
      return null
    }

    if (!data) {
      return null
    }

    // Determine URL based on type
    let url = ''
    if (data.type === 'custom' && data.custom_url) {
      url = data.custom_url
    } else if (data.type === 'external' && data.external_url) {
      url = data.external_url
    } else if (data.type === 'page' && data.page_link_id) {
      url = `/page/${data.page_link_id}`
    }

    return {
      id: data.id,
      title: data.title,
      label: data.label || data.title,
      type: data.type,
      url: url,
      href: url,
      icon: data.icon,
      badge: data.badge,
      sortOrder: data.sort_order || 0,
      isActive: data.is_active !== false,
      openInNewTab: data.open_in_new_tab || false,
      description: data.description,
      menu: data.menu,
      metadata: data.metadata,
    }
  } catch (error) {
    console.error('Error in updateMenuItemInDB:', error)
    return null
  }
}

/**
 * Delete menu item from database
 */
export async function deleteMenuItemFromDB(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('menu_items').delete().eq('id', id)

    if (error) {
      console.error('[MenuAPI] Error deleting menu item:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteMenuItemFromDB:', error)
    return false
  }
}
