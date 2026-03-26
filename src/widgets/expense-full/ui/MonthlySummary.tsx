import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Wallet, ChevronRight } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useMonthlySummary, useExpenseCategories } from '@/features/expense'
import { aggregateByParent, separateBreakdownByType } from '@/entities/expense'
import type { ParentCategoryBreakdown } from '@/entities/expense'
import { ExpenseChart } from './ExpenseChart'

interface MonthlySummaryProps {
  year: number
  month: number
}

const computePrevMonth = (year: number, month: number) => {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

const calcChangePercent = (current: number, prev: number): number | null => {
  if (prev === 0) return current > 0 ? 100 : null
  return Math.round(((current - prev) / prev) * 100)
}

export const MonthlySummaryCard = ({ year, month }: MonthlySummaryProps) => {
  const { t } = useTranslation('expense')
  const { data: summary } = useMonthlySummary(year, month)
  const prevPeriod = computePrevMonth(year, month)
  const { data: prevSummary } = useMonthlySummary(prevPeriod.year, prevPeriod.month)
  const { data: categories } = useExpenseCategories()
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set())

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const net = totalIncome - totalExpense
  const breakdown = summary?.categoryBreakdown ?? []

  const prevIncome = prevSummary?.totalIncome ?? 0
  const prevExpense = prevSummary?.totalExpense ?? 0
  const prevNet = prevIncome - prevExpense

  const incomeChange = calcChangePercent(totalIncome, prevIncome)
  const expenseChange = calcChangePercent(totalExpense, prevExpense)
  const netChange = calcChangePercent(net, prevNet)

  // 수입/지출 분리
  const { incomeBreakdown, expenseBreakdown } = useMemo(
    () => separateBreakdownByType(breakdown, categories ?? []),
    [breakdown, categories],
  )

  const parentExpenseBreakdown = useMemo(() => aggregateByParent(expenseBreakdown), [expenseBreakdown])
  const parentIncomeBreakdown = useMemo(() => aggregateByParent(incomeBreakdown), [incomeBreakdown])

  const toggleParent = useCallback((parentId: number) => {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      if (next.has(parentId)) {
        next.delete(parentId)
      } else {
        next.add(parentId)
      }
      return next
    })
  }, [])

  const renderParentList = (items: ParentCategoryBreakdown[]) => (
    <div className="space-y-2">
      {items.map((parent) => {
        const hasChildren = parent.children.length > 0
        const isExpanded = expandedParents.has(parent.categoryRowId)

        return (
          <div key={parent.categoryRowId}>
            <div
              className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2',
                hasChildren && 'cursor-pointer hover:bg-muted/30 transition-colors',
              )}
              onClick={hasChildren ? () => toggleParent(parent.categoryRowId) : undefined}
            >
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <ChevronRight
                    size={14}
                    className={cn(
                      'text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90',
                    )}
                  />
                )}
                <span className="text-sm">{parent.categoryName}</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(parent.totalAmount)}</span>
            </div>

            {hasChildren && isExpanded && (
              <div className="mt-1 space-y-1">
                {parent.children.map((child) => (
                  <div
                    key={child.categoryRowId}
                    className="ml-6 flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">{child.categoryName}</span>
                    <span className="text-sm font-medium">{formatCurrency(child.totalAmount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-green-600 dark:text-green-400" />
          <p className="text-xs text-muted-foreground">{t('totalIncome')}</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
          {incomeChange !== null && (
            <div className={cn('mt-1 flex items-center justify-center gap-0.5 text-[10px] font-medium', incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {incomeChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>{incomeChange >= 0 ? '+' : ''}{incomeChange}%</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border p-3 text-center">
          <TrendingDown size={16} className="mx-auto mb-1 text-red-600 dark:text-red-400" />
          <p className="text-xs text-muted-foreground">{t('totalExpense')}</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
          {expenseChange !== null && (
            <div className={cn('mt-1 flex items-center justify-center gap-0.5 text-[10px] font-medium', expenseChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {expenseChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>{expenseChange >= 0 ? '+' : ''}{expenseChange}%</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Wallet size={16} className={cn('mx-auto mb-1', net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')} />
          <p className="text-xs text-muted-foreground">{t('net')}</p>
          <p className={cn('text-sm font-bold', net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </p>
          {netChange !== null && (
            <div className={cn('mt-1 flex items-center justify-center gap-0.5 text-[10px] font-medium', netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {netChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>{netChange >= 0 ? '+' : ''}{netChange}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 지출 카테고리 분석 */}
      {expenseBreakdown.length > 0 && (
        <>
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">{t('expense')} {t('categoryBreakdown')}</h3>
            <ExpenseChart breakdown={expenseBreakdown} />
          </div>
          {renderParentList(parentExpenseBreakdown)}
        </>
      )}

      {/* 수입 카테고리 분석 */}
      {incomeBreakdown.length > 0 && (
        <>
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">{t('income')} {t('categoryBreakdown')}</h3>
            <ExpenseChart breakdown={incomeBreakdown} />
          </div>
          {renderParentList(parentIncomeBreakdown)}
        </>
      )}
    </div>
  )
}
