/**
 * Design System: Shadows & Elevation
 * Consistent shadow system for depth and hierarchy
 */

export const shadows = {
  // Elevation levels
  none: 'none',

  // Subtle
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  // Base
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',

  // Medium
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

  // Large
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  // Extra large
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // 2XL
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Inner
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // Focused (for accessibility)
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.5)',

  // Interactive hover
  hover: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
} as const

// Component-specific shadows
export const componentShadows = {
  card: shadows.base,
  button: {
    default: shadows.base,
    hover: shadows.md,
    active: shadows.sm,
  },
  modal: shadows['2xl'],
  dropdown: shadows.lg,
  header: shadows.base,
  sidebar: shadows.base,
  input: {
    default: shadows.sm,
    focus: shadows.focus,
  },
  tooltip: shadows.lg,
} as const
