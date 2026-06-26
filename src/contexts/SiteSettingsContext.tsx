import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SiteSettings {
  whatsappPhone: string | null
}

const SiteSettingsContext = createContext<SiteSettings>({ whatsappPhone: null })

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_phone')
      .single()
      .then(({ data }) => {
        if (data?.value) setWhatsappPhone(data.value)
      })
  }, [])

  return (
    <SiteSettingsContext.Provider value={{ whatsappPhone }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
