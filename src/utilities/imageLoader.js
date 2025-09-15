// Custom image loader to skip optimization during build
export default function imageLoader({ src, width, quality }) {
  // During build, just return the source without optimization
  if (process.env.NODE_ENV === 'production') {
    return src
  }

  // For development, you can add query params if needed
  return `${src}?w=${width}&q=${quality || 75}`
}
