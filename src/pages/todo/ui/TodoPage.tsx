import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTodos, useToggleTodoStatus } from '@/features/todo'
import type { Todo, TodoPriority } from '@/entities/todo'
import { Button } from '@/shared/ui/button'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

const PRIORITY_STYLE: Record<TodoPriority, { bg: string; fg: string; label: string }> = {
  HIGH: { bg: 'oklch(0.95 0.03 15)', fg: 'var(--berry-700)', label: '중요' },
  MEDIUM: { bg: 'var(--status-warning-subtle)', fg: 'var(--status-warning-fg)', label: '보통' },
  LOW: { bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)', label: '여유' },
}

export const TodoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
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
          borderRadius: 10,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          opacity: isDone ? 0.55 : 1,
        }}
      >
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => toggleStatus.mutate(t.rowId)}
          style={{ width: 18, height: 18, accentColor: 'var(--mossy-600)' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: isDone ? 'line-through' : 'none',
              color: 'var(--fg-primary)',
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              fontSize: 11.5,
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
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: tag.color ? `${tag.color}22` : 'var(--pd-surface-inset)',
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
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
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
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <Plus size={14} /> 할 일 추가
    </Button>
  )

  const SectionHead = (label: string, count: number) => (
    <div
      style={{
        fontSize: 11,
        color: 'var(--fg-tertiary)',
        fontWeight: 600,
        letterSpacing: '0.06em',
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
        fontSize: 12.5,
      }}
    >
      {msg}
    </div>
  )

  const Body = (
    <>
      {todosQ.isLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
          불러오는 중…
        </div>
      ) : todos.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>할 일</h2>
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
