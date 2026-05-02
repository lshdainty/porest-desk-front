import { useMemo, useState } from 'react'
import { Bookmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { renderIcon } from '@/shared/lib'
import { KRW } from '@/shared/lib/porest/format'
import { useDeleteExpenseTemplate, useExpenseCategories, useExpenseTemplates } from '@/features/expense'
import type { ExpenseTemplate } from '@/entities/expense-template'
import { PresetEditDialog } from './PresetEditDialog'
import { Card } from '@/shared/ui/card'

type SortKey = 'used' | 'recent' | 'name'

export function PresetManager({ mobile }: { mobile: boolean }) {
  const templatesQ = useExpenseTemplates()
  const categoriesQ = useExpenseCategories()
  const deleteMut = useDeleteExpenseTemplate()

  const items: ExpenseTemplate[] = useMemo(() => templatesQ.data ?? [], [templatesQ.data])
  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data])

  const [sortBy, setSortBy] = useState<SortKey>('used')
  const [editing, setEditing] = useState<ExpenseTemplate | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseTemplate | null>(null)

  const sorted = useMemo(() => {
    const arr = [...items]
    if (sortBy === 'used') arr.sort((a, b) => b.useCount - a.useCount)
    if (sortBy === 'name') arr.sort((a, b) => a.templateName.localeCompare(b.templateName, 'ko'))
    if (sortBy === 'recent') {
      arr.sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''))
    }
    return arr
  }, [items, sortBy])

  const totalUses = items.reduce((s, p) => s + p.useCount, 0)
  const expenseCount = items.filter(p => p.expenseType === 'EXPENSE').length
  const incomeCount = items.filter(p => p.expenseType === 'INCOME').length

  const categoryById = useMemo(() => {
    const m = new Map<number, (typeof categories)[number]>()
    for (const c of categories) m.set(c.rowId, c)
    return m
  }, [categories])

  const onDelete = () => {
    if (!confirmDelete) return
    deleteMut.mutate(confirmDelete.rowId, {
      onSuccess: () => setConfirmDelete(null),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Intro */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-brand-subtle)',
          border: '1px solid var(--mossy-500)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bookmark size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-brand-strong)', marginBottom: 3 }}>
            프리셋이란?
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.55 }}>
            자주 쓰는 내역(점심·커피·교통비 등)을 미리 저장해두면, 내역 추가 화면에서 한 번 탭으로 카테고리·결제수단·내역을 모두 채워넣어요. 금액만 바꿔서 단건으로 저장하기 좋습니다.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <PMStat label="저장된 프리셋" value={String(items.length)} />
        <PMStat label="누적 사용" value={`${totalUses}회`} />
        <PMStat label="지출 / 수입" value={`${expenseCount} / ${incomeCount}`} />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 2,
            background: 'var(--pd-surface-inset)',
            borderRadius: 8,
          }}
        >
          {(
            [
              { k: 'used', l: '사용 많은 순' },
              { k: 'recent', l: '최근 사용' },
              { k: 'name', l: '이름순' },
            ] as { k: SortKey; l: string }[]
          ).map(o => (
            <button
              key={o.k}
              type="button"
              onClick={() => setSortBy(o.k)}
              style={{
                background: sortBy === o.k ? 'var(--bg-surface)' : 'transparent',
                color: sortBy === o.k ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                border: 0,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: sortBy === o.k ? 700 : 500,
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: sortBy === o.k ? 'var(--shadow-xs)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
        <Button
          type="button"
          style={{ padding: '7px 12px', fontSize: 13 }}
          onClick={() => setEditing('new')}
        >
          <Plus size={14} /> 프리셋 추가
        </Button>
      </div>

      {/* List */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {templatesQ.isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
            불러오는 중…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--pd-surface-inset)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Bookmark size={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 4 }}>
              저장된 프리셋이 없어요
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-tertiary)' }}>
              자주 쓰는 내역을 추가해 매번 입력하는 수고를 줄여보세요.
            </div>
          </div>
        ) : (
          sorted.map((p, i) => {
            const cat = p.categoryRowId != null ? categoryById.get(p.categoryRowId) : undefined
            const lock = p.lockAmount === 'Y'
            const amountDisplay = lock && p.amount != null ? KRW(p.amount) : '—'
            return (
              <div
                key={p.rowId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: mobile ? '12px 14px' : '14px 16px',
                  borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: cat
                      ? `color-mix(in oklch, ${cat.color ?? 'var(--mossy-600)'} 18%, transparent)`
                      : 'var(--pd-surface-inset)',
                    color: cat?.color ?? 'var(--fg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cat
                    ? renderIcon(cat.icon, cat.categoryName.charAt(0), 20)
                    : renderIcon(null, '?', 18)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--fg-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.templateName}
                    </div>
                    {p.expenseType === 'INCOME' && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 5px',
                          background: 'var(--mossy-100)',
                          color: 'var(--mossy-700)',
                          borderRadius: 3,
                        }}
                      >
                        수입
                      </span>
                    )}
                    {!lock && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 5px',
                          background: 'var(--pd-surface-inset)',
                          color: 'var(--fg-tertiary)',
                          borderRadius: 3,
                        }}
                      >
                        금액 비움
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--fg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{p.categoryName ?? '카테고리 없음'}</span>
                    {p.merchant && (
                      <>
                        <span style={{ flexShrink: 0 }}>·</span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.merchant}
                        </span>
                      </>
                    )}
                    {!mobile && p.assetName && (
                      <>
                        <span style={{ flexShrink: 0 }}>·</span>
                        <span style={{ flexShrink: 0 }}>{p.assetName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: mobile ? undefined : 80 }}>
                  <div
                    className="num"
                    style={{
                      fontSize: mobile ? 12.5 : 14,
                      fontWeight: 700,
                      color: p.expenseType === 'EXPENSE' ? 'var(--berry-700)' : 'var(--mossy-700)',
                    }}
                  >
                    {lock && p.amount != null
                      ? `${p.expenseType === 'EXPENSE' ? '−' : '+'}${amountDisplay}`
                      : '—'}
                  </div>
                  <div style={{ fontSize: mobile ? 10 : 10.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                    {p.useCount}회{mobile ? '' : ' 사용'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <PMIconBtn icon="pencil" onClick={() => setEditing(p)} title="수정" />
                  <PMIconBtn icon="trash" tone="danger" onClick={() => setConfirmDelete(p)} title="삭제" />
                </div>
              </div>
            )
          })
        )}
      </Card>

      {editing != null && (
        <PresetEditDialog
          preset={editing === 'new' ? null : editing}
          mobile={mobile}
          onClose={() => setEditing(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="프리셋 삭제"
          message={
            <>
              "<strong>{confirmDelete.templateName}</strong>" 프리셋을 삭제할까요?
              이미 저장된 거래 내역에는 영향이 없습니다.
            </>
          }
          confirmLabel="삭제"
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

function PMStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--pd-surface-inset)', borderRadius: 8 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="num"
        style={{ fontSize: 17, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
    </div>
  )
}

function PMIconBtn({
  icon,
  tone,
  onClick,
  title,
}: {
  icon: 'pencil' | 'trash'
  tone?: 'danger'
  onClick: () => void
  title: string
}) {
  const Comp = icon === 'pencil' ? Pencil : Trash2
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: tone === 'danger' ? 'var(--berry-700)' : 'var(--fg-secondary)',
        fontFamily: 'inherit',
      }}
    >
      <Comp size={15} strokeWidth={1.9} />
    </button>
  )
}
