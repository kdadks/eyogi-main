/**
 * Design System: Theme Configuration
 * Central export for all design tokens
 */

export { colors, semanticColors, darkColors } from './colors'
export { typography } from './typography'
export { spacing, componentSpacing, responsiveGap } from './spacing'
export { shadows, componentShadows } from './shadows'

// Theme configuration object
export const theme = {
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  animation: {
    duration: '200ms',
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  zIndex: {
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px',
  },
} as const
