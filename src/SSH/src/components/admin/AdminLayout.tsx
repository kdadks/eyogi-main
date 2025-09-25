import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeaderNew'
const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default AdminLayout
