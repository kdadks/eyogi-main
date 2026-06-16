import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeaderNew'
import EncryptionStatusBanner from './EncryptionStatusBanner'
import { RefreshProvider } from '../../contexts/RefreshContext'

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <RefreshProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Encryption Status Warning */}
        <EncryptionStatusBanner />

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
    </RefreshProvider>
  )
}
export default AdminLayout
