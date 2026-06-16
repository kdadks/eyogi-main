/**
 * Admin Layout
 */

import { AdminLayout } from '@/components/admin/Layout'
import { ReactNode } from 'react'

// Force dynamic rendering - no prerendering for admin dashboard
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
