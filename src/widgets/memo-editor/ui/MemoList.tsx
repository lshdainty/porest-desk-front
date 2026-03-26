import { useTranslation } from 'react-i18next'
import { Pin, Trash2, FileText } from 'lucide-react'
import { cn, formatDate } from '@/shared/lib'
import type { Memo } from '@/entities/memo'

interface MemoListProps {
  memos: Memo[]
  selectedMemoId: number | null
  onSelectMemo: (memo: Memo) => void
  onTogglePin: (id: number) => void
  onDelete: (id: number) => void
  hasSearchQuery?: boolean
}

export const MemoList = ({
  memos,
  selectedMemoId,
  onSelectMemo,
  onTogglePin,
  onDelete,
  hasSearchQuery = false,
}: MemoListProps) => {
  const { t } = useTranslation('memo')

  // Sort: pinned first, then by modifyAt desc
  const sortedMemos = [...memos].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.modifyAt).getTime() - new Date(a.modifyAt).getTime()
  })

  if (sortedMemos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText size={48} strokeWidth={1.2} className="mb-4 text-muted-foreground/40" />
        <p className="text-sm font-medium">{t('empty')}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {hasSearchQuery ? t('emptySearchDescription') : t('emptyDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {sortedMemos.map((memo) => (
        <div
          key={memo.rowId}
          onClick={() => onSelectMemo(memo)}
          className={cn(
            'group cursor-pointer rounded-lg border p-3 transition-all',
            selectedMemoId === memo.rowId
              ? 'border-primary/40 bg-primary/5'
              : 'border-transparent hover:bg-muted/50'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {memo.isPinned && (
                  <Pin size={12} className="shrink-0 text-primary" />
                )}
                <span className="truncate text-sm font-medium">
                  {memo.title || t('untitled')}
                </span>
              </div>
              {memo.content && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {memo.content.replace(/[#*`>_\-[\]()]/g, '').slice(0, 80)}
                </p>
              )}
              <span className="mt-1.5 block text-[10px] text-muted-foreground">
                {formatDate(memo.modifyAt, 'yyyy.MM.dd HH:mm')}
              </span>
            </div>
            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin(memo.rowId)
                }}
                className={cn(
                  'rounded p-1 transition-colors',
                  memo.isPinned
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title={memo.isPinned ? t('unpin') : t('pin')}
              >
                <Pin size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(memo.rowId)
                }}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
