import { useOutletContext } from 'react-router-dom'
import { NotebookPen, Pin, Plus } from 'lucide-react'
import { useMemos } from '@/features/memo'
import type { Memo } from '@/entities/memo'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// 메모 카드 5색 팔레트. 각 색의 원색을 alpha 로 섞어 기저 bg 에 오버레이 —
// light/dark 모두 자연 적응. 기존 --mossy-100 등 primitive 를 그대로 쓰면
// 다크모드에서 라이트 톤이 유지돼 카드가 튀어 보였음.
const CARD_COLORS = [
  'color-mix(in oklch, var(--border-brand) 18%, transparent)',   // 모시 그린
  'color-mix(in oklch, var(--sunlit-500) 18%, transparent)',  // 햇살 옐로
  'color-mix(in oklch, var(--bark-500) 18%, transparent)',    // 바크 브라운
  'color-mix(in oklch, oklch(0.55 0.15 290) 18%, transparent)', // 라벤더
  'var(--bg-muted)',                                          // 뉴트럴
]

const formatDate = (iso: string) => {
  if (!iso) return ''
  const date = iso.slice(0, 10)
  if (date.length < 10) return date
  return date.slice(5).replace('-', '.')
}

/** MemoPage 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계. */
function useMemoPageData() {
  const memosQ = useMemos()
  return {
    isLoading: memosQ.isLoading,
  }
}

/** 메모 카드 1장 skeleton — 핀 아이콘 + 날짜 + 제목 + 본문 라인들. */
function MemoCardSkeleton() {
  return (
    <Card
      style={{
        background: 'var(--bg-muted)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SkeletonBase className="h-3.5 w-3.5 rounded-sm" />
          <SkeletonBase className="h-3 w-10" />
          <SkeletonBase className="h-3 w-12 ml-auto" />
        </div>
        <SkeletonBase className="h-5 w-4/5" />
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-11/12" />
        <SkeletonBase className="h-4 w-2/3" />
      </CardContent>
    </Card>
  )
}

/** Memo 페이지 구조 일치 skeleton — 헤더 + 메모 카드 grid. */
function MemoPageSkeleton({ mobile }: { mobile: boolean }) {
  const Grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {Array.from({ length: mobile ? 4 : 6 }).map((_, i) => (
        <MemoCardSkeleton key={i} />
      ))}
    </div>
  )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <SkeletonBase className="h-7 w-16" />
          <div style={{ marginLeft: 'auto' }}>
            <SkeletonBase className="h-9 w-24 rounded-md" />
          </div>
        </div>
        {Grid}
      </div>
    )
  }
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <SkeletonBase className="h-8 w-20 mb-2" />
          <SkeletonBase className="h-4 w-36" />
        </div>
        <div className="right">
          <SkeletonBase className="h-9 w-24 rounded-md" />
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>{Grid}</div>
    </div>
  )
}

export const MemoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useMemoPageData()
  if (isLoading) return <MemoPageSkeleton mobile={mobile} />
  return <MemoPageInner mobile={mobile} />
}

const MemoPageInner = ({ mobile }: { mobile: boolean }) => {
  const memosQ = useMemos()

  const memos: Memo[] = memosQ.data ?? []

  // Sort: pinned first, then by createAt desc
  const sorted = [...memos].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return (b.createAt || '').localeCompare(a.createAt || '')
  })

  const AddBtn = (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--bg-brand)',
        color: 'var(--fg-on-brand)',
        border: 0,
        borderRadius: 'var(--radius-tile)',
        padding: '8px 14px',
        fontSize: 'var(--fs-body-sm)',
        fontWeight: 'var(--fw-bold)',
        cursor: 'pointer',
      }}
    >
      <Plus size={14} /> 메모 추가
    </button>
  )

  const MemoCard = (m: Memo, i: number) => {
    const color = CARD_COLORS[i % CARD_COLORS.length]!
    return (
      <Card
        key={m.rowId}
        style={{
          background: color,
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
      >
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {m.isPinned ? (
              <Pin size={13} style={{ color: 'var(--fg-expense)' }} />
            ) : (
              <NotebookPen size={14} style={{ color: 'var(--fg-secondary)' }} />
            )}
            <span
              style={{
                fontSize: 'var(--fs-micro)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--fg-secondary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              {m.isPinned ? '고정' : '메모'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-micro)', color: 'var(--fg-tertiary)' }}>
              {formatDate(m.createAt)}
            </span>
          </div>
          <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-snug)', color: 'var(--fg-primary)' }}>
            {m.title}
          </div>
          {m.content && (
            <div
              style={{
                fontSize: 'var(--fs-body-sm)',
                color: 'var(--fg-secondary)',
                lineHeight: 'var(--lh-normal)',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const Grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {sorted.map(MemoCard)}
    </div>
  )

  const LoadingState = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map(i => (
        <MemoCardSkeleton key={i} />
      ))}
    </div>
  )

  const EmptyState = (
    <Card>
      <CardContent
        style={{
          textAlign: 'center',
          color: 'var(--fg-tertiary)',
          fontSize: 'var(--fs-body-sm)',
        }}
      >
        아직 메모가 없어요
      </CardContent>
    </Card>
  )

  const Body = memosQ.isLoading
    ? LoadingState
    : sorted.length === 0
      ? EmptyState
      : Grid

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>메모</h2>
          <div style={{ marginLeft: 'auto' }}>{AddBtn}</div>
        </div>
        {Body}
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>메모</h1>
          <div className="sub">아이디어와 메모 정리</div>
        </div>
        <div className="right">{AddBtn}</div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>{Body}</div>
    </div>
  )
}
