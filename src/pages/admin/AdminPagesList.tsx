import { useNavigate } from 'react-router-dom'
import { FileText, Edit, Globe, HelpCircle, Users, Mail, Heart, BookOpen } from 'lucide-react'
import { AdminLayout } from '@/components/admin'

const PAGES = [
  { slug: 'home', label: 'Home', description: 'Hero, Mission, Story, Courses sections', icon: Globe, route: '/' },
  { slug: 'about', label: 'About', description: 'Hero, Mission, Approach, History, Values', icon: Users, route: '/about' },
  { slug: 'faq', label: 'FAQ', description: 'Hero text and all FAQ items', icon: HelpCircle, route: '/faq' },
  { slug: 'membership', label: 'Membership', description: 'Hero, Benefits, Features, CTA', icon: BookOpen, route: '/membership' },
  { slug: 'contact', label: 'Contact', description: 'Heading, email address, body text', icon: Mail, route: '/contact' },
  { slug: 'donation', label: 'Donation', description: 'Hero, bank details, impact levels', icon: Heart, route: '/donation' },
]

export default function AdminPagesList() {
  const navigate = useNavigate()

  return (
    <AdminLayout
      title="Pages"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Pages' },
      ]}
    >
      <div className="mb-6">
        <p className="text-stone-500 text-sm">
          Click a page to open the inline editor. Changes are saved to the CMS and reflected on the public site immediately after publishing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PAGES.map(({ slug, label, description, icon: Icon, route }) => (
          <div
            key={slug}
            className="group bg-white border-2 border-stone-200 hover:border-orange-300 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-orange-50"
            onClick={() => navigate(`/admin/pages/${slug}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-orange-600" />
              </div>
              <a
                href={route}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-orange-600 transition-colors px-2 py-1 rounded-md hover:bg-orange-50"
                title="View public page"
              >
                <Globe className="w-3.5 h-3.5" />
                View live
              </a>
            </div>

            <h3 className="font-semibold text-stone-900 text-lg mb-1 group-hover:text-orange-700 transition-colors">
              {label}
            </h3>
            <p className="text-stone-500 text-sm mb-5">{description}</p>

            <button className="flex items-center gap-2 text-sm font-semibold text-orange-600 group-hover:gap-3 transition-all duration-200">
              <Edit className="w-4 h-4" />
              Edit Page
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">First-time setup</p>
            <p className="text-sm text-amber-800">
              If sections appear empty, run <code className="font-mono bg-amber-100 px-1 rounded">migrations/seed_actual_page_content.sql</code> in your Supabase SQL editor to populate all pages with their current content.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
