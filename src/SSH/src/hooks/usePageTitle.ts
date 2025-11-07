import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

interface RouteTitle {
  path: string
  title: string
}

const routeTitles: RouteTitle[] = [
  { path: '/admin', title: 'Dashboard' },
  { path: '/admin/dashboard', title: 'Dashboard' },
  { path: '/admin/users', title: 'User Management' },
  { path: '/admin/students', title: 'Student Management' },
  { path: '/admin/teachers', title: 'Teacher Management' },
  { path: '/admin/courses', title: 'Course Management' },
  { path: '/admin/course-assignments', title: 'Course Assignment Management' },
  { path: '/admin/enrollments', title: 'Enrollment Management' },
  { path: '/admin/certificates', title: 'Certificate Management' },
  { path: '/admin/content', title: 'Content Management' },
  { path: '/admin/batches', title: 'Batch Management' },
  { path: '/admin/analytics', title: 'Analytics' },
  { path: '/admin/permissions', title: 'Permission Management' },
  { path: '/admin/settings', title: 'System Settings' },
  { path: '/admin/assignments', title: 'Course Assignment Management' },
  { path: '/admin/gurukuls', title: 'Gurukul Management' },
  { path: '/admin/media', title: 'Media Management' },
  { path: '/admin/compliance', title: 'Compliance Management' },
  { path: '/admin/invoice', title: 'Invoice Management' },
  { path: '/admin/payment', title: 'Payment Management' },
]

export const usePageTitle = () => {
  const location = useLocation()

  const pageTitle = useMemo(() => {
    const currentPath = location.pathname

    // Find exact match first
    const exactMatch = routeTitles.find((route) => route.path === currentPath)
    if (exactMatch) {
      return exactMatch.title
    }

    // Find partial match for nested routes
    const partialMatch = routeTitles.find(
      (route) => currentPath.startsWith(route.path) && route.path !== '/admin',
    )
    if (partialMatch) {
      return partialMatch.title
    }

    // Default fallback
    return 'Dashboard'
  }, [location.pathname])

  const fullTitle = `eYogi Gurukul Admin - ${pageTitle}`

  return {
    pageTitle,
    fullTitle,
    baseName: 'eYogi Gurukul Admin',
  }
}
