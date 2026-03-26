import { useState, useMemo, useCallback } from 'react'
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
  GripVertical,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib'
import type { MemoFolder } from '@/entities/memo'

interface MemoFolderTreeProps {
  folders: MemoFolder[]
  selectedFolderId: number | null
  onSelectFolder: (folderId: number | null) => void
  onCreateFolder: (folderName: string) => void
  onRenameFolder: (id: number, folderName: string) => void
  onDeleteFolder: (id: number) => void
  onReorderFolders?: (items: { folderId: number; sortOrder: number }[]) => void
}

interface SortableFolderItemProps {
  folder: MemoFolder
  selectedFolderId: number | null
  editingId: number | null
  editingName: string
  deletingId: number | null
  onSelectFolder: (folderId: number) => void
  onStartEdit: (id: number, name: string) => void
  onEditNameChange: (name: string) => void
  onRenameSubmit: (id: number) => void
  onCancelEdit: () => void
  onStartDelete: (id: number) => void
  onDeleteConfirm: (id: number) => void
  onCancelDelete: () => void
  t: (key: string) => string
}

const SortableFolderItem = ({
  folder,
  selectedFolderId,
  editingId,
  editingName,
  deletingId,
  onSelectFolder,
  onStartEdit,
  onEditNameChange,
  onRenameSubmit,
  onCancelEdit,
  onStartDelete,
  onDeleteConfirm,
  onCancelDelete,
  t,
}: SortableFolderItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.rowId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (editingId === folder.rowId) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-1 px-2 py-1">
        <input
          autoFocus
          value={editingName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit(folder.rowId)
            if (e.key === 'Escape') onCancelEdit()
          }}
          className="flex-1 rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => onRenameSubmit(folder.rowId)}
          className="rounded p-1 text-primary hover:bg-primary/10"
        >
          <Check size={14} />
        </button>
        <button
          onClick={onCancelEdit}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  if (deletingId === folder.rowId) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} className="rounded-md border border-destructive/20 bg-destructive/5 p-2">
        <p className="text-xs text-muted-foreground">
          {t('folderDeleteConfirm.message')}
        </p>
        <div className="mt-2 flex gap-1">
          <button
            onClick={onCancelDelete}
            className="flex-1 rounded border px-2 py-1 text-xs hover:bg-muted"
          >
            {t('deleteConfirm.cancel')}
          </button>
          <button
            onClick={() => onDeleteConfirm(folder.rowId)}
            className="flex-1 rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
          >
            {t('deleteConfirm.confirm')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group flex w-full items-center gap-1 rounded-md px-1 py-2 text-sm transition-colors',
        selectedFolderId === folder.rowId
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-muted',
        isDragging && 'opacity-50 ring-2 ring-primary shadow-lg rounded-md'
      )}
    >
      <button
        {...listeners}
        className="flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical size={12} />
      </button>
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
          onClick={() => onStartEdit(folder.rowId, folder.folderName)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onStartDelete(folder.rowId)}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

export const MemoFolderTree = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onReorderFolders,
}: MemoFolderTreeProps) => {
  const { t } = useTranslation('memo')

  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeDragId, setActiveDragId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.sortOrder - b.sortOrder),
    [folders]
  )

  const folderIds = useMemo(
    () => sortedFolders.map((f) => f.rowId),
    [sortedFolders]
  )

  const activeDragFolder = useMemo(
    () => (activeDragId !== null ? sortedFolders.find((f) => f.rowId === activeDragId) ?? null : null),
    [activeDragId, sortedFolders]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(Number(event.active.id))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedFolders.findIndex((f) => f.rowId === Number(active.id))
    const newIndex = sortedFolders.findIndex((f) => f.rowId === Number(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(sortedFolders, oldIndex, newIndex)
    const items = reordered.map((folder, index) => ({
      folderId: folder.rowId,
      sortOrder: index,
    }))
    onReorderFolders?.(items)
  }, [sortedFolders, onReorderFolders])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

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

      {/* Folder list with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
          {sortedFolders.map((folder) => (
            <SortableFolderItem
              key={folder.rowId}
              folder={folder}
              selectedFolderId={selectedFolderId}
              editingId={editingId}
              editingName={editingName}
              deletingId={deletingId}
              onSelectFolder={onSelectFolder}
              onStartEdit={(id, name) => {
                setEditingId(id)
                setEditingName(name)
              }}
              onEditNameChange={setEditingName}
              onRenameSubmit={handleRenameSubmit}
              onCancelEdit={() => setEditingId(null)}
              onStartDelete={setDeletingId}
              onDeleteConfirm={handleDeleteConfirm}
              onCancelDelete={() => setDeletingId(null)}
              t={t}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeDragFolder ? (
            <div className="flex items-center gap-2 rounded-md bg-card border px-2 py-2 text-sm shadow-lg">
              <GripVertical size={12} className="text-muted-foreground/40" />
              <Folder size={16} />
              <span className="truncate">{activeDragFolder.folderName}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
