import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { KRW, isEn } from '@/shared/lib/porest/format'
import { formatMonthDayDow } from '@/shared/lib/date'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import type { Expense } from '@/entities/expense/model/types'
import { getPaletteByColor } from '@/features/porest/dialogs'
import { tileRadius } from '@/shared/lib'
import { Icon } from './primitives'
import { LedgerRow, LedgerRowAmt, LedgerRowMain, LedgerRowSep, LedgerRowSub, LedgerRowTitle } from './ledger'

/**
 * expenseDate 의 시각 부분만 표시 ("HH:mm").
 * day-head 가 이미 날짜를 보여주므로 행에서는 시각 정보만 (시각이 00:00 이면 표시 안 함).
 */
function formatExpenseTimeLabel(raw: string): string | null {
  const time = raw.length >= 16 ? raw.slice(11, 16) : ''
  if (time && time !== '00:00') return time
  return null
}

/**
 * "M월 D일 (요일)" — 홈 최근 거래처럼 day-head 가 없는 컨텍스트에서 사용.
 */
function formatExpenseDateFull(raw: string): string {
  const day = raw.slice(0, 10)
  if (day.length !== 10) return day
  return formatMonthDayDow(day)
}

export function CategoryChip({
  color,
  icon,
  size = 'md',
}: {
  name?: string
  color?: string | null
  icon?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
  // hex / oklch / var 문자열을 모두 인식해 tint + 아이콘 색 조합 생성
  const palette = getPaletteByColor(color)
  return (
    <span
      style={{
        width: dim,
        height: dim,
        borderRadius: tileRadius(dim),
        background: palette.bg,
        color: palette.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon || 'tag'} size={iconSize} strokeWidth={1.9} />
    </span>
  )
}

export function ExpenseRow({
  expense,
  onClick,
  right,
  showDate,
}: {
  expense: Expense
  onClick?: (e: Expense) => void
  right?: ReactNode
  /** true 면 day-head 가 없는 컨텍스트(홈 최근거래 등)에서 시각 대신 "M월 D일 (요일)" 표시 */
  showDate?: boolean
}) {
  const { t } = useTranslation('common')
  const isIncome = expense.expenseType === 'INCOME'
  return (
    <LedgerRow onClick={() => onClick?.(expense)}>
      <CategoryChip
        name={expense.categoryName ?? t('others')}
        color={expense.categoryColor ?? null}
        icon={expense.categoryIcon ?? null}
      />
      <LedgerRowMain>
        <LedgerRowTitle className="flex items-center gap-[5px] overflow-visible">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {expense.merchant ?? expense.description ?? expense.categoryName ?? t('transaction')}
          </span>
          {(expense.splitCategoryRowIds?.length ?? 0) > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, color: 'var(--fg-brand)' }}>
              <Icon name="split" size={12} />
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700 }}>
                {expense.splitCategoryRowIds!.length}
              </span>
            </span>
          )}
        </LedgerRowTitle>
        <LedgerRowSub>
          <span>{expense.categoryName ?? t('others')}</span>
          {expense.assetName && (
            <>
              <LedgerRowSep />
              <span>{expense.assetName}</span>
            </>
          )}
          {expense.expenseDate && (showDate
            ? (
              <>
                <LedgerRowSep />
                <span>{formatExpenseDateFull(expense.expenseDate)}</span>
              </>
            )
            : formatExpenseTimeLabel(expense.expenseDate) && (
              <>
                <LedgerRowSep />
                <span>{formatExpenseTimeLabel(expense.expenseDate)}</span>
              </>
            ))}
        </LedgerRowSub>
      </LedgerRowMain>
      <div>
        {right ?? (
          <LedgerRowAmt income={isIncome}>
            <MaskAmount>{isIncome ? '+' : '-'}{isEn() ? '₩' : ''}{KRW(expense.amount, { abs: true })}</MaskAmount>
            <HideUnit>{isEn() ? '' : '원'}</HideUnit>
          </LedgerRowAmt>
        )}
      </div>
    </LedgerRow>
  )
}
