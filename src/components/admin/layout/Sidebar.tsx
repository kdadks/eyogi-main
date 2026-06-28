
import React from 'react'
import { cn } from '@/utilities/cn'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Image,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  {
    label: 'Content',
    href: '#',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { label: 'Pages', href: '/admin/pages', icon: null },
      { label: 'Posts', href: '/admin/posts', icon: null },
      { label: 'Categories', href: '/admin/categories', icon: null },
    ],
  },
  { label: 'Media', href: '/admin/media', icon: <Image className="w-5 h-5" /> },
  { label: 'Memberships', href: '/admin/memberships', icon: <Users className="w-5 h-5" />, badge: 'NEW' },
  { label: 'Donations', href: '/admin/donations', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" />, admin: true },
]

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onToggle: () => void
  onCollapse: () => void
}

export function Sidebar({ isOpen, isCollapsed, onToggle, onCollapse }: SidebarProps) {
  const { pathname } = useLocation()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const toggleSubmenu = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    )
  }

  const isItemActive = (href: string): boolean => {
    if (href === '#') return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-neutral-900 text-white transition-all duration-300 z-40',
          'flex flex-col border-r border-neutral-800',
          isCollapsed ? 'w-20' : 'w-64',
          !isOpen && 'lg:translate-x-0 -translate-x-full',
        )}
      >
        {/* Logo */}
        <div className={cn('p-4 border-b border-neutral-800 flex items-center justify-between')}>
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-white">eYogi</h1>
          )}
          <button
            onClick={onCollapse}
            className="p-1.5 hover:bg-neutral-800 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.label)

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      'text-neutral-300 hover:bg-neutral-800 hover:text-white',
                      isExpanded && 'bg-neutral-800 text-white',
                    )}
                    title={isCollapsed ? item.label : ''}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                      isActive
                        ? 'bg-secondary-500 text-white'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
                    )}
                    title={isCollapsed ? item.label : ''}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-secondary-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-neutral-700 pl-3">
                    {item.children?.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        className={cn(
                          'block px-3 py-2 rounded text-sm transition-colors',
                          isItemActive(child.href)
                            ? 'bg-secondary-500 text-white'
                            : 'text-neutral-400 hover:text-neutral-200',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-neutral-800">
          <button
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'text-neutral-300 hover:bg-neutral-800 hover:text-white text-sm font-medium',
            )}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button for mobile */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 lg:hidden z-50 p-3 bg-secondary-500 text-white rounded-full shadow-lg hover:bg-secondary-600 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}
