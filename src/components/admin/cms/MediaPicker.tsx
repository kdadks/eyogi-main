import { useState, useEffect } from 'react'
import { Upload, X, Search, Grid, List, Image as ImageIcon, FolderOpen } from 'lucide-react'
import { Button } from '@/components/admin/common/Button'
import { Input } from '@/components/admin/common/Input'
import { Modal } from '@/components/admin/common/Modal'
import { cmsAPI } from '@/lib/cms-api'
import type { CMSMedia } from '@/lib/cms-types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

interface MediaPickerProps {
  value?: string
  onChange: (mediaId: string | undefined) => void
  allowMultiple?: boolean
  fileTypes?: string[]
}

export function MediaPicker({ value, onChange, allowMultiple = false, fileTypes }: MediaPickerProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [media, setMedia] = useState<CMSMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<CMSMedia | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen, searchTerm])

  useEffect(() => {
    if (value) {
      fetchSelectedMedia()
    }
  }, [value])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await cmsAPI.media.getAll({
        search: searchTerm,
        file_type: fileTypes?.[0],
      })
      setMedia(response.data)
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const fetchSelectedMedia = async () => {
    if (!value) return
    try {
      const item = await cmsAPI.media.getById(value)
      if (item) setSelectedMedia(item)
    } catch (error) {
      console.error('Error fetching selected media:', error)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !user?.id) return

    try {
      setUploading(true)
      // Note: Actual file upload would go to storage service (Supabase Storage, etc.)
      // This is just the metadata creation
      
      for (const file of Array.from(files)) {
        // Mock upload - in real implementation, upload to storage first
        const fakeUrl = URL.createObjectURL(file)
        
        const mediaData: Partial<CMSMedia> = {
          title: file.name,
          filename: file.name,
          file_path: `/uploads/${file.name}`,
          file_url: fakeUrl,
          file_size: file.size,
          mime_type: file.type,
          file_type: file.type.startsWith('image/') ? 'image' : 'document',
          metadata: {},
        }

        await cmsAPI.media.create(mediaData, user.id)
      }

      toast.success('Media uploaded successfully')
      fetchMedia()
    } catch (error) {
      console.error('Error uploading media:', error)
      toast.error('Failed to upload media')
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = (item: CMSMedia) => {
    setSelectedMedia(item)
    onChange(item.id)
    setIsOpen(false)
  }

  const handleRemove = () => {
    setSelectedMedia(null)
    onChange(undefined)
  }

  return (
    <div>
      {selectedMedia ? (
        <div className="relative group">
          <div className="aspect-video bg-stone-100 rounded-lg overflow-hidden border-2 border-stone-200">
            {selectedMedia.file_type === 'image' ? (
              <img
                src={selectedMedia.file_url}
                alt={selectedMedia.alt_text || selectedMedia.title || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <FolderOpen className="w-12 h-12 text-stone-400" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsOpen(true)}
            >
              Change
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleRemove}
              leftIcon={<X className="w-4 h-4" />}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          leftIcon={<ImageIcon className="w-4 h-4" />}
          className="w-full"
        >
          Select Media
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Media Library"
        size="xl"
      >
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <label>
              <input
                type="file"
                multiple={allowMultiple}
                onChange={handleUpload}
                className="hidden"
                accept={fileTypes?.join(',') || 'image/*'}
              />
              <Button
                as="span"
                variant="primary"
                leftIcon={<Upload className="w-4 h-4" />}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </label>
          </div>

          {/* Media Grid/List */}
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-stone-500">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p>No media found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="group relative aspect-square bg-stone-100 rounded-lg overflow-hidden border-2 border-stone-200 hover:border-orange-600 transition-colors"
                  >
                    {item.file_type === 'image' ? (
                      <img
                        src={item.file_url}
                        alt={item.alt_text || item.title || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FolderOpen className="w-8 h-8 text-stone-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium px-2 text-center truncate">
                        {item.title || item.filename}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg border-2 border-stone-200 hover:border-orange-600 transition-colors"
                  >
                    <div className="w-16 h-16 bg-stone-100 rounded flex-shrink-0 overflow-hidden">
                      {item.file_type === 'image' ? (
                        <img
                          src={item.file_url}
                          alt={item.alt_text || item.title || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FolderOpen className="w-6 h-6 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-stone-900">{item.title || item.filename}</p>
                      <p className="text-sm text-stone-500">
                        {item.file_size ? `${(item.file_size / 1024).toFixed(2)} KB` : 'Unknown size'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
