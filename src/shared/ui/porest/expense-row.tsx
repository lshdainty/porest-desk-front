import type { ReactNode } from 'react'
import { KRW } from '@/shared/lib/porest/format'
import { useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import type { Expense } from '@/entities/expense/model/types'
import { Icon } from './primitives'

function hashHue(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) & 0xffffffff
  return Math.abs(h) % 360
}

/**
 * expenseDate 표시 라벨:
 *   - DATETIME ("YYYY-MM-DDTHH:mm(:ss)") 이고 시간이 00:00 이 아니면 "HH:mm"
 *   - 그 외 (10자 날짜 or 00:00 시간) 이면 "MM-DD"
 */
function formatExpenseDateLabel(raw: string): string {
  const time = raw.length >= 16 ? raw.slice(11, 16) : ''
  if (time && time !== '00:00') return time
  return raw.slice(5, 10)
}

export function CategoryChip({
  name,
  color,
  icon,
  size = 'md',
}: {
  name: string
  color?: string | null
  icon?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40
  const radius = size === 'sm' ? 10 : size === 'lg' ? 14 : 12
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
  const hue = hashHue(name || 'unknown')
  const fallbackBg = `oklch(0.96 0.03 ${hue})`
  const fallbackFg = `oklch(0.48 0.12 ${hue})`
  return (
    <span
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        background: color ?? fallbackBg,
        color: color ? '#fff' : fallbackFg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon || 'circle'} size={iconSize} strokeWidth={1.9} />
    </span>
  )
}

export function ExpenseRow({
  expense,
  onClick,
  right,
}: {
  expense: Expense
  onClick?: (e: Expense) => void
  right?: ReactNode
}) {
  const hidden = useHideAmounts()
  const isIncome = expense.expenseType === 'INCOME'
  return (
    <div className="tx-row" onClick={() => onClick?.(expense)}>
      <CategoryChip
        name={expense.categoryName ?? '기타'}
        color={expense.categoryColor ?? null}
        icon={expense.categoryIcon ?? null}
      />
      <div className="tx-row__meta">
        <div className="tx-row__title">
          {expense.merchant ?? expense.description ?? expense.categoryName ?? '거래'}
        </div>
        <div className="tx-row__sub">
          <span>{expense.categoryName ?? '기타'}</span>
          {expense.assetName && (
            <>
              <span className="sep" />
              <span>{expense.assetName}</span>
            </>
          )}
          {expense.expenseDate && (
            <>
              <span className="sep" />
              <span>{formatExpenseDateLabel(expense.expenseDate)}</span>
            </>
          )}
        </div>
      </div>
      <div>
        {right ?? (
          <div className={`tx-row__amt ${isIncome ? 'income' : ''}`}>
            {hidden ? '••••••' : <>{isIncome ? '+' : '-'}{KRW(expense.amount, { abs: true })}원</>}
          </div>
        )}
      </div>
    </div>
  )
}
