import { createContext, useContext, useState, ReactNode } from 'react'

interface MembershipModalContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const MembershipModalContext = createContext<MembershipModalContextType | undefined>(undefined)

export function MembershipModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <MembershipModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </MembershipModalContext.Provider>
  )
}

export function useMembershipModal() {
  const context = useContext(MembershipModalContext)
  if (context === undefined) {
    throw new Error('useMembershipModal must be used within a MembershipModalProvider')
  }
  return context
}
