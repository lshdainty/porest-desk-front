import type { ReactNode } from 'react'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import type { Expense } from '@/entities/expense/model/types'
import { getPaletteByColor } from '@/features/porest/dialogs'
import { Icon } from './primitives'
import { TX_ROW } from './tx-row-tokens'

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
const DOW = ['일', '월', '화', '수', '목', '금', '토']
function formatExpenseDateFull(raw: string): string {
  const day = raw.slice(0, 10)
  if (day.length !== 10) return day
  const [, m, d] = day.split('-').map(Number)
  const dow = DOW[new Date(`${day}T00:00:00`).getDay()]
  return `${m}월 ${d}일 (${dow})`
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
  const radius = size === 'sm' ? 10 : size === 'lg' ? 14 : 12
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
  // hex / oklch / var 문자열을 모두 인식해 tint + 아이콘 색 조합 생성
  const palette = getPaletteByColor(color)
  return (
    <span
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
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
  const isIncome = expense.expenseType === 'INCOME'
  return (
    <div className={TX_ROW.className} onClick={() => onClick?.(expense)}>
      <CategoryChip
        name={expense.categoryName ?? '기타'}
        color={expense.categoryColor ?? null}
        icon={expense.categoryIcon ?? null}
      />
      <div style={TX_ROW.metaStyle}>
        <div style={TX_ROW.titleStyle}>
          {expense.merchant ?? expense.description ?? expense.categoryName ?? '거래'}
        </div>
        <div style={TX_ROW.subStyle}>
          <span>{expense.categoryName ?? '기타'}</span>
          {expense.assetName && (
            <>
              <span style={TX_ROW.sepStyle} />
              <span>{expense.assetName}</span>
            </>
          )}
          {expense.expenseDate && (showDate
            ? (
              <>
                <span style={TX_ROW.sepStyle} />
                <span>{formatExpenseDateFull(expense.expenseDate)}</span>
              </>
            )
            : formatExpenseTimeLabel(expense.expenseDate) && (
              <>
                <span style={TX_ROW.sepStyle} />
                <span>{formatExpenseTimeLabel(expense.expenseDate)}</span>
              </>
            ))}
        </div>
      </div>
      <div>
        {right ?? (
          <div style={TX_ROW.amtStyle(isIncome)}>
            <MaskAmount>{isIncome ? '+' : '-'}{KRW(expense.amount, { abs: true })}</MaskAmount>
            <HideUnit>원</HideUnit>
          </div>
        )}
      </div>
    </div>
  )
}
