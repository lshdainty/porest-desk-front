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
import { Button } from '@/shared/ui/button'
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
                      className={cn(
                        'h-8 w-8',
                        showPreview
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <Edit3 size={18} /> : <Eye size={18} />}
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
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || updateMemo.isPending}
                >
                  {updateMemo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tc('save')}
                </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    showPreview
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <Edit3 size={14} className="mr-1" />
                      {t('editor')}
                    </>
                  ) : (
                    <>
                      <Eye size={14} className="mr-1" />
                      {t('preview')}
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
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
                  onClick={handleSave}
                  disabled={!isDirty || updateMemo.isPending}
                >
                  {updateMemo.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tc('save')}
                </Button>
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
            <Button
              className="mt-3"
              onClick={handleCreateMemo}
            >
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
