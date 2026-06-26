import { lazy, Suspense, Component, ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { DonationModalProvider } from './contexts/DonationModalContext'
import { MembershipModalProvider } from './contexts/MembershipModalContext'
import { SiteSettingsProvider } from './contexts/SiteSettingsContext'
import MembershipModal from './components/Membership/MembershipModal'
import DonationModal from './components/DonationModal/DonationModal'

// Website pages
const HomePage = lazy(() => import('./pages/HomePage'))
const HinduismPage = lazy(() => import('./pages/HinduismPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const MembershipPage = lazy(() => import('./pages/MembershipPage'))
const MembershipConfirmation = lazy(() => import('./pages/MembershipConfirmation'))
const FormsPage = lazy(() => import('./pages/FormsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'))
const AdminPages = lazy(() => import('./pages/admin/AdminPages'))
const AdminMemberships = lazy(() => import('./pages/admin/AdminMemberships'))
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType, layoutType: 'default' | 'admin' = 'default', props?: any) {
  if (layoutType === 'admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminLayout {...props}>
          <Component />
        </AdminLayout>
      </Suspense>
    )
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// Error boundary for catching render errors
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <p className="text-red-600 font-medium">Something went wrong loading this page.</p>
          <pre className="text-xs text-stone-500 max-w-lg overflow-auto">{String(this.state.error)}</pre>
          <button
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: withSuspense(HomePage) },
      { path: '/hinduism', element: withSuspense(HinduismPage) },
      { path: '/about', element: withSuspense(AboutPage) },
      { path: '/faq', element: withSuspense(FAQPage) },
      { path: '/membership', element: withSuspense(MembershipPage) },
      { path: '/membership/confirmation', element: withSuspense(MembershipConfirmation) },
      { path: '/forms', element: withSuspense(FormsPage) },
      { path: '/contact', element: withSuspense(ContactPage) },
    ],
  },
  { path: '/auth/login', element: withSuspense(LoginPage) },
  
  // Admin routes - NOT children of SiteLayout
  { 
    path: '/admin', 
    element: withSuspense(AdminDashboard, 'admin', { title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }] }) 
  },
  { 
    path: '/admin/posts', 
    element: withSuspense(AdminPosts, 'admin', { title: 'Posts', breadcrumbs: [{ label: 'Dashboard', href: '/admin' }, { label: 'Posts' }] }) 
  },
  { 
    path: '/admin/pages', 
    element: withSuspense(AdminPages, 'admin', { title: 'Pages', breadcrumbs: [{ label: 'Dashboard', href: '/admin' }, { label: 'Pages' }] }) 
  },
  { 
    path: '/admin/donations', 
    element: withSuspense(AdminDonations, 'admin', { title: 'Donations', breadcrumbs: [{ label: 'Dashboard', href: '/admin' }, { label: 'Donations' }] }) 
  },
  { 
    path: '/admin/memberships', 
    element: withSuspense(AdminMemberships, 'admin', { title: 'Memberships', breadcrumbs: [{ label: 'Dashboard', href: '/admin' }, { label: 'Memberships' }] }) 
  },
  { 
    path: '/admin/categories', 
    element: withSuspense(AdminCategories, 'admin', { title: 'Categories', breadcrumbs: [{ label: 'Dashboard', href: '/admin' }, { label: 'Categories' }] }) 
  },
  { 
    path: '/admin/settings', 
    element: withSuspense(AdminSettings, 'admin', { title: 'Settings', breadcrumbs: [{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }] }) 
  },
  { 
    path: '*', 
    element: (
      <SiteLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <h1 className="text-4xl font-bold text-red-600">404 - Page Not Found</h1>
          <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          <a href="/" className="px-4 py-2 bg-amber-600 text-white rounded-lg">
            Go Home
          </a>
        </div>
      </SiteLayout>
    ) 
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <SiteSettingsProvider>
        <DonationModalProvider>
          <MembershipModalProvider>
            <RouterProvider router={router} />
            <MembershipModal />
            <DonationModal />
          </MembershipModalProvider>
        </DonationModalProvider>
      </SiteSettingsProvider>
    </ErrorBoundary>
  )
}
