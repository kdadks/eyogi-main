'use client'

import getYouTubeVideoId from '@/utilities/getYoutubeVideoId'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

function VideoYt({ ytLink }: { ytLink: string }) {
  const ytId = getYouTubeVideoId(ytLink)

  if (!ytId) return null

  return (
    <div className="w-full h-full relative">
      <LiteYouTubeEmbed id={ytId} title="Video" poster="maxresdefault" muted />
    </div>
  )
}
export default VideoYt
