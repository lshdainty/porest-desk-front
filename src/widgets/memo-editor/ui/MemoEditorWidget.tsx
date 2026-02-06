import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Loader2,
  ArrowLeft,
  Eye,
  Edit3,
  Pin,
  Trash2,
  Menu,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  useMemos,
  useCreateMemo,
  useUpdateMemo,
  useToggleMemoPin,
  useDeleteMemo,
  useMemoFolders,
  useCreateMemoFolder,
  useUpdateMemoFolder,
  useDeleteMemoFolder,
} from '@/features/memo'
import type { Memo, MemoFormValues } from '@/entities/memo'
import { MemoFolderTree } from './MemoFolderTree'
import { MemoList } from './MemoList'
import { MemoSearch } from './MemoSearch'
import { MemoPreview } from './MemoPreview'

type MobileView = 'list' | 'editor'

export const MemoEditorWidget = () => {
  const { t } = useTranslation('memo')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [showSidebar, setShowSidebar] = useState(false)

  // Editor state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const filters = {
    ...(selectedFolderId !== null && { folderId: selectedFolderId }),
    ...(searchQuery && { search: searchQuery }),
  }

  const { data: memos, isLoading: memosLoading } = useMemos(
    Object.keys(filters).length > 0 ? filters : undefined
  )
  const { data: folders, isLoading: foldersLoading } = useMemoFolders()
  const createMemo = useCreateMemo()
  const updateMemo = useUpdateMemo()
  const togglePin = useToggleMemoPin()
  const deleteMemo = useDeleteMemo()
  const createFolder = useCreateMemoFolder()
  const updateFolder = useUpdateMemoFolder()
  const deleteFolder = useDeleteMemoFolder()

  // Sync editor state with selected memo
  useEffect(() => {
    if (selectedMemo) {
      setEditTitle(selectedMemo.title)
      setEditContent(selectedMemo.content || '')
      setIsDirty(false)
    }
  }, [selectedMemo])

  const handleSelectMemo = useCallback((memo: Memo) => {
    setSelectedMemo(memo)
    setShowPreview(false)
    if (isMobile) {
      setMobileView('editor')
    }
  }, [isMobile])

  const handleCreateMemo = useCallback(() => {
    const data: MemoFormValues = {
      title: '',
      content: '',
      folderRowId: selectedFolderId,
    }
    createMemo.mutate(data, {
      onSuccess: (newMemo) => {
        setSelectedMemo(newMemo)
        if (isMobile) {
          setMobileView('editor')
        }
      },
    })
  }, [createMemo, selectedFolderId, isMobile])

  const handleSave = useCallback(() => {
    if (!selectedMemo || !isDirty) return
    const data: MemoFormValues = {
      title: editTitle,
      content: editContent || undefined,
      folderRowId: selectedMemo.folderRowId,
    }
    updateMemo.mutate(
      { id: selectedMemo.rowId, data },
      {
        onSuccess: (updated) => {
          setSelectedMemo(updated)
          setIsDirty(false)
        },
      }
    )
  }, [selectedMemo, isDirty, editTitle, editContent, updateMemo])

  const handleTogglePin = useCallback((id: number) => {
    togglePin.mutate(id, {
      onSuccess: (updated) => {
        if (selectedMemo?.rowId === id) {
          setSelectedMemo(updated)
        }
      },
    })
  }, [togglePin, selectedMemo])

  const handleDelete = useCallback((id: number) => {
    setShowDeleteConfirm(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteMemo.mutate(showDeleteConfirm, {
      onSuccess: () => {
        if (selectedMemo?.rowId === showDeleteConfirm) {
          setSelectedMemo(null)
          if (isMobile) {
            setMobileView('list')
          }
        }
        setShowDeleteConfirm(null)
      },
    })
  }, [showDeleteConfirm, deleteMemo, selectedMemo, isMobile])

  const handleBackToList = useCallback(() => {
    if (isDirty) {
      handleSave()
    }
    setMobileView('list')
  }, [isDirty, handleSave])

  const handleCreateFolder = useCallback((folderName: string) => {
    createFolder.mutate({ folderName })
  }, [createFolder])

  const handleRenameFolder = useCallback((id: number, folderName: string) => {
    updateFolder.mutate({ id, data: { folderName } })
  }, [updateFolder])

  const handleDeleteFolder = useCallback((id: number) => {
    deleteFolder.mutate(id)
  }, [deleteFolder])

  const handleTitleChange = useCallback((value: string) => {
    setEditTitle(value)
    setIsDirty(true)
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setEditContent(value)
    setIsDirty(true)
  }, [])

  const isLoading = memosLoading || foldersLoading

  // Mobile layout: list view or editor view
  if (isMobile) {
    return (
      <div className="relative h-full">
        {mobileView === 'list' ? (
          <div className="space-y-3">
            {/* Folder drawer toggle + search */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(true)}
                className="rounded-md border p-2 hover:bg-muted"
              >
                <Menu size={18} />
              </button>
              <div className="flex-1">
                <MemoSearch value={searchQuery} onChange={setSearchQuery} />
              </div>
            </div>

            {/* Memo list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MemoList
                memos={memos || []}
                selectedMemoId={selectedMemo?.rowId ?? null}
                onSelectMemo={handleSelectMemo}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
              />
            )}

            {/* FAB for new memo */}
            <button
              onClick={handleCreateMemo}
              className={cn(
                'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center',
                'rounded-full bg-primary text-primary-foreground shadow-lg',
                'hover:bg-primary/90 active:scale-95 transition-all'
              )}
            >
              <Plus size={24} />
            </button>
          </div>
        ) : (
          /* Mobile editor view */
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-2 py-2">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-1 rounded-md p-2 text-sm hover:bg-muted"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {selectedMemo && (
                  <>
                    <button
                      onClick={() => handleTogglePin(selectedMemo.rowId)}
                      className={cn(
                        'rounded-md p-2',
                        selectedMemo.isPinned
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Pin size={18} />
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={cn(
                        'rounded-md p-2',
                        showPreview
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {showPreview ? <Edit3 size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMemo.rowId)}
                      className="rounded-md p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || updateMemo.isPending}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMemo.isPending ? tc('loading') : tc('save')}
                </button>
              </div>
            </div>

            {selectedMemo && (
              <div className="flex-1 overflow-auto p-4">
                {showPreview ? (
                  <div>
                    <h1 className="mb-4 text-xl font-bold">
                      {editTitle || t('untitled')}
                    </h1>
                    <MemoPreview content={editContent} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder={t('untitled')}
                      className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/50"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder={t('markdown')}
                      className="min-h-[60vh] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile folder drawer */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowSidebar(false)}
          >
            <div
              className="h-full w-72 bg-background p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <MemoFolderTree
                folders={folders || []}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id)
                  setShowSidebar(false)
                }}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
              />
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteConfirm !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">{t('deleteConfirm.title')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('deleteConfirm.message')}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t('deleteConfirm.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMemo.isPending}
                  className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {deleteMemo.isPending ? '...' : t('deleteConfirm.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop layout: 3-panel
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-lg border">
      {/* Left panel: Folders */}
      <div className="w-56 shrink-0 overflow-y-auto border-r bg-muted/20 p-3">
        <MemoFolderTree
          folders={folders || []}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>

      {/* Middle panel: Memo list */}
      <div className="w-72 shrink-0 overflow-y-auto border-r">
        <div className="space-y-3 p-3">
          <MemoSearch value={searchQuery} onChange={setSearchQuery} />

          <button
            onClick={handleCreateMemo}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus size={16} />
            {t('newMemo')}
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MemoList
              memos={memos || []}
              selectedMemoId={selectedMemo?.rowId ?? null}
              onSelectMemo={handleSelectMemo}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Right panel: Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedMemo ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(selectedMemo.rowId)}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    selectedMemo.isPinned
                      ? 'text-primary hover:bg-primary/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={selectedMemo.isPinned ? t('unpin') : t('pin')}
                >
                  <Pin size={16} />
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    showPreview
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {showPreview ? (
                    <>
                      <Edit3 size={14} />
                      {t('editor')}
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      {t('preview')}
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedMemo.rowId)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || updateMemo.isPending}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {updateMemo.isPending ? tc('loading') : tc('save')}
                </button>
              </div>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-auto p-4">
              {showPreview ? (
                <div>
                  <h1 className="mb-4 text-xl font-bold">
                    {editTitle || t('untitled')}
                  </h1>
                  <MemoPreview content={editContent} />
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    value={editTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder={t('untitled')}
                    className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/50"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder={t('markdown')}
                    className="min-h-[50vh] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">{t('empty')}</p>
            <button
              onClick={handleCreateMemo}
              className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('createFirst')}
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{t('deleteConfirm.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('deleteConfirm.message')}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('deleteConfirm.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMemo.isPending}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteMemo.isPending ? '...' : t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
