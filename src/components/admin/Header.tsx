'use client'

/**
 * Admin Header
 */

import { useRouter } from 'next/navigation'
import { Bell, User, ChevronDown } from 'lucide-react'

export function AdminHeader() {
  const router = useRouter()

  return (
    <header className="fixed top-0 right-0 left-0 h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-40">
      {/* Left side - Search */}
      <div className="flex-1 flex items-center gap-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">Admin</span>
            <span className="text-xs text-slate-500">Administrator</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  )
}
