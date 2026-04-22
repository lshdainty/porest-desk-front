import { useOutletContext } from 'react-router-dom'
import { NotebookPen, Pin, Plus } from 'lucide-react'
import { useMemos } from '@/features/memo'
import type { Memo } from '@/entities/memo'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// 메모 카드 5색 팔레트. 각 색의 원색을 alpha 로 섞어 기저 bg 에 오버레이 —
// light/dark 모두 자연 적응. 기존 --mossy-100 등 primitive 를 그대로 쓰면
// 다크모드에서 라이트 톤이 유지돼 카드가 튀어 보였음.
const CARD_COLORS = [
  'color-mix(in oklch, var(--mossy-500) 18%, transparent)',   // 모시 그린
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

export const MemoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
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
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <Plus size={14} /> 메모 추가
    </button>
  )

  const Card = (m: Memo, i: number) => {
    const color = CARD_COLORS[i % CARD_COLORS.length]!
    return (
      <div
        key={m.rowId}
        className="p-card"
        style={{
          padding: 18,
          background: color,
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {m.isPinned ? (
            <Pin size={13} style={{ color: 'var(--berry-600)' }} />
          ) : (
            <NotebookPen size={14} style={{ color: 'var(--fg-secondary)' }} />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--fg-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {m.isPinned ? '고정' : '메모'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-tertiary)' }}>
            {formatDate(m.createAt)}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--fg-primary)' }}>
          {m.title}
        </div>
        {m.content && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--fg-secondary)',
              lineHeight: 1.55,
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
      </div>
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
      {sorted.map(Card)}
    </div>
  )

  const LoadingState = (
    <div
      className="p-card"
      style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 13,
      }}
    >
      불러오는 중…
    </div>
  )

  const EmptyState = (
    <div
      className="p-card"
      style={{
        padding: 40,
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 13,
      }}
    >
      아직 메모가 없어요
    </div>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>메모</h2>
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
          <div className="sub">가계부와 연결된 메모</div>
        </div>
        <div className="right">{AddBtn}</div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 1320 }}>{Body}</div>
    </div>
  )
}
