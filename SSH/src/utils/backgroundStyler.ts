/**
 * Utility to create background styling based on type (color or image)
 */
export interface BackgroundStyle {
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundAttachment?: string
}

export function getBackgroundStyle(
  bgType: 'color' | 'image' | undefined,
  bgColor: string | undefined,
  bgImageUrl: string | undefined,
): BackgroundStyle {
  const style: BackgroundStyle = {}

  if (bgType === 'image' && bgImageUrl && bgImageUrl.trim()) {
    style.backgroundImage = `url('${bgImageUrl}')`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
    style.backgroundAttachment = 'fixed'
  } else if (bgType === 'color' && bgColor && bgColor.trim()) {
    style.backgroundColor = bgColor
  }

  return style
}
