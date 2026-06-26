
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MembershipRegistrationForm from './MembershipRegistrationForm'
import { useMembershipModal } from '@/contexts/MembershipModalContext'

export default function MembershipModal() {
  const { isOpen, closeModal } = useMembershipModal()

  const handleCloseModal = () => {
    closeModal()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-stone-900">
                Join eYogi Membership
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Select a plan and complete your registration. Get instant access to exclusive content.
              </DialogDescription>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <MembershipRegistrationForm onSuccess={handleCloseModal} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
