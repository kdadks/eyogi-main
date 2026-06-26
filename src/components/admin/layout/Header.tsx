
import React from 'react'
import { cn } from '@/utilities/cn'
import { Bell, User, LogOut, Search } from 'lucide-react'

interface HeaderProps {
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  onSearch?: (query: string) => void
}

export function AdminHeader({ title, breadcrumbs, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Left side - Title and breadcrumbs */}
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-neutral-600 mt-1">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-neutral-400">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-neutral-900">
                      {crumb.label}
                    </a>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right side - Search and actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg border border-neutral-200 flex-1 min-w-48">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
              className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder-neutral-500"
            />
          </div>

          {/* Notifications */}
          <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-neutral-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-neutral-900">Admin User</p>
              <p className="text-xs text-neutral-500">Administrator</p>
            </div>
            <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <User className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
