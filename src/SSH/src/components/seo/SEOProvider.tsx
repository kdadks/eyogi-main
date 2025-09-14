import React from 'react'

interface SEOProviderProps {
  children: React.ReactNode
}

export default function SEOProvider({ children }: SEOProviderProps) {
  return <>{children}</>
}