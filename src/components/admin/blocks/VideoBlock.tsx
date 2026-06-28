// src/components/admin/blocks/VideoBlock.tsx
import type { VideoBlock } from '@/types/blocks'

interface Props { block: VideoBlock; onChange: (b: VideoBlock) => void }

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match?.[1] ?? null
}

export function VideoBlock({ block, onChange }: Props) {
  const ytId = getYouTubeId(block.url)
  return (
    <div className="space-y-3">
      <input
        type="url"
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value })}
        placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 text-sm"
      />
      {ytId && (
        <div className="aspect-video rounded-lg overflow-hidden border border-slate-200">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <input
        type="text"
        value={block.caption ?? ''}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
      />
    </div>
  )
}
