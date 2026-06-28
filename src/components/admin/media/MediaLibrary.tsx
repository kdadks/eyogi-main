import { useCallback, useEffect, useState } from 'react'
import { Search, Trash2, Check, Film, FileText } from 'lucide-react'
import {
  listMedia, deleteMedia, updateMediaAlt, listFolders,
  createFolder, deleteFolder,
  type MediaRecord, type MediaFolder,
} from '@/lib/supabase/media'
import { MediaUploader } from './MediaUploader'
import { FolderTree } from './FolderTree'

interface Props {
  mode: 'manage' | 'pick'
  onPick?: (media: MediaRecord) => void
  selectedMediaId?: string
}

function MediaIcon({ mimeType }: { mimeType: string | null }) {
  if (!mimeType) return <FileText className="w-8 h-8 text-slate-400" />
  if (mimeType.startsWith('image/')) return null
  if (mimeType.startsWith('video/')) return <Film className="w-8 h-8 text-slate-400" />
  return <FileText className="w-8 h-8 text-slate-400" />
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MediaLibrary({ mode, onPick, selectedMediaId }: Props) {
  const [media, setMedia] = useState<MediaRecord[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    const [mediaData, folderData] = await Promise.all([
      listMedia(selectedFolder),
      listFolders(),
    ])
    setMedia(mediaData)
    setFolders(folderData)
    setLoading(false)
  }, [selectedFolder])

  useEffect(() => { loadMedia() }, [loadMedia])

  const handleDelete = async (item: MediaRecord) => {
    if (!confirm(`Delete "${item.original_name}"?`)) return
    await deleteMedia(item.id, item.storage_path)
    setMedia((prev) => prev.filter((m) => m.id !== item.id))
  }

  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    const folder = await createFolder(name, parentId)
    if (folder) setFolders((prev) => [...prev, folder])
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder? Media inside will become unorganized.')) return
    await deleteFolder(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (selectedFolder === id) setSelectedFolder(null)
  }

  const filtered = media.filter((m) =>
    m.original_name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-slate-200 pr-4">
        <FolderTree
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>

      {/* Main */}
      <div className="flex-1 space-y-4 min-w-0">
        {mode === 'manage' && (
          <MediaUploader folderId={selectedFolder} onUploaded={(m) => setMedia((prev) => [m, ...prev])} />
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No media files found.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((item) => {
              const isSelected = item.id === selectedMediaId
              const isImage = item.mime_type?.startsWith('image/')
              return (
                <div
                  key={item.id}
                  onClick={() => mode === 'pick' && onPick?.(item)}
                  className={`group relative aspect-square border-2 rounded-lg overflow-hidden transition-all ${isSelected ? 'border-orange-500 ring-2 ring-orange-300' : 'border-slate-200 hover:border-orange-300'} ${mode === 'pick' ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {isImage ? (
                    <img src={item.public_url} alt={item.alt_text ?? item.original_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <MediaIcon mimeType={item.mime_type} />
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <p className="text-white text-xs truncate">{item.original_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-xs">{formatBytes(item.size_bytes)}</span>
                      {mode === 'manage' && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                          className="p-1 bg-red-500/80 rounded hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
