import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Loader2,
  ArrowLeft,
  Pin,
  Trash2,
  Menu,
  Check,
  FileText,
  Maximize2,
  Minimize2,
  AlertCircle,
  RotateCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
import { RichTextEditor } from '@/shared/ui/rich-text-editor'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/shared/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
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
  useReorderMemoFolders,
} from '@/features/memo'
import type { Memo, MemoFormValues } from '@/entities/memo'
import { MemoFolderTree } from './MemoFolderTree'
import { MemoList } from './MemoList'
import { MemoSearch } from './MemoSearch'

type MobileView = 'list' | 'editor'

export const MemoEditorWidget = () => {
  const { t } = useTranslation('memo')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [showSidebar, setShowSidebar] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  // Editor state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const reorderFolders = useReorderMemoFolders()

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

  const handleSave = useCallback((isAutoSave = false) => {
    if (!selectedMemo || !isDirty) return
    if (isAutoSave) setAutoSaveStatus('saving')
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
          if (isAutoSave) {
            setAutoSaveStatus('saved')
            setTimeout(() => setAutoSaveStatus('idle'), 2000)
          }
        },
        onError: () => {
          if (isAutoSave) {
            setAutoSaveStatus('error')
            toast.error(t('autoSave.error'), {
              action: {
                label: t('autoSave.retry'),
                onClick: () => handleSave(true),
              },
            })
          }
        },
      }
    )
  }, [selectedMemo, isDirty, editTitle, editContent, updateMemo])

  // Auto-save: debounce 2 seconds after last edit
  useEffect(() => {
    if (!isDirty || !selectedMemo) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true)
    }, 2000)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [isDirty, editTitle, editContent, selectedMemo, handleSave])

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

  const handleReorderFolders = useCallback((items: { folderId: number; sortOrder: number }[]) => {
    reorderFolders.mutate(items)
  }, [reorderFolders])

  const handleTitleChange = useCallback((value: string) => {
    setEditTitle(value)
    setIsDirty(true)
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setEditContent(value)
    setIsDirty(true)
  }, [])

  // Warn on page leave with unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleRetry = useCallback(() => {
    handleSave(true)
  }, [handleSave])

  // ESC key to exit focus mode
  useEffect(() => {
    if (!focusMode) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusMode])

  const isLoading = memosLoading || foldersLoading

  // Mobile layout: list view or editor view
  if (isMobile) {
    return (
      <div className="relative h-full">
        {mobileView === 'list' ? (
          <div className="space-y-3">
            {/* Folder drawer toggle + search */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSidebar(true)}
              >
                <Menu size={18} />
              </Button>
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
                hasSearchQuery={!!searchQuery}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleBackToList}
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex items-center gap-1">
                {selectedMemo && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8',
                        selectedMemo.isPinned
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => handleTogglePin(selectedMemo.rowId)}
                      disabled={togglePin.isPending}
                    >
                      <Pin size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(selectedMemo.rowId)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </>
                )}
                {autoSaveStatus === 'saving' && (
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                )}
                {autoSaveStatus === 'saved' && (
                  <Check size={14} className="text-green-600 dark:text-green-400" />
                )}
                {autoSaveStatus === 'error' && (
                  <button onClick={handleRetry} className="flex items-center gap-0.5">
                    <AlertCircle size={14} className="text-destructive" />
                    <RotateCw size={12} className="text-destructive" />
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleSave()}
                  disabled={!isDirty || updateMemo.isPending}
                >
                  {updateMemo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tc('save')}
                </Button>
              </div>
            </div>

            {selectedMemo && (
              <div className="flex-1 overflow-auto p-3">
                <input
                  value={editTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('untitled')}
                  className="mb-3 w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/50"
                />
                <RichTextEditor
                  content={editContent}
                  onUpdate={handleContentChange}
                  placeholder={t('startWriting')}
                  className="border-0 [&_.tiptap]:min-h-[50vh]"
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile folder drawer */}
        <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4">
              <SheetTitle>{t('folders')}</SheetTitle>
            </SheetHeader>
            <div className="p-4 pt-0">
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
                onReorderFolders={handleReorderFolders}
                pinnedMemos={memos?.filter((m) => m.isPinned) || []}
                onSelectMemo={(memo) => {
                  handleSelectMemo(memo)
                  setShowSidebar(false)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete confirmation modal */}
        <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteConfirm.message')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMemo.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMemo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('deleteConfirm.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Desktop layout: 3-panel
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-lg border">
      {/* Left panel: Folders */}
      {!focusMode && (
        <div className="w-56 shrink-0 overflow-y-auto border-r bg-muted/20 p-3">
          <MemoFolderTree
            folders={folders || []}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onReorderFolders={handleReorderFolders}
            pinnedMemos={memos?.filter((m) => m.isPinned) || []}
            onSelectMemo={handleSelectMemo}
          />
        </div>
      )}

      {/* Middle panel: Memo list */}
      {!focusMode && (
      <div className="w-72 shrink-0 overflow-y-auto border-r">
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <MemoSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateMemo}
            >
              <Plus size={14} className="mr-1" />
              {t('newMemo')}
            </Button>
          </div>

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
              hasSearchQuery={!!searchQuery}
            />
          )}
        </div>
      </div>
      )}

      {/* Right panel: Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedMemo ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    selectedMemo.isPinned
                      ? 'text-primary hover:bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => handleTogglePin(selectedMemo.rowId)}
                  title={selectedMemo.isPinned ? t('unpin') : t('pin')}
                  disabled={togglePin.isPending}
                >
                  <Pin size={16} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" />
                    {t('autoSave.saving')}
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Check size={12} />
                    {t('autoSave.saved')}
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle size={12} />
                    {t('autoSave.error')}
                    <button
                      onClick={handleRetry}
                      className="ml-1 inline-flex items-center gap-0.5 underline hover:no-underline"
                    >
                      <RotateCw size={10} />
                      {t('autoSave.retry')}
                    </button>
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setFocusMode(!focusMode)}
                  title={focusMode ? t('focusMode.exit') : t('focusMode.enter')}
                >
                  {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(selectedMemo.rowId)}
                >
                  <Trash2 size={16} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave()}
                  disabled={!isDirty || updateMemo.isPending}
                >
                  {updateMemo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tc('save')}
                </Button>
              </div>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-auto p-4">
              <input
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t('untitled')}
                className="mb-3 w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/50"
              />
              <RichTextEditor
                content={editContent}
                onUpdate={handleContentChange}
                placeholder={t('startWriting')}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <FileText size={56} strokeWidth={1.2} className="mb-4 text-muted-foreground/30" />
            <p className="text-sm font-medium">{t('empty')}</p>
            <p className="mt-1 text-xs">{t('emptyDescription')}</p>
            <Button
              className="mt-4"
              onClick={handleCreateMemo}
            >
              <Plus size={16} className="mr-1" />
              {t('createFirst')}
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMemo.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMemo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
