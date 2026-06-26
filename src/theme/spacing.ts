/**
 * Design System: Spacing Scale
 * 4px base unit for consistent rhythm
 */

export const spacing = {
  // Padding and margin scale (4px base unit)
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const

// Component-specific spacing presets
export const componentSpacing = {
  // Container padding
  container: {
    xs: '1rem', // 16px
    sm: '1.5rem', // 24px
    base: '2rem', // 32px
    lg: '2.5rem', // 40px
    xl: '3rem', // 48px
  },

  // Gap between items
  gap: {
    xs: '0.5rem', // 8px
    sm: '1rem', // 16px
    base: '1.5rem', // 24px
    lg: '2rem', // 32px
    xl: '2.5rem', // 40px
  },

  // Component internal spacing
  button: {
    px: '1rem', // 16px
    py: '0.625rem', // 10px
  },

  input: {
    px: '0.75rem', // 12px
    py: '0.5rem', // 8px
  },

  card: {
    padding: '1.5rem', // 24px
  },

  modal: {
    padding: '2rem', // 32px
  },

  sidebar: {
    padding: '1rem', // 16px
  },
} as const

// Breakpoint spacing
export const responsiveGap = {
  mobile: '1rem',
  tablet: '1.5rem',
  desktop: '2rem',
  wide: '2.5rem',
} as const
