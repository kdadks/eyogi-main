import { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useEditing } from '@/contexts/EditingContext'

interface Props {
  sectionKey: string
  label: string
  children: ReactNode
}

export default function EditableSection({ sectionKey, label, children }: Props) {
  const { openDrawer } = useEditing()

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => openDrawer(sectionKey)}
    >
      {/* Hover overlay border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-400 group-hover:bg-orange-400/5 rounded-sm pointer-events-none z-10 transition-all duration-150" />

      {/* Edit badge */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => { e.stopPropagation(); openDrawer(sectionKey) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-lg hover:bg-orange-700 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit {label}
        </button>
      </div>

      {children}
    </div>
  )
}
