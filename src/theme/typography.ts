/**
 * Design System: Typography
 * Font sizes, weights, line heights, and letter spacing
 */

export const typography = {
  // Font families
  family: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  // Font weights
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Heading styles
  heading: {
    h1: {
      size: '2.25rem', // 36px
      lineHeight: 1.2,
      weight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      size: '1.875rem', // 30px
      lineHeight: 1.2,
      weight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '1.5rem', // 24px
      lineHeight: 1.3,
      weight: 700,
      letterSpacing: '-0.005em',
    },
    h4: {
      size: '1.25rem', // 20px
      lineHeight: 1.4,
      weight: 600,
      letterSpacing: 0,
    },
    h5: {
      size: '1rem', // 16px
      lineHeight: 1.5,
      weight: 600,
      letterSpacing: 0,
    },
    h6: {
      size: '0.875rem', // 14px
      lineHeight: 1.5,
      weight: 600,
      letterSpacing: '0.02em',
    },
  },

  // Body text styles
  body: {
    lg: {
      size: '1.125rem', // 18px
      lineHeight: 1.6,
      weight: 400,
    },
    base: {
      size: '1rem', // 16px
      lineHeight: 1.5,
      weight: 400,
    },
    sm: {
      size: '0.875rem', // 14px
      lineHeight: 1.5,
      weight: 400,
    },
    xs: {
      size: '0.75rem', // 12px
      lineHeight: 1.5,
      weight: 400,
    },
  },

  // Label and caption styles
  label: {
    lg: {
      size: '1rem', // 16px
      lineHeight: 1.5,
      weight: 500,
    },
    base: {
      size: '0.875rem', // 14px
      lineHeight: 1.5,
      weight: 500,
    },
    sm: {
      size: '0.75rem', // 12px
      lineHeight: 1.5,
      weight: 600,
      letterSpacing: '0.05em',
    },
  },

  // Utility sizes
  button: {
    lg: {
      size: '1rem',
      lineHeight: 1.5,
      weight: 600,
    },
    base: {
      size: '0.875rem',
      lineHeight: 1.5,
      weight: 600,
    },
    sm: {
      size: '0.75rem',
      lineHeight: 1.5,
      weight: 600,
    },
  },

  code: {
    size: '0.875rem',
    family: 'monospace',
    weight: 400,
    lineHeight: 1.5,
  },
} as const
