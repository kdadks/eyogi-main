import { createContext, useContext, useState, ReactNode } from 'react'

interface EditingContextValue {
  isEditing: boolean
  activeSection: string | null
  openDrawer: (sectionKey: string) => void
  closeDrawer: () => void
}

const EditingContext = createContext<EditingContextValue>({
  isEditing: false,
  activeSection: null,
  openDrawer: () => {},
  closeDrawer: () => {},
})

export function EditingProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <EditingContext.Provider
      value={{
        isEditing: true,
        activeSection,
        openDrawer: setActiveSection,
        closeDrawer: () => setActiveSection(null),
      }}
    >
      {children}
    </EditingContext.Provider>
  )
}

export const useEditing = () => useContext(EditingContext)
