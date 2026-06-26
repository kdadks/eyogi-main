import { Outlet } from 'react-router-dom'
import { Navbar } from '@/Header/Component'
import Footer from '@/Footer/Component'
import DonationModal from '@/components/DonationModal/DonationModal'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
      <DonationModal />
      <WhatsAppButton />
    </div>
  )
}
