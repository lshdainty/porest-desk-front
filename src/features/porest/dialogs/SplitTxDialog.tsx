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
          style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
          onClick={handleDeleteAll}
          disabled={submitting}
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
            background: 'color-mix(in oklch, var(--mossy-700) 12%, transparent)',
            color: 'var(--mossy-700)',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 700,
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
            background: 'color-mix(in oklch, var(--berry-700) 12%, transparent)',
            color: 'var(--berry-700)',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 700,
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
        disabled={!matched || submitting}
      >
        {replaceMut.isPending ? '저장 중…' : '분할 저장'}
      </Button>
    </>
  )

  return (
    <ModalShell title="내역 분할" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
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
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>원 거래</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {expense.merchant || expense.description || '거래'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>총액</div>
          <div
            className="num"
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: isIncome ? 'var(--mossy-700)' : 'var(--fg-primary)',
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
              borderRadius: 12,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: 'var(--pd-surface-inset)',
                color: 'var(--fg-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
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
              <SelectTrigger>
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
                  fontSize: 12,
                  color: 'var(--fg-tertiary)',
                  pointerEvents: 'none',
                }}
              >
                원
              </span>
            </div>

            <button
              type="button"
              onClick={() => removeRow(r.uid)}
              disabled={submitting || safeRows.length <= 1}
              aria-label="항목 삭제"
              style={{
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 0,
                borderRadius: 999,
                color: 'var(--fg-tertiary)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
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
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 6 }}>
          분할 비율
        </div>
        <div
          style={{
            display: 'flex',
            height: 10,
            borderRadius: 999,
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
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: seg.color,
                }}
              />
              <span style={{ color: 'var(--fg-secondary)' }}>{seg.name}</span>
              <span className="num" style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>
                {seg.pct}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}
