import React, { useEffect } from 'react'

import { defaultTheme, themeLocalStorageKey } from '../ThemeSelector/types'

export const InitTheme: React.FC = () => {
  useEffect(() => {
    const theme = (() => {
      const stored = localStorage.getItem(themeLocalStorageKey)
      if (stored === 'light' || stored === 'dark') return stored
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    })()
    document.documentElement.setAttribute('data-theme', 'light')
    void theme
  }, [])

  return null
}
