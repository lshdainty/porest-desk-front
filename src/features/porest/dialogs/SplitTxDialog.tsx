import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  MoveUp,
  Plus,
  PlusCircle,
  Scale,
  Scissors,
  Sparkles,
  X,
} from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { KRW, money } from '@/shared/lib/porest/format'
import {
  useExpenseSplits,
  useReplaceExpenseSplits,
  useDeleteAllExpenseSplits,
} from '@/features/expense-split'
import { useExpenseCategories } from '@/features/expense'
import { getPaletteByColor } from './CategoryEditDialog'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import type { Expense } from '@/entities/expense'
import type { ExpenseSplitFormValue } from '@/entities/expense-split'

type Row = {
  uid: string
  categoryRowId: number | null
  amount: string
  label: string
}

const newUid = () => Math.random().toString(36).slice(2, 9)

/**
 * 금액 배열의 합이 정확히 target이 되도록 잔차를 분배한다(항상 균형).
 * - target이 행 수 이상이면 모든 행을 1 이상으로 유지(분할 행은 0원이 의미 없고 저장 게이트가 >0 요구).
 * - 부족(diff>0)은 가장 큰 행에 더하고, 초과(diff<0)는 큰 행부터 floor까지 깎아 흡수.
 * clamp가 잔차를 삼켜 합이 어긋나던 문제(비례 배분·큰 항목 반영)를 제거한다.
 */
const settleRemainder = (amts: number[], target: number): number[] => {
  const n = amts.length
  if (n === 0) return amts
  const floor = target >= n ? 1 : 0
  const out = amts.map(v => Math.max(floor, Math.round(v)))
  const diff = target - out.reduce((s, v) => s + v, 0)
  const order = out.map((_, i) => i).sort((a, b) => (out[b] ?? 0) - (out[a] ?? 0))
  if (diff > 0) {
    const top = order[0] ?? 0
    out[top] = (out[top] ?? 0) + diff
  } else if (diff < 0) {
    let need = -diff
    for (const idx of order) {
      if (need <= 0) break
      const take = Math.min((out[idx] ?? 0) - floor, need)
      out[idx] = (out[idx] ?? 0) - take
      need -= take
    }
  }
  return out
}

type ReconcileStrategy = 'prop' | 'largest' | 'add'

type Props = {
  expense: Expense
  onClose: () => void
  mobile: boolean
  /**
   * 일치화 목표 총액. 미지정이면 expense.amount(절대값) 사용.
   * 거래 편집 중 바뀐 금액에 분할을 맞출 때 새 금액을 전달한다.
   */
  overrideTotal?: number
  /** 변경 전 총액 — 전/후 비교 배지에 사용(거래 편집 일치화 시). */
  recordedTotal?: number
  /** 초기 분할 시드(편집 일치화 시 진행 중 분할 반영). 미지정이면 서버 분할/기본값으로 시드. */
  initialSplits?: ExpenseSplitFormValue[]
  /**
   * 지정되면 "분할 저장"이 서버 저장(replace) 대신 이 콜백으로 분할을 반환한다.
   * 거래 편집 화면이 금액+분할을 한 번에 원자적으로 저장하기 위한 일치화 모드.
   */
  onReconciled?: (splits: ExpenseSplitFormValue[]) => void
}

