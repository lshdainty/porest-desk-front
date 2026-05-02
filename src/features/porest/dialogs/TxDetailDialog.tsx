import { useMemo, useState } from 'react'
import { Pencil, Repeat, Scissors, Trash2, Users } from 'lucide-react'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { renderIcon } from '@/shared/lib'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import {
  useDeleteExpense,
  useExpenseCategories,
  useSearchExpenses,
} from '@/features/expense'
import { useExpenseSplits } from '@/features/expense-split'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import { useDutchPays } from '@/features/dutch-pay'
import { useAssets } from '@/features/asset'
import type { Expense, ExpenseCategory } from '@/entities/expense'
import type { Asset } from '@/entities/asset'
import { getPaletteByColor } from './CategoryEditDialog'
import { SplitTxDialog } from './SplitTxDialog'
import { RecurringFromTxDialog } from './RecurringFromTxDialog'
import { DutchPayFromTxDialog } from './DutchPayFromTxDialog'

const toDayKey = (iso?: string | null): string => (iso ? iso.slice(0, 10) : '')
const toTimeKey = (iso?: string | null): string | null => {
  if (!iso || iso.length < 16) return null
  const t = iso.slice(11, 16)
  return t === '00:00' ? null : t
}

type Props = {
  expense: Expense
  onClose: () => void
  /** 부모가 AddTxSheet 편집 모드를 여는 콜백 */
  onEdit?: (expense: Expense) => void
  mobile: boolean
}

