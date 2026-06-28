import { useState } from 'react'
import { Folder, FolderOpen, Plus, Trash2 } from 'lucide-react'
import type { MediaFolder } from '@/lib/supabase/media'

interface Props {
  folders: MediaFolder[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCreateFolder: (name: string, parentId?: string | null) => void
  onDeleteFolder: (id: string) => void
}

interface FolderItemProps {
  folder: MediaFolder
  depth?: number
  folders: MediaFolder[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDeleteFolder: (id: string) => void
}

function FolderItem({ folder, depth = 0, folders, selectedId, onSelect, onDeleteFolder }: FolderItemProps) {
  const children = folders.filter((f) => f.parent_id === folder.id)
  const isSelected = selectedId === folder.id
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${isSelected ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`}
        style={{ paddingLeft: `${(depth + 1) * 8 + 8}px` }}
        onClick={() => onSelect(isSelected ? null : folder.id)}
      >
        {isSelected ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
        <span className="text-sm flex-1 truncate">{folder.name}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>
      {children.map((child) => (
        <FolderItem
          key={child.id}
          folder={child}
          depth={depth + 1}
          folders={folders}
          selectedId={selectedId}
          onSelect={onSelect}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  )
}

export function FolderTree({ folders, selectedId, onSelect, onCreateFolder, onDeleteFolder }: Props) {
  const [newFolderName, setNewFolderName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const roots = folders.filter((f) => !f.parent_id)

  function handleCreate() {
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName.trim(), null)
    setNewFolderName('')
    setShowInput(false)
  }

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedId === null ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`}
        onClick={() => onSelect(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="text-sm font-medium">All Media</span>
      </div>
      {roots.map((f) => (
        <FolderItem
          key={f.id}
          folder={f}
          folders={folders}
          selectedId={selectedId}
          onSelect={onSelect}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
      {showInput ? (
        <div className="flex gap-1 px-2 pt-1">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setShowInput(false)
            }}
            placeholder="Folder name"
            className="flex-1 text-sm px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors w-full"
        >
          <Plus className="w-3 h-3" /> New folder
        </button>
      )}
    </div>
  )
}