export function SplitTxDialog({
  expense,
  onClose,
  mobile,
  overrideTotal,
  recordedTotal,
  initialSplits,
  onReconciled,
}: Props) {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const persistedTotal = Math.abs(expense.amount)
  const targetTotal = overrideTotal ?? persistedTotal
  const isIncome = expense.expenseType === 'INCOME'
  const reconcileMode = !!onReconciled
  // 전/후 배지: 편집 일치화로 목표 총액이 기존 총액과 다를 때만 노출.
  const recordedTotalForBadge = recordedTotal ?? persistedTotal
  const totalChanged = overrideTotal != null && overrideTotal !== recordedTotalForBadge

  const splitsQ = useExpenseSplits(expense.rowId)
  const categoriesQ = useExpenseCategories()
  const replaceMut = useReplaceExpenseSplits()
  const deleteAllMut = useDeleteAllExpenseSplits()

  const isLoading = categoriesQ.isLoading || (!initialSplits && splitsQ.isLoading)

  const sameTypeCategories = useMemo(
    () => (categoriesQ.data ?? []).filter(c => c.expenseType === expense.expenseType),
    [categoriesQ.data, expense.expenseType],
  )

  const [rows, setRows] = useState<Row[] | null>(null)
  const [lastApplied, setLastApplied] = useState<ReconcileStrategy | null>(null)
  // 빠르게 맞추기(일치화 전략) 접힘 상태 — 기본 접힘(footer 정리 후 패널 군더더기 최소화).
  const [quickOpen, setQuickOpen] = useState(false)

  useEffect(() => {
    if (rows !== null) return
    let seed: Row[] | null = null
    if (initialSplits) {
      // 편집 일치화: 진행 중 분할(initialSplits)로 시드
      seed = initialSplits.map(s => ({
        uid: newUid(),
        categoryRowId: s.categoryRowId,
        amount: String(s.amount),
        label: s.label ?? '',
      }))
    } else if (splitsQ.data === undefined) {
      return
    } else if (splitsQ.data.length > 0) {
      seed = splitsQ.data.map(s => ({
        uid: newUid(),
        categoryRowId: s.categoryRowId,
        amount: String(s.amount),
        label: s.label ?? '',
      }))
    } else {
      const half = Math.floor(targetTotal / 2)
      seed = [
        {
          uid: newUid(),
          categoryRowId: expense.categoryRowId,
          amount: String(targetTotal - half),
          label: expense.merchant ?? expense.description ?? '',
        },
        { uid: newUid(), categoryRowId: expense.categoryRowId, amount: String(half), label: '' },
      ]
    }
    // 비동기 로드된 분할/초기값으로 1회 시드 — 외부 데이터 초기화 목적의 의도된 setState
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(seed)
  }, [splitsQ.data, rows, initialSplits, expense.categoryRowId, expense.merchant, expense.description, targetTotal])

  const safeRows = rows ?? []
  const sumAmount = safeRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const remainder = targetTotal - sumAmount
  const matched = remainder === 0 && safeRows.length >= 2
    && safeRows.every(r => r.categoryRowId && Number(r.amount) > 0)
  // 합계는 맞지만(잔액 0) 카테고리 누락·행 부족 등으로 미저장 가능 — '0원 초과' 오표기 방지용 분기.
  const balanced = remainder === 0

  const addRow = () => {
    setLastApplied(null)
    setRows([
      ...(safeRows),
      {
        uid: newUid(),
        categoryRowId: expense.categoryRowId,
        amount: String(Math.max(0, remainder)),
        label: '',
      },
    ])
  }

  const removeRow = (uid: string) => {
    setLastApplied(null)
    setRows(safeRows.filter(r => r.uid !== uid))
  }

  const updateRow = (uid: string, patch: Partial<Row>) => {
    setLastApplied(null)
    setRows(safeRows.map(r => (r.uid === uid ? { ...r, ...patch } : r)))
  }

  const splitEvenly = () => {
    if (safeRows.length === 0) return
    setLastApplied(null)
    const each = Math.floor(targetTotal / safeRows.length)
    const rest = targetTotal - each * safeRows.length
    setRows(
      safeRows.map((r, i) => ({
        ...r,
        amount: String(i === 0 ? each + rest : each),
      })),
    )
  }

  // ── 일치화(reconcile) 전략 ─────────────────────────────────────────────
  // ① 비례 배분 — 현재 금액 비중대로 새 총액에 맞춰 재분배(잔차까지 정확히 흡수).
  const reconcileProportional = () => {
    const base = safeRows.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 1
    const scaled = safeRows.map(r => (Number(r.amount) || 0) * targetTotal / base)
    const settled = settleRemainder(scaled, targetTotal)
    setRows(safeRows.map((r, i) => ({ ...r, amount: String(settled[i] ?? 0) })))
    setLastApplied('prop')
  }
  // ② 가장 큰 항목에 차액 반영(차액이 커서 한 항목으로 부족하면 다음 큰 항목으로 흘려보냄).
  const reconcileToLargest = () => {
    if (safeRows.length === 0) return
    const amts = safeRows.map(r => Number(r.amount) || 0)
    const settled = settleRemainder(amts, targetTotal)
    setRows(safeRows.map((r, i) => ({ ...r, amount: String(settled[i] ?? 0) })))
    setLastApplied('largest')
  }
  // ③ 부족분을 새 조정 항목으로 추가(부족 케이스 전용 — 초과 시엔 버튼을 노출하지 않음).
  const reconcileAddRow = () => {
    if (remainder <= 0) return
    setRows([
      ...safeRows,
      {
        uid: newUid(),
        categoryRowId: expense.categoryRowId,
        amount: String(remainder),
        label: t('splitTx.extraAmount'),
      },
    ])
    setLastApplied('add')
  }

  // 일치화 빠른 전략 — '조정 항목'은 부족(remainder>0)일 때만 의미가 있어 그때만 노출.
  const strategies = [
    { key: 'prop' as const, Icon: Scale, title: t('splitTx.strategy.prop.title'), desc: t('splitTx.strategy.prop.desc'), recommended: totalChanged, onClick: reconcileProportional },
    { key: 'largest' as const, Icon: MoveUp, title: t('splitTx.strategy.largest.title'), desc: t('splitTx.strategy.largest.desc'), recommended: false, onClick: reconcileToLargest },
    ...(remainder > 0
      ? [{ key: 'add' as const, Icon: PlusCircle, title: t('splitTx.strategy.add.title'), desc: t('splitTx.strategy.add.desc'), recommended: false, onClick: reconcileAddRow }]
      : []),
  ]

  const handleSave = () => {
    if (!matched) return
    const payload: ExpenseSplitFormValue[] = safeRows.map((r, i) => ({
      categoryRowId: r.categoryRowId as number,
      amount: Number(r.amount),
      label: r.label.trim() || null,
      sortOrder: i,
    }))
    if (onReconciled) {
      onReconciled(payload)
      return
    }
    replaceMut.mutate(
      { expenseId: expense.rowId, splits: payload },
      { onSuccess: () => onClose() },
    )
  }

  const handleDeleteAll = () => {
    deleteAllMut.mutate(expense.rowId, { onSuccess: () => onClose() })
  }

  const submitting = replaceMut.isPending || deleteAllMut.isPending

  // 분할 비율 색
  const ratioSegments = safeRows.map(r => {
    const cat = sameTypeCategories.find(c => c.rowId === r.categoryRowId)
    const pal = getPaletteByColor(cat?.color)
    const amt = Number(r.amount) || 0
    const pct = targetTotal > 0 ? Math.round((amt / targetTotal) * 100) : 0
    return { color: pal.color, name: cat?.categoryName ?? t('splitTx.unselected'), pct }
  })

  const Footer = (
    <ModalFooter
      onSave={handleSave}
      saveLabel={t('splitTx.save')}
      saving={replaceMut.isPending}
      saveDisabled={!matched}
      onCancel={onClose}
      cancelLabel={tc('cancel')}
      onDelete={!reconcileMode && (splitsQ.data?.length ?? 0) > 0 ? handleDeleteAll : undefined}
      deleteLabel={t('splitTx.remove')}
      deleting={deleteAllMut.isPending}
    />
  )

  if (isLoading) {
    return (
      <ModalShell title={t('splitTitle')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
        <SplitTxSkeleton />
      </ModalShell>
    )
  }

  return (
    <ModalShell title={t('splitTitle')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: '1.5' }}>
        {t('splitTx.description')}
      </p>

      {/* Source summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('splitTx.sourceTransaction')}</div>
          <div style={{ fontWeight: '700', fontSize: 'var(--text-body-sm)' }}>
            {expense.merchant || expense.description || t('transaction')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('splitTx.total')}</div>
          {totalChanged ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
              <span
                className="num"
                style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', textDecoration: 'line-through' }}
              >
                {KRW(recordedTotalForBadge)}
              </span>
              <ArrowRight size={12} style={{ color: 'var(--fg-tertiary)' }} />
              <span
                className="num"
                style={{ fontWeight: '800', fontSize: 'var(--text-title-md)', color: 'var(--status-warning-fg)' }}
              >
                {isIncome ? '+' : '−'}{money(targetTotal)}
              </span>
            </div>
          ) : (
            <div
              className="num"
              style={{
                fontWeight: '800',
                fontSize: 'var(--text-title-md)',
                color: isIncome ? 'var(--fg-brand)' : 'var(--fg-primary)',
              }}
            >
              {isIncome ? '+' : '−'}{money(targetTotal)}
            </div>
          )}
        </div>
      </div>

      {/* 상태 패널 — 일치(success)/불일치(warning). footer 검증 pill 대체. */}
      {safeRows.length > 0 && (matched ? (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--status-success-subtle)',
            border: '1px solid var(--status-success-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Check size={15} style={{ color: 'var(--status-success-fg)' }} />
            <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
              {t('splitTx.matched')}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', lineHeight: '1.5' }}>
            {t('splitTx.splitSum')} <b className="num">{money(sumAmount)}</b> · {t('splitTx.total')} <b className="num">{money(targetTotal)}</b>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--status-warning-subtle)',
            border: '1px solid var(--status-warning-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <AlertTriangle size={15} style={{ color: 'var(--status-warning-fg)' }} />
            <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
              {!balanced
                ? (totalChanged ? t('splitTx.totalChangedWarn') : t('splitTx.mismatchWarn'))
                : t('splitTx.checkItems')}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', lineHeight: '1.5' }}>
            {t('splitTx.splitSum')} <b className="num">{money(sumAmount)}</b> · {t('splitTx.total')} <b className="num">{money(targetTotal)}</b>
            {!balanced && (
              <>
                {' · '}
                <b className="num" style={{ color: 'var(--status-warning-fg)' }}>
                  {remainder > 0 ? t('splitTx.short') : t('splitTx.over')} {money(Math.abs(remainder))}
                </b>
              </>
            )}
          </div>
          {!balanced && (
            <>
              <button
                type="button"
                onClick={() => setQuickOpen(o => !o)}
                aria-expanded={quickOpen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'var(--text-badge)',
                  fontWeight: '700',
                  color: 'var(--fg-brand)',
                }}
              >
                <Sparkles size={14} /> {t('splitTx.quickAdjust')} {quickOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {quickOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : `repeat(${strategies.length}, 1fr)`, gap: 8, marginTop: 10 }}>
                  {strategies.map(s => (
                    <ReconcileBtn
                      key={s.key}
                      Icon={s.Icon}
                      title={s.title}
                      desc={s.desc}
                      active={lastApplied === s.key}
                      recommended={s.recommended}
                      onClick={s.onClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {safeRows.map((r, idx) => {
          const cat = sameTypeCategories.find(c => c.rowId === r.categoryRowId)
          const pal = getPaletteByColor(cat?.color)
          const pct = targetTotal > 0 ? Math.round(((Number(r.amount) || 0) / targetTotal) * 100) : 0
          return (
            <div
              key={r.uid}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {/* 헤더: 색 점 + 항목 N + 비율 + 삭제 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: pal.color, flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', fontWeight: '600' }}>{t('splitTx.itemN', { n: idx + 1 })}</span>
                <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '700' }}>{pct}%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(r.uid)}
                  disabled={submitting || safeRows.length <= 1}
                  aria-label={t('splitTx.deleteItem')}
                  className="h-6 w-6 rounded-full text-[var(--fg-tertiary)]"
                >
                  <X size={14} />
                </Button>
              </div>

              {/* 항목 이름 */}
              <Input
                value={r.label}
                onChange={e => updateRow(r.uid, { label: e.target.value })}
                placeholder={t('splitTx.itemNamePlaceholder')}
                disabled={submitting}
              />

              {/* 카테고리 + 금액 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Select
                    value={r.categoryRowId ? String(r.categoryRowId) : ''}
                    onValueChange={val => updateRow(r.uid, { categoryRowId: Number(val) })}
                  >
                    <SelectTrigger style={{ background: 'var(--bg-surface)', width: '100%' }}>
                      <SelectValue placeholder={t('category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {sameTypeCategories.map(c => (
                        <SelectItem key={c.rowId} value={String(c.rowId)}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ flex: '1.4', minWidth: 0, position: 'relative' }}>
                  <Input
                    className="num"
                    value={r.amount}
                    onChange={e => updateRow(r.uid, { amount: e.target.value.replace(/[^0-9]/g, '') })}
                    inputMode="numeric"
                    placeholder="0"
                    disabled={submitting}
                    style={{ paddingRight: 28, textAlign: 'right' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 'var(--text-caption)',
                      color: 'var(--fg-tertiary)',
                      pointerEvents: 'none',
                    }}
                  >
                    원
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'space-between' }}>
        <Button type="button" variant="ghost" size="sm" onClick={addRow} disabled={submitting}>
          <Plus size={14} /> {t('splitTx.addItem')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={splitEvenly} disabled={submitting}>
          <Scissors size={14} /> {t('splitTx.splitEvenly')}
        </Button>
      </div>

      {/* 분할 비율 */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 'var(--text-caption)', fontWeight: '700', color: 'var(--fg-secondary)', marginBottom: 6 }}>
          {t('splitTx.ratio')}
        </div>
        <div
          style={{
            display: 'flex',
            height: 10,
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
            background: 'var(--bg-sunken)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {ratioSegments.map((seg, i) => (
            <div
              key={i}
              style={{
                width: `${seg.pct}%`,
                background: seg.color,
                transition: 'width 0.2s',
              }}
              title={`${seg.name} ${seg.pct}%`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
          {ratioSegments.map((seg, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-caption)' }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-pill)',
                  background: seg.color,
                }}
              />
              <span style={{ color: 'var(--fg-secondary)' }}>{seg.name}</span>
              <span className="num" style={{ fontWeight: '700', color: 'var(--fg-primary)' }}>
                {seg.pct}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}

/** 일치화 빠른 전략 버튼 — 아이콘 + 제목 + 설명, active/추천 상태. (TxDetail QuickBtn 패턴) */
function ReconcileBtn({
  Icon,
  title,
  desc,
  active,
  recommended,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  desc: string
  active?: boolean
  recommended?: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation('expense')
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '10px 11px',
        textAlign: 'left',
        background: active ? 'var(--status-warning-subtle)' : 'var(--bg-surface)',
        border: active
          ? '1px solid var(--status-warning-fg)'
          : '1px solid var(--status-warning-border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* 앱과 동일: 아이콘 왼쪽 + 제목·설명 세로 컬럼 */}
      <span style={{ display: 'inline-flex', color: 'var(--status-warning-fg)', flexShrink: 0 }}>
        <Icon size={16} strokeWidth={2} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>{title}</span>
          {recommended && (
            <span
              style={{
                fontSize: 'var(--text-badge)',
                fontWeight: '700',
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--status-warning-subtle)',
                color: 'var(--status-warning-fg)',
              }}
            >
              {t('splitTx.recommended')}
            </span>
          )}
        </span>
        <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-secondary)', lineHeight: '1.3' }}>{desc}</span>
      </span>
      {active && <Check size={14} style={{ color: 'var(--status-warning-fg)', flexShrink: 0 }} />}
    </button>
  )
}

/** SplitTx skeleton — 원거래 카드 + 분할 row + 비율 바. */
function SplitTxSkeleton() {
  return (
    <>
      <SkeletonBase className="h-4 w-2/3 mb-3.5" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div>
          <SkeletonBase className="h-3 w-10 mb-1.5" />
          <SkeletonBase className="h-4 w-24" />
        </div>
        <div style={{ textAlign: 'right' }}>
          <SkeletonBase className="h-3 w-10 ml-auto mb-1.5" />
          <SkeletonBase className="h-6 w-24" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1.4fr 1fr 1.1fr auto',
              gap: 8,
              alignItems: 'center',
              padding: '8px 10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <SkeletonBase className="h-6 w-6 rounded-full" />
            <SkeletonBase className="h-9 w-full" />
            <SkeletonBase className="h-9 w-full" />
            <SkeletonBase className="h-9 w-full" />
            <SkeletonBase className="h-7 w-7 rounded-full" />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'space-between' }}>
        <SkeletonBase className="h-9 w-24" />
        <SkeletonBase className="h-9 w-24" />
      </div>

      <div style={{ marginTop: 4 }}>
        <SkeletonBase className="h-3 w-16 mb-2" />
        <SkeletonBase className="h-2.5 w-full rounded-full" />
      </div>
    </>
  )
}
