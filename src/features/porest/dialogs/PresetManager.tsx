import { useMemo, useState } from 'react'
import { Bookmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { renderIcon } from '@/shared/lib'
import { KRW } from '@/shared/lib/porest/format'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { useDeleteExpenseTemplate, useExpenseCategories, useExpenseTemplates } from '@/features/expense'
import type { ExpenseTemplate } from '@/entities/expense-template'
import { PresetEditDialog } from './PresetEditDialog'
import { Card } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

type SortKey = 'used' | 'recent' | 'name'

// 모바일 카드 다이어트 — 리스트 셸: 모바일은 카드 없이, 데스크톱은 Card (.m-subpage 정합).
function ListShell({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  return mobile ? <div>{children}</div> : <Card style={{ overflow: 'hidden' }}>{children}</Card>
}

export function PresetManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('expense')
  const { t: tCommon } = useTranslation('common')
  const templatesQ = useExpenseTemplates()
  const categoriesQ = useExpenseCategories()
  const deleteMut = useDeleteExpenseTemplate()

  const isLoading = templatesQ.isLoading || categoriesQ.isLoading

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* 묶음 1 — 배너 + 취합카드(상단 정보 블록). 내부 gap md, 최상위 16 으로 묶음 2 와 분리(사용자 결정). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Intro */}
      <div
        style={{
          padding: 14,
          background: 'var(--bg-brand-subtle)',
          border: '1px solid var(--border-brand)',
          borderRadius: 'var(--radius-tile)',
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
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bookmark size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-brand-strong)', marginBottom: 3 }}>
            {t('preset.introTitle')}
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', lineHeight: '1.5' }}>
            {t('preset.introDesc')}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
              <SkeletonBase className="h-3 w-16 mb-1.5" />
              <SkeletonBase className="h-6 w-12" />
            </div>
          ))
        ) : (
          <>
            <PMStat label={t('preset.statSaved')} value={String(items.length)} />
            <PMStat label={t('preset.statUses')} value={t('txDetail.countTimes', { count: totalUses })} />
            <PMStat label={`${t('expense')} / ${t('income')}`} value={`${expenseCount} / ${incomeCount}`} />
          </>
        )}
      </div>
      </div>

      {/* 묶음 2 — Toolbar(정렬 toggle) + List. toggle 이 list 바로 위에 붙도록 내부 gap 0
          (사용자 결정), 다른 묶음과는 최상위 gap(xl)으로 분리. */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
        <Tabs
          value={sortBy}
          onValueChange={(v) => v && setSortBy(v as SortKey)}
          className="w-auto"
        >
          <TabsList variant="pills" size="sm">
            {(
              [
                { k: 'used', l: t('preset.sortUsed') },
                { k: 'recent', l: t('preset.sortRecent') },
                { k: 'name', l: t('preset.sortName') },
              ] as { k: SortKey; l: string }[]
            ).map((o) => (
              <TabsTrigger key={o.k} value={o.k}>
                {o.l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          type="button"
          variant="accent"
          style={{ padding: '7px 12px', fontSize: 'var(--text-label-sm)' }}
          onClick={() => setEditing('new')}
        >
          <Plus size={14} /> {t('preset.add')}
        </Button>
      </div>

      {/* List — 모바일 카드 다이어트: 셸 카드 벗김 (.m-subpage) */}
      <ListShell mobile={mobile}>
        {isLoading ? (
          <PresetManagerSkeleton mobile={mobile} />
        ) : sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-sunken)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Bookmark size={22} />
            </div>
            <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700', color: 'var(--fg-primary)', marginBottom: 4 }}>
              {t('preset.emptyTitle')}
            </div>
            <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-tertiary)' }}>
              {t('preset.emptyDesc')}
            </div>
          </div>
        ) : (
          sorted.map((p, i) => {
            const cat = p.categoryRowId != null ? categoryById.get(p.categoryRowId) : undefined
            const palette = cat ? getPaletteByColor(cat.color) : null
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
                    borderRadius: 'var(--radius-tile)',
                    background: palette ? palette.bg : 'var(--bg-sunken)',
                    color: palette ? palette.color : 'var(--fg-tertiary)',
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
                        fontSize: 'var(--text-body-sm)',
                        fontWeight: '700',
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
                          fontSize: 'var(--text-badge)',
                          fontWeight: '700',
                          padding: '1px 5px',
                          background: 'var(--bg-income-subtle)',
                          color: 'var(--fg-income)',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        {t('income')}
                      </span>
                    )}
                    {!lock && (
                      <span
                        style={{
                          fontSize: 'var(--text-badge)',
                          fontWeight: '600',
                          padding: '1px 5px',
                          background: 'var(--bg-sunken)',
                          color: 'var(--fg-tertiary)',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        {t('preset.amountEmpty')}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-caption)',
                      color: 'var(--fg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{p.categoryName ?? t('preset.noCategory')}</span>
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
                      fontWeight: '700',
                      color: p.expenseType === 'EXPENSE' ? 'var(--fg-expense)' : 'var(--fg-income)',
                    }}
                  >
                    {lock && p.amount != null
                      ? `${p.expenseType === 'EXPENSE' ? '−' : '+'}${amountDisplay}`
                      : '—'}
                  </div>
                  <div style={{ fontSize: mobile ? 10 : 10.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                    {mobile
                      ? t('txDetail.countTimes', { count: p.useCount })
                      : t('preset.usedTimes', { count: p.useCount })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <PMIconBtn icon="pencil" onClick={() => setEditing(p)} title={tCommon('edit')} />
                  <PMIconBtn icon="trash" tone="danger" onClick={() => setConfirmDelete(p)} title={tCommon('delete')} />
                </div>
              </div>
            )
          })
        )}
      </ListShell>
      </div>

      {editing != null && (
        <PresetEditDialog
          preset={editing === 'new' ? null : editing}
          mobile={mobile}
          onClose={() => setEditing(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t('preset.deleteTitle')}
          message={
            <Trans
              t={t}
              i18nKey="preset.deleteConfirmMessage"
              values={{ name: confirmDelete.templateName }}
              components={{ strong: <strong /> }}
            />
          }
          confirmLabel={tCommon('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

/** PresetManager skeleton — 프리셋 row 리스트(icon + name/meta + amount + actions). */
function PresetManagerSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: mobile ? '12px 14px' : '14px 16px',
            borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
          }}
        >
          <SkeletonBase className="h-10 w-10 rounded-md shrink-0" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonBase className="h-4 w-32 mb-1.5" />
            <SkeletonBase className="h-3 w-2/3" />
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right', minWidth: mobile ? undefined : 80 }}>
            <SkeletonBase className="h-4 w-20 ml-auto mb-1" />
            <SkeletonBase className="h-3 w-12 ml-auto" />
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <SkeletonBase className="h-8 w-8 rounded-md" />
            <SkeletonBase className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </>
  )
}

function PMStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)' }}>
      <div
        style={{
          fontSize: 'var(--text-badge)',
          fontWeight: '600',
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
        style={{ fontSize: 'var(--text-title-md)', fontWeight: '800', color: 'var(--fg-primary)', letterSpacing: '-0.022em' }}
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
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={tone === 'danger' ? '!text-[var(--fg-expense)]' : undefined}
    >
      <Comp size={16} strokeWidth={1.9} />
    </Button>
  )
}
