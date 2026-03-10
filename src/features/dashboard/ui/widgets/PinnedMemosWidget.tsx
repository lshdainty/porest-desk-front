import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Pin } from 'lucide-react'
import { memoApi } from '@/features/memo/api/memoApi'
import { memoKeys } from '@/shared/config'

export const PinnedMemosWidget = () => {
  const { t } = useTranslation('dashboard')

  const { data: memos, isLoading } = useQuery({
    queryKey: memoKeys.list({ pinned: true }),
    queryFn: () => memoApi.getMemos(),
  })

  const pinnedMemos = useMemo(() => {
    if (!memos) return []
    return memos.filter((m) => m.isPinned)
  }, [memos])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (pinnedMemos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {pinnedMemos.map((memo) => (
        <div
          key={memo.rowId}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        >
          <Pin size={12} className="shrink-0 text-amber-500" />
          <span className="flex-1 truncate text-sm">{memo.title}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {new Date(memo.modifyAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      ))}
    </div>
  )
}
