
// ============================================
// ADMIN DASHBOARD LAYOUT & STRUCTURE
// ============================================

import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

export interface AdminMenuItem {
  label: string
  href: string
  icon: string
  badge?: string | number
  children?: AdminMenuItem[]
}

export const adminMenuItems: AdminMenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  {
    label: 'Content',
    href: '#',
    icon: '📝',
    children: [
      { label: 'CMS', href: '/admin/cms', icon: '🎨', badge: 'NEW' },
      { label: 'Pages', href: '/admin/pages', icon: '📄' },
      { label: 'Posts', href: '/admin/posts', icon: '📰' },
      { label: 'Categories', href: '/admin/categories', icon: '🏷️' },
    ],
  },
  {
    label: 'Forms',
    href: '/admin/forms',
    icon: '📋',
    children: [
      { label: 'Form Manager', href: '/admin/forms', icon: '⚙️' },
      { label: 'Submissions', href: '/admin/forms/submissions', icon: '📮' },
    ],
  },
  { label: 'Memberships', href: '/admin/memberships', icon: '🎫', badge: 'NEW' },
  { label: 'Navigation', href: '/admin/menus', icon: '🔗' },
  { label: 'Donations', href: '/admin/donations', icon: '💰' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
  { label: 'Payment Settings', href: '/admin/payment-settings', icon: '💳', badge: 'NEW' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
  onSearch?: (value: string) => void
}

export function AdminLayout({ children, title, breadcrumbs, actions }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
        toast.error('Error logging out: ' + error.message)
        return
      }

      // Redirect to home page
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error logging out')
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 overflow-y-auto`}
      >
        <div className="p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-left hover:bg-gray-800 p-2 rounded"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        <nav className="space-y-2 px-2">
          {adminMenuItems.map((item) => (
            <NavItem key={item.href} item={item} isOpen={sidebarOpen} pathname={pathname} />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              {breadcrumbs && (
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-gray-400">/</span>}
                      {crumb.href ? (
                        <Link to={crumb.href} className="hover:text-gray-900">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-gray-900">{crumb.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
              <div className="flex items-center gap-4">
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">🔔</button>
              <button className="text-gray-600 hover:text-gray-900">⚙️</button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  )
}

interface NavItemProps {
  item: AdminMenuItem
  isOpen: boolean
  pathname: string
}

function NavItem({ item, isOpen, pathname }: NavItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isActive = pathname === item.href || (item.href !== '#' && pathname.startsWith(item.href))
  const hasChildren = item.children && item.children.length > 0

  // Render as Link if no children
  if (!hasChildren && item.href !== '#') {
    return (
      <Link
        to={item.href}
        className={`flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition-colors no-underline ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
        }`}
      >
        <span className="text-lg flex-shrink-0">{item.icon}</span>
        {isOpen && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="bg-red-600 text-white text-xs rounded-full px-2">{item.badge}</span>
            )}
          </>
        )}
      </Link>
    )
  }

  // Render as button if has children or href is #
  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
          isActive && !hasChildren ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
        }`}
      >
        <span className="text-lg flex-shrink-0">{item.icon}</span>
        {isOpen && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {hasChildren && (
              <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            )}
            {item.badge && (
              <span className="bg-red-600 text-white text-xs rounded-full px-2">{item.badge}</span>
            )}
          </>
        )}
      </button>

      {hasChildren && isOpen && expanded && (
        <div className="pl-8 space-y-1 mt-1">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors no-underline ${
                pathname === child.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              <span>{child.icon}</span>
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// ADMIN PAGE COMPONENTS
// ============================================

interface TableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  loading?: boolean
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  loading,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                No data found
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
