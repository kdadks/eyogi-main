'use client'

/**
 * Admin Sidebar Navigation
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/utilities/cn'
import { LayoutDashboard, FileText, Image, Settings, BookOpen, LogOut } from 'lucide-react'

const MENU_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/posts', icon: FileText, label: 'Posts' },
  { href: '/admin/pages', icon: FileText, label: 'Pages' },
  { href: '/admin/media', icon: Image, label: 'Media' },
  { href: '/admin/categories', icon: FileText, label: 'Categories' },
  { href: '/admin/settings', icon: Settings, label: 'Settings', admin: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to login page
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('Error logging out')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 text-white overflow-y-auto border-r border-slate-800">
      <nav className="space-y-2 px-4 py-6">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}

        <div className="pt-6 mt-6 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
