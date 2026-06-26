import { useLocation } from 'react-router-dom'
import { Navbar } from '@/Header/Component'
import Footer from '@/Footer/Component'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && <Navbar />}
      <div className={!isAdminRoute ? 'pt-20 min-h-screen' : 'min-h-screen'}>
        {children}
      </div>
      {!isAdminRoute && <Footer />}
    </div>
  )
}
