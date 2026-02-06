import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Folder,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import type { MemoFolder } from '@/entities/memo'

interface MemoFolderTreeProps {
  folders: MemoFolder[]
  selectedFolderId: number | null
  onSelectFolder: (folderId: number | null) => void
  onCreateFolder: (folderName: string) => void
  onRenameFolder: (id: number, folderName: string) => void
  onDeleteFolder: (id: number) => void
}

export const MemoFolderTree = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: MemoFolderTreeProps) => {
  const { t } = useTranslation('memo')

  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleCreateSubmit = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
      setNewFolderName('')
      setIsCreating(false)
    }
  }

  const handleRenameSubmit = (id: number) => {
    if (editingName.trim()) {
      onRenameFolder(id, editingName.trim())
      setEditingId(null)
      setEditingName('')
    }
  }

  const handleDeleteConfirm = (id: number) => {
    onDeleteFolder(id)
    setDeletingId(null)
    if (selectedFolderId === id) {
      onSelectFolder(null)
    }
  }

  const sortedFolders = [...folders].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {t('folder.title')}
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title={t('folder.create')}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* All Memos */}
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
          selectedFolderId === null
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground hover:bg-muted'
        )}
      >
        <FileText size={16} />
        <span className="truncate">{t('allMemos')}</span>
      </button>

      {/* Folder list */}
      {sortedFolders.map((folder) => (
        <div key={folder.rowId}>
          {editingId === folder.rowId ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(folder.rowId)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => handleRenameSubmit(folder.rowId)}
                className="rounded p-1 text-primary hover:bg-primary/10"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X size={14} />
              </button>
            </div>
          ) : deletingId === folder.rowId ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2">
              <p className="text-xs text-muted-foreground">
                {t('folderDeleteConfirm.message')}
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 rounded border px-2 py-1 text-xs hover:bg-muted"
                >
                  {t('deleteConfirm.cancel')}
                </button>
                <button
                  onClick={() => handleDeleteConfirm(folder.rowId)}
                  className="flex-1 rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('deleteConfirm.confirm')}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                selectedFolderId === folder.rowId
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <button
                onClick={() => onSelectFolder(folder.rowId)}
                className="flex flex-1 items-center gap-2 min-w-0"
              >
                {selectedFolderId === folder.rowId ? (
                  <FolderOpen size={16} />
                ) : (
                  <Folder size={16} />
                )}
                <span className="truncate">{folder.folderName}</span>
              </button>
              <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <button
                  onClick={() => {
                    setEditingId(folder.rowId)
                    setEditingName(folder.folderName)
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => setDeletingId(folder.rowId)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Create folder input */}
      {isCreating && (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit()
              if (e.key === 'Escape') {
                setIsCreating(false)
                setNewFolderName('')
              }
            }}
            placeholder={t('folder.namePlaceholder')}
            className="flex-1 rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleCreateSubmit}
            className="rounded p-1 text-primary hover:bg-primary/10"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => {
              setIsCreating(false)
              setNewFolderName('')
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
