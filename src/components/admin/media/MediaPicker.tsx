import { Modal } from '@/components/admin'
import { MediaLibrary } from './MediaLibrary'
import type { MediaRecord } from '@/lib/supabase/media'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaRecord) => void
  selectedMediaId?: string
}

export function MediaPicker({ isOpen, onClose, onSelect, selectedMediaId }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Media" size="xl">
      <div className="h-[60vh]">
        <MediaLibrary
          mode="pick"
          selectedMediaId={selectedMediaId}
          onPick={(media) => { onSelect(media); onClose() }}
        />
      </div>
    </Modal>
  )
}
