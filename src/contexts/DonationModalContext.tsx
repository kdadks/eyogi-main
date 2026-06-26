import { createContext, useContext, useState, ReactNode } from 'react'

interface DonationModalContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const DonationModalContext = createContext<DonationModalContextType | undefined>(undefined)

export function DonationModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <DonationModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </DonationModalContext.Provider>
  )
}

export function useDonationModal() {
  const context = useContext(DonationModalContext)
  if (context === undefined) {
    throw new Error('useDonationModal must be used within a DonationModalProvider')
  }
  return context
}
