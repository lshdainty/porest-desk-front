import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTodos, useToggleTodoStatus } from '@/features/todo'
import type { Todo, TodoPriority } from '@/entities/todo'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// 세 priority 모두 *-subtle bg + *-fg text 패턴으로 통일 (라이트/다크 자동 swap).
const PRIORITY_STYLE: Record<TodoPriority, { bg: string; fg: string; label: string }> = {
  HIGH: { bg: 'var(--status-danger-subtle)', fg: 'var(--status-danger-fg)', label: '중요' },
  MEDIUM: { bg: 'var(--status-warning-subtle)', fg: 'var(--status-warning-fg)', label: '보통' },
  LOW: { bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)', label: '여유' },
}

/** TodoPage 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계. */
function useTodoPageData() {
  const todosQ = useTodos()
  return {
    isLoading: todosQ.isLoading,
  }
}

/** Todo row skeleton — checkbox + title + meta + priority badge. */
function TodoRowSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-tile)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <SkeletonBase className="h-[18px] w-[18px] rounded-sm shrink-0" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBase className="h-4 w-3/5 mb-1.5" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      <SkeletonBase className="h-5 w-12 rounded-full shrink-0" />
    </div>
  )
}

function TodoSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SkeletonBase className="h-3 w-20 mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <TodoRowSkeleton key={i} />
      ))}
    </div>
  )
}

/** Todo 페이지 구조 일치 skeleton — 헤더 + 추가 버튼 + 진행중/완료 섹션. */
function TodoPageSkeleton({ mobile }: { mobile: boolean }) {
  const Body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TodoSectionSkeleton rows={3} />
      <TodoSectionSkeleton rows={2} />
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
        {Body}
      </div>
    )
  }
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <SkeletonBase className="h-8 w-20 mb-2" />
          <SkeletonBase className="h-4 w-32" />
        </div>
        <div className="right">
          <SkeletonBase className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 720 }}>{Body}</div>
    </div>
  )
}

export const TodoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useTodoPageData()
  if (isLoading) return <TodoPageSkeleton mobile={mobile} />
  return <TodoPageInner mobile={mobile} />
}

const TodoPageInner = ({ mobile }: { mobile: boolean }) => {
  const todosQ = useTodos()
  const toggleStatus = useToggleTodoStatus()

  const todos: Todo[] = todosQ.data ?? []
  const pending = todos.filter(t => t.status !== 'COMPLETED')
  const done = todos.filter(t => t.status === 'COMPLETED')

  const Row = (t: Todo) => {
    const prio = PRIORITY_STYLE[t.priority]
    const isDone = t.status === 'COMPLETED'
    return (
      <label
        key={t.rowId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 'var(--radius-tile)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          opacity: isDone ? 0.55 : 1,
        }}
      >
        <Checkbox
          checked={isDone}
          onCheckedChange={() => toggleStatus.mutate(t.rowId)}
          onClick={(e) => e.stopPropagation()}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--fw-semi)',
              textDecoration: isDone ? 'line-through' : 'none',
              color: 'var(--fg-primary)',
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--fg-tertiary)',
              marginTop: 2,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {t.dueDate && <span>{t.dueDate.slice(5, 10)}</span>}
            {t.tags && t.tags.length > 0 && (
              <>
                {t.dueDate && <span>·</span>}
                <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.tags.map(tag => (
                    <span
                      key={tag.rowId}
                      style={{
                        fontSize: 'var(--text-badge)',
                        fontWeight: 'var(--fw-semi)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)',
                        background: tag.color ? `${tag.color}22` : 'var(--bg-sunken)',
                        color: tag.color ?? 'var(--fg-secondary)',
                      }}
                    >
                      {tag.tagName}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: 'var(--text-badge)',
            fontWeight: 'var(--fw-bold)',
            padding: '3px 9px',
            borderRadius: 'var(--radius-pill)',
            background: prio.bg,
            color: prio.fg,
            flexShrink: 0,
          }}
        >
          {prio.label}
        </span>
      </label>
    )
  }

  const AddBtn = (
    <Button
      size="sm"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--bg-brand)',
        color: 'var(--fg-on-brand)',
        border: 0,
        borderRadius: 'var(--radius-tile)',
        padding: '8px 14px',
        fontSize: 'var(--text-label-sm)',
        fontWeight: 'var(--fw-bold)',
        cursor: 'pointer',
      }}
    >
      <Plus size={14} /> 할 일 추가
    </Button>
  )

  const SectionHead = (label: string, count: number) => (
    <div
      style={{
        fontSize: 'var(--text-badge)',
        color: 'var(--fg-tertiary)',
        fontWeight: 'var(--fw-semi)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}
    >
      {label} · {count}
    </div>
  )

  const EmptyHint = (msg: string) => (
    <div
      style={{
        padding: '16px 0',
        textAlign: 'center',
        color: 'var(--fg-tertiary)',
        fontSize: 'var(--text-label-sm)',
      }}
    >
      {msg}
    </div>
  )

  const Body = (
    <>
      {todosQ.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TodoSectionSkeleton rows={3} />
          <TodoSectionSkeleton rows={2} />
        </div>
      ) : todos.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
          할 일이 없어요
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {SectionHead('진행 중', pending.length)}
            {pending.length === 0 ? EmptyHint('진행 중인 할 일이 없어요') : pending.map(Row)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SectionHead('완료', done.length)}
            {done.length === 0 ? EmptyHint('완료된 할 일이 없어요') : done.map(Row)}
          </div>
        </>
      )}
    </>
  )

  if (mobile) {
    return (
      <div style={{ padding: '4px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 'var(--text-title-md)', fontWeight: 'var(--fw-bold)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>할 일</h2>
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
          <h1>할 일</h1>
          <div className="sub">할 일과 작업 관리</div>
        </div>
        <div className="right">{AddBtn}</div>
      </div>
      <div style={{ padding: '0 28px 24px', maxWidth: 720 }}>{Body}</div>
    </div>
  )
}
