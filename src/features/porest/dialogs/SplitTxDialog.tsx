import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Scissors, Trash2, X } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { KRW } from '@/shared/lib/porest/format'
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

type Props = {
  expense: Expense
  onClose: () => void
  mobile: boolean
}

export function SplitTxDialog({ expense, onClose, mobile }: Props) {
  const totalAbs = Math.abs(expense.amount)
  const isIncome = expense.expenseType === 'INCOME'

  const splitsQ = useExpenseSplits(expense.rowId)
  const categoriesQ = useExpenseCategories()
  const replaceMut = useReplaceExpenseSplits()
  const deleteAllMut = useDeleteAllExpenseSplits()

  const isLoading = splitsQ.isLoading || categoriesQ.isLoading

  const sameTypeCategories = useMemo(
    () => (categoriesQ.data ?? []).filter(c => c.expenseType === expense.expenseType),
    [categoriesQ.data, expense.expenseType],
  )

  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    if (rows !== null) return
    if (splitsQ.data === undefined) return
    if (splitsQ.data.length > 0) {
      setRows(
        splitsQ.data.map(s => ({
          uid: newUid(),
          categoryRowId: s.categoryRowId,
          amount: String(s.amount),
          label: s.label ?? '',
        })),
      )
    } else {
      const half = Math.floor(totalAbs / 2)
      setRows([
        {
          uid: newUid(),
          categoryRowId: expense.categoryRowId,
          amount: String(totalAbs - half),
          label: expense.merchant ?? expense.description ?? '',
        },
        { uid: newUid(), categoryRowId: expense.categoryRowId, amount: String(half), label: '' },
      ])
    }
  }, [splitsQ.data, rows, expense.categoryRowId, expense.merchant, expense.description, totalAbs])

  const safeRows = rows ?? []
  const sumAmount = safeRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const remainder = totalAbs - sumAmount
  const matched = remainder === 0 && safeRows.length >= 2
    && safeRows.every(r => r.categoryRowId && Number(r.amount) > 0)

  const addRow = () => {
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
    setRows(safeRows.filter(r => r.uid !== uid))
  }

  const updateRow = (uid: string, patch: Partial<Row>) => {
    setRows(safeRows.map(r => (r.uid === uid ? { ...r, ...patch } : r)))
  }

  const splitEvenly = () => {
    if (safeRows.length === 0) return
    const each = Math.floor(totalAbs / safeRows.length)
    const rest = totalAbs - each * safeRows.length
    setRows(
      safeRows.map((r, i) => ({
        ...r,
        amount: String(i === 0 ? each + rest : each),
      })),
    )
  }

  const handleSave = () => {
    if (!matched) return
    const payload: ExpenseSplitFormValue[] = safeRows.map((r, i) => ({
      categoryRowId: r.categoryRowId as number,
      amount: Number(r.amount),
      label: r.label.trim() || null,
      sortOrder: i,
    }))
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
    const pct = totalAbs > 0 ? Math.round((amt / totalAbs) * 100) : 0
    return { color: pal.color, name: cat?.categoryName ?? '미선택', pct }
  })

  const Footer = (
    <>
      {(splitsQ.data?.length ?? 0) > 0 && (
        <Button
          type="button"
          variant="ghost"
          style={{ color: 'var(--fg-expense)', marginRight: 'auto' }}
          onClick={handleDeleteAll}
          loading={deleteAllMut.isPending}
          disabled={replaceMut.isPending}
        >
          <Trash2 size={14} /> 분할 해제
        </Button>
      )}
      {matched ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginRight: 'auto',
            padding: '4px 10px',
            background: 'color-mix(in oklch, var(--fg-brand) 12%, transparent)',
            color: 'var(--fg-brand)',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-bold)',
          }}
        >
          <Check size={12} /> 합계 일치
        </span>
      ) : (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginRight: 'auto',
            padding: '4px 10px',
            background: 'color-mix(in oklch, var(--fg-expense) 12%, transparent)',
            color: 'var(--fg-expense)',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-bold)',
          }}
        >
          {remainder > 0 ? `${KRW(remainder)}원 부족` : `${KRW(-remainder)}원 초과`}
        </span>
      )}
      <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button
        type="button"
        onClick={handleSave}
        disabled={!matched}
        loading={replaceMut.isPending}
      >
        분할 저장
      </Button>
    </>
  )

  if (isLoading) {
    return (
      <ModalShell title="내역 분할" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
        <SplitTxSkeleton />
      </ModalShell>
    )
  }

  return (
    <ModalShell title="내역 분할" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: 'var(--lh-normal)' }}>
        하나의 결제를 카테고리·항목별로 나누어 기록합니다. 예: 마트에서 식품과 생활품을 함께 결제한 경우.
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
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)' }}>원 거래</div>
          <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body)' }}>
            {expense.merchant || expense.description || '거래'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--fg-tertiary)' }}>총액</div>
          <div
            className="num"
            style={{
              fontWeight: 'var(--fw-heavy)',
              fontSize: 'var(--fs-h4)',
              color: isIncome ? 'var(--fg-brand)' : 'var(--fg-primary)',
            }}
          >
            {isIncome ? '+' : '−'}{KRW(totalAbs)}원
          </div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {safeRows.map((r, idx) => (
          <div
            key={r.uid}
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
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--pd-surface-inset)',
                color: 'var(--fg-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--fw-bold)',
                fontSize: 'var(--fs-caption)',
              }}
            >
              {idx + 1}
            </span>

            <Input
              value={r.label}
              onChange={e => updateRow(r.uid, { label: e.target.value })}
              placeholder="항목 이름 (선택)"
              disabled={submitting}
            />

            <Select
              value={r.categoryRowId ? String(r.categoryRowId) : ''}
              onValueChange={val => updateRow(r.uid, { categoryRowId: Number(val) })}
            >
              <SelectTrigger
                style={{
                  background: 'var(--bg-surface)',
                  height: 36,
                  minHeight: 36,
                }}
              >
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {sameTypeCategories.map(c => (
                  <SelectItem key={c.rowId} value={String(c.rowId)}>
                    {c.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div style={{ position: 'relative' }}>
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
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--fg-tertiary)',
                  pointerEvents: 'none',
                }}
              >
                원
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(r.uid)}
              disabled={submitting || safeRows.length <= 1}
              aria-label="항목 삭제"
              className="h-7 w-7 rounded-full text-[var(--fg-tertiary)]"
            >
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'space-between' }}>
        <Button type="button" variant="ghost" onClick={addRow} disabled={submitting}>
          <Plus size={14} /> 항목 추가
        </Button>
        <Button type="button" variant="ghost" onClick={splitEvenly} disabled={submitting}>
          <Scissors size={14} /> 균등 분배
        </Button>
      </div>

      {/* 분할 비율 */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--fg-secondary)', marginBottom: 6 }}>
          분할 비율
        </div>
        <div
          style={{
            display: 'flex',
            height: 10,
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
            background: 'var(--pd-surface-inset)',
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
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-caption)' }}>
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
              <span className="num" style={{ fontWeight: 'var(--fw-bold)', color: 'var(--fg-primary)' }}>
                {seg.pct}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </ModalShell>
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
