import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { uploadMedia, type MediaRecord } from '@/lib/supabase/media'

interface Props {
  folderId?: string | null
  onUploaded: (media: MediaRecord) => void
}

export function MediaUploader({ folderId, onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const processFiles = useCallback(async (files: File[]) => {
    setUploading(true)
    for (const file of files) {
      const result = await uploadMedia(file, folderId)
      if (result) onUploaded(result)
    }
    setUploading(false)
  }, [folderId, onUploaded])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [processFiles])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    processFiles(files)
    e.target.value = ''
  }, [processFiles])

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-slate-300 bg-slate-50 hover:border-orange-300'}`}
    >
      <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" multiple onChange={onFileChange} className="hidden" />
      {uploading ? (
        <div className="flex flex-col items-center gap-2 text-orange-500">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Uploading…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Upload className="w-8 h-8" />
          <p className="text-sm font-medium text-slate-600">Drop files here or click to browse</p>
          <p className="text-xs">Images, videos, PDFs supported</p>
        </div>
      )}
    </label>
  )
}
