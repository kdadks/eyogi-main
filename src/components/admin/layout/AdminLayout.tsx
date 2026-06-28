
import React from 'react'
import { cn } from '@/utilities/cn'
import { Sidebar } from './Sidebar'
import { AdminHeader } from './Header'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  onSearch?: (query: string) => void
  actions?: React.ReactNode
}

export function AdminLayout({
  children,
  title,
  breadcrumbs,
  onSearch,
  actions,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  // Close sidebar on navigation (small screens)
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [])

  return (
    <div className="h-screen bg-neutral-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300 flex flex-col h-screen',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
        )}
      >
        {/* Header */}
        <AdminHeader title={title} breadcrumbs={breadcrumbs} onSearch={onSearch} actions={actions} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
