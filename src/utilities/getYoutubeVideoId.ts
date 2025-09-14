export default function getYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const { hostname } = parsedUrl

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.slice(1) // Get the path after '/'
    }
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      const videoId = parsedUrl.searchParams.get('v')
      if (videoId) {
        return videoId
      }

      const paths = parsedUrl.pathname.split('/')
      if (paths.includes('embed') || paths.includes('v') || paths.includes('shorts')) {
        return paths[paths.length - 1]
      }
    }
  } catch (error) {
    console.error('Invalid URL:', error)
  }

  return null
}
