/**
 * Admin Layout Wrapper
 */

import React from 'react'
import { AdminSidebar } from './Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-white">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 overflow-auto bg-white pt-6 px-8 pb-8">{children}</main>
      </div>
    </div>
  )
}
