// Default placeholder images - can be replaced with actual hosted images
export const DEFAULT_IMAGES = {
  // Gurukul default cover image
  GURUKUL_COVER: '/placeholder-gallery.png',

  // Team member placeholders
  TEAM_MEMBER: '/placeholder-gallery.png',

  // General placeholder
  PLACEHOLDER: '/placeholder-gallery.png',
} as const

// Fallback to a solid color placeholder if image loading fails
export const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yODAgMzAwSDMyMFYyNDBIMjgwVjMwMFpNMjYwIDMyMEgzNDBWMjIwSDI2MFYzMjBaTTMwMCAyNjBIMzAwVjI2MEgzMDBWMjYwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
