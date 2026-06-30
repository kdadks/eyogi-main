import { lazy, Suspense, Component, ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import SiteLayout from './components/SiteLayout'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import { DonationModalProvider } from './contexts/DonationModalContext'
import { MembershipModalProvider } from './contexts/MembershipModalContext'
import { SiteSettingsProvider } from './contexts/SiteSettingsContext'
import MembershipModal from './components/Membership/MembershipModal'
import DonationModal from './components/DonationModal/DonationModal'

// Website pages
const HomePage = lazy(() => import('./pages/HomePage'))
const HinduismPage = lazy(() => import('./pages/HinduismPage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const MembershipPage = lazy(() => import('./pages/MembershipPage'))
const MembershipConfirmation = lazy(() => import('./pages/MembershipConfirmation'))
const PaymentReturn = lazy(() => import('./pages/PaymentReturn'))
const DonationPage = lazy(() => import('./pages/DonationPage'))
const DonationSuccessPage = lazy(() => import('./pages/DonationSuccessPage'))
const FormsPage = lazy(() => import('./pages/FormsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'))
const AdminPagesList = lazy(() => import('./pages/admin/AdminPagesList'))
const AdminPageEditor = lazy(() => import('./pages/admin/AdminPageEditor'))
const AdminMemberships = lazy(() => import('./pages/admin/AdminMemberships'))
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminPaymentSettings = lazy(() => import('./pages/admin/PaymentSettings'))

// CMS Admin pages
const AdminCMS = lazy(() => import('./pages/admin/AdminCMS'))
const CMSEditor = lazy(() => import('./pages/admin/CMSEditor'))
const PostEditor = lazy(() => import('./pages/admin/PostEditor'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))

// Member Portal pages
const MemberLoginPage = lazy(() => import('./pages/members/MemberLoginPage'))
const SetPasswordPage = lazy(() => import('./pages/members/SetPasswordPage'))
const MemberPortalDashboard = lazy(() => import('./pages/members/portal/MemberPortalDashboard'))
const MemberProtectedRoute = lazy(() => import('./components/members/MemberProtectedRoute'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

function withAdminProtection(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminProtectedRoute>
        <Component />
      </AdminProtectedRoute>
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
      { path: '/hinduism/:slug', element: withSuspense(PostDetailPage) },
      { path: '/about', element: withSuspense(AboutPage) },
      { path: '/faq', element: withSuspense(FAQPage) },
      { path: '/membership', element: withSuspense(MembershipPage) },
      { path: '/membership/confirmation', element: withSuspense(MembershipConfirmation) },
      { path: '/payment-return', element: withSuspense(PaymentReturn) },
      { path: '/donation', element: withSuspense(DonationPage) },
      { path: '/donation/success', element: withSuspense(DonationSuccessPage) },
      { path: '/forms', element: withSuspense(FormsPage) },
      { path: '/contact', element: withSuspense(ContactPage) },
    ],
  },
  // Admin routes - protected and NOT children of SiteLayout
  { path: '/admin/login', element: withSuspense(LoginPage) },
  { path: '/admin', element: withAdminProtection(AdminDashboard) },
  { path: '/admin/posts', element: withAdminProtection(AdminPosts) },
  { path: '/admin/pages', element: withAdminProtection(AdminPagesList) },
  { path: '/admin/pages/:slug', element: withAdminProtection(AdminPageEditor) },
  { path: '/admin/donations', element: withAdminProtection(AdminDonations) },
  { path: '/admin/memberships', element: withAdminProtection(AdminMemberships) },
  { path: '/admin/categories', element: withAdminProtection(AdminCategories) },
  { path: '/admin/settings', element: withAdminProtection(AdminSettings) },
  { path: '/admin/payment-settings', element: withAdminProtection(AdminPaymentSettings) },
  { path: '/admin/posts/new', element: withAdminProtection(PostEditor) },
  { path: '/admin/posts/:id/edit', element: withAdminProtection(PostEditor) },
  { path: '/admin/media', element: withAdminProtection(AdminMedia) },

  // CMS Admin routes
  { path: '/admin/cms', element: withAdminProtection(AdminCMS) },
  { path: '/admin/cms/editor/:id', element: withAdminProtection(CMSEditor) },
  { path: '/admin/cms/editor', element: withAdminProtection(CMSEditor) },
  
  // Member Portal routes
  { path: '/members/login', element: withSuspense(MemberLoginPage) },
  { path: '/members/set-password', element: withSuspense(SetPasswordPage) },
  { 
    path: '/members/portal', 
    element: (
      <Suspense fallback={<PageLoader />}>
        <MemberProtectedRoute>
          <MemberPortalDashboard />
        </MemberProtectedRoute>
      </Suspense>
    )
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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </MembershipModalProvider>
        </DonationModalProvider>
      </SiteSettingsProvider>
    </ErrorBoundary>
  )
}
