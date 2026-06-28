import { ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useEditing } from '@/contexts/EditingContext'

interface Props {
  title: string
  children: ReactNode
  onSave: () => Promise<void>
  saving?: boolean
}

export default function SectionDrawer({ title, children, onSave, saving }: Props) {
  const { closeDrawer } = useEditing()
  const ref = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDrawer])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        ref={ref}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="font-semibold text-stone-900 text-lg">Edit: {title}</h2>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={closeDrawer}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}