export function TxDetailDialog({ expense, onClose, onEdit, mobile }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [openSub, setOpenSub] = useState<'split' | 'recurring' | 'dutch' | null>(null)
  const deleteMut = useDeleteExpense()

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  const splitsQ = useExpenseSplits(expense.rowId)
  const recurringsQ = useRecurringTransactions()
  const dutchPaysQ = useDutchPays()

  const linkedRecurring = (recurringsQ.data ?? []).filter(
    r => r.sourceExpenseRowId === expense.rowId,
  )
  const linkedDutchPays = (dutchPaysQ.data ?? []).filter(
    d => d.sourceExpenseRowId === expense.rowId,
  )
  const splitCount = splitsQ.data?.length ?? 0

  const category: ExpenseCategory | undefined = (categoriesQ.data ?? []).find(
    c => c.rowId === expense.categoryRowId,
  )
  const palette = getPaletteByColor(category?.color)
  const asset: Asset | undefined = (assetsQ.data?.assets ?? []).find(
    a => a.rowId === expense.assetRowId,
  )

  const isIncome = expense.expenseType === 'INCOME'

  // 같은 가맹점의 같은 달 거래 (상세 제외)
  const merchantKey = expense.merchant?.trim() ?? ''
  const [yStr, mStr] = (expense.expenseDate ?? '').slice(0, 7).split('-')
  const year = Number(yStr)
  const month = Number(mStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  const startDate = year && month ? `${year}-${pad(month)}-01` : undefined
  const endDate = year && month
    ? `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`
    : undefined

  const historyQ = useSearchExpenses(
    merchantKey
      ? { merchant: merchantKey, startDate, endDate }
      : {},
  )

  const history = useMemo(() => {
    if (!historyQ.data) return []
    return historyQ.data
      .filter(t => t.rowId !== expense.rowId)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 5)
  }, [historyQ.data, expense.rowId])

  const merchantMonthCount = historyQ.data?.length ?? 0
  const merchantMonthTotal = (historyQ.data ?? []).reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  )

  const day = toDayKey(expense.expenseDate)
  const time = toTimeKey(expense.expenseDate)
  const paymentMethodLabel = (() => {
    switch (expense.paymentMethod) {
      case 'CASH': return '현금'
      case 'CARD': return '카드'
      case 'TRANSFER': return '계좌이체'
      case 'OTHER': return '기타'
      default: return null
    }
  })()

  const handleEdit = () => {
    if (!onEdit) return
    onEdit(expense)
  }

  const handleConfirmDelete = () => {
    deleteMut.mutate(expense.rowId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  const Footer = (
    <>
      <Button
        type="button"
        variant="ghost"
        style={{ color: 'var(--berry-700)', marginRight: 'auto' }}
        onClick={() => setConfirmDelete(true)}
        disabled={deleteMut.isPending}
      >
        <Trash2 size={14} />삭제
      </Button>
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleEdit}
          disabled={deleteMut.isPending}
        >
          <Pencil size={14} />편집
        </Button>
      )}
      <Button
        type="button"
        onClick={onClose}
        disabled={deleteMut.isPending}
      >
        확인
      </Button>
    </>
  )

  const title = isIncome ? '수입 상세' : '지출 상세'
  const amountColor = isIncome ? 'var(--mossy-700)' : 'var(--fg-primary)'
  const displayMerchant = expense.merchant ?? expense.description ?? category?.categoryName ?? '거래'

  return (
    <>
      <ModalShell
        title={title}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        {/* Hero */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.bg}, var(--bg-surface))`,
            border: `1px solid color-mix(in oklch, ${palette.color} 20%, transparent)`,
            borderRadius: 16,
            padding: 22,
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: palette.bg,
                color: palette.color,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderIcon(category?.icon ?? 'tag', category?.categoryName?.charAt(0) ?? '·', 20)}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--fg-secondary)',
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {displayMerchant}
          </div>
          <div
            className="num"
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: amountColor,
            }}
          >
            <MaskAmount>
              {isIncome ? '+' : '−'}
              {KRW(expense.amount, { abs: true })}
            </MaskAmount>
            <HideUnit>
              <span style={{ fontSize: 18, marginLeft: 2 }}>원</span>
            </HideUnit>
          </div>
          {(day || time) && (
            <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 6 }}>
              {day}
              {time && ` · ${time}`}
            </div>
          )}
        </div>

        {/* Field rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            background: 'var(--border-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <FieldRow
            label="카테고리"
            value={
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: palette.color,
                  }}
                />
                <span style={{ fontWeight: 600 }}>
                  {category?.categoryName ?? '미분류'}
                </span>
              </div>
            }
          />
          <FieldRow
            label="금액"
            value={
              <span className="num" style={{ fontWeight: 700 }}>
                <MaskAmount>
                  {isIncome ? '+' : '−'}
                  {KRW(expense.amount, { abs: true })}
                </MaskAmount>
                <HideUnit>원</HideUnit>
              </span>
            }
          />
          {asset && (
            <FieldRow
              label="계좌·카드"
              value={
                <span style={{ fontWeight: 500 }}>
                  {asset.institution
                    ? `${asset.institution} · ${asset.assetName}`
                    : asset.assetName}
                </span>
              }
            />
          )}
          {paymentMethodLabel && (
            <FieldRow
              label="결제 수단"
              value={<span style={{ fontWeight: 500 }}>{paymentMethodLabel}</span>}
            />
          )}
          <FieldRow
            label="날짜·시간"
            value={
              <span style={{ fontWeight: 500 }}>
                {day}
                {time && ` ${time}`}
              </span>
            }
          />
          <FieldRow
            label="메모"
            value={
              <span
                style={{
                  fontWeight: 500,
                  color: expense.description
                    ? 'var(--fg-primary)'
                    : 'var(--fg-tertiary)',
                }}
              >
                {expense.description || '없음'}
              </span>
            }
          />
        </div>

        {/* Quick actions — 분할/반복/더치페이 진입 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 16 }}>
          <QuickBtn
            Icon={Scissors}
            label="내역 분할"
            badge={splitCount > 0 ? `${splitCount}개` : null}
            onClick={() => setOpenSub('split')}
          />
          <QuickBtn
            Icon={Repeat}
            label="반복 설정"
            badge={linkedRecurring.length > 0 ? '연결됨' : null}
            onClick={() => setOpenSub('recurring')}
          />
          <QuickBtn
            Icon={Users}
            label="더치페이"
            badge={linkedDutchPays.length > 0 ? `${linkedDutchPays.length}건` : null}
            onClick={() => setOpenSub('dutch')}
          />
        </div>

        {/* Merchant history */}
        {merchantKey && history.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                {merchantKey}에서의 이전 거래
              </h4>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--fg-tertiary)' }}>
                이번 달{' '}
                <b className="num" style={{ color: 'var(--fg-secondary)' }}>
                  {merchantMonthCount}회 · <MaskAmount>{KRW(merchantMonthTotal)}</MaskAmount>
                  <HideUnit>원</HideUnit>
                </b>
              </span>
            </div>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '4px 14px',
              }}
            >
              {history.map(t => (
                <ExpenseRow key={t.rowId} expense={t} />
              ))}
            </div>
          </div>
        )}
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title="거래 삭제"
          message={`"${displayMerchant}" 거래를 삭제하시겠어요? 연결된 자산 잔액이 함께 조정됩니다.`}
          confirmLabel="삭제"
          danger
          loading={deleteMut.isPending}
          onCancel={() => !deleteMut.isPending && setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {openSub === 'split' && (
        <SplitTxDialog expense={expense} onClose={() => setOpenSub(null)} mobile={mobile} />
      )}
      {openSub === 'recurring' && (
        <RecurringFromTxDialog expense={expense} onClose={() => setOpenSub(null)} mobile={mobile} />
      )}
      {openSub === 'dutch' && (
        <DutchPayFromTxDialog expense={expense} onClose={() => setOpenSub(null)} mobile={mobile} />
      )}
    </>
  )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--bg-surface)',
        fontSize: 13,
        gap: 12,
      }}
    >
      <span style={{ color: 'var(--fg-tertiary)', minWidth: 72, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ marginLeft: 'auto' }}>{value}</div>
    </div>
  )
}

function QuickBtn({
  Icon,
  label,
  onClick,
  badge,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  label: string
  onClick?: () => void
  badge?: string | null
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 4px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'not-allowed',
        fontFamily: 'inherit',
        color: 'var(--fg-secondary)',
        opacity: onClick ? 1 : 0.55,
      }}
      disabled={!onClick}
    >
      <Icon size={18} strokeWidth={1.9} />
      <span style={{ fontSize: 11.5, color: 'var(--fg-secondary)', fontWeight: 600 }}>
        {label}
      </span>
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 999,
            background: 'var(--bg-brand-subtle)',
            color: 'var(--fg-brand-strong)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
