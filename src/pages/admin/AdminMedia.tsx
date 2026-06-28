import { AdminLayout } from '@/components/admin'
import { MediaLibrary } from '@/components/admin/media/MediaLibrary'

export default function AdminMedia() {
  return (
    <AdminLayout
      title="Media Library"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Media' }]}
    >
      <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[70vh]">
        <MediaLibrary mode="manage" />
      </div>
    </AdminLayout>
  )
}
