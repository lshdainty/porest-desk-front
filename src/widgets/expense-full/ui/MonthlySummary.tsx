import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Wallet, ChevronRight } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useMonthlySummary } from '@/features/expense'
import { aggregateByParent } from '@/entities/expense'
import { ExpenseChart } from './ExpenseChart'

interface MonthlySummaryProps {
  year: number
  month: number
}

export const MonthlySummaryCard = ({ year, month }: MonthlySummaryProps) => {
  const { t } = useTranslation('expense')
  const { data: summary } = useMonthlySummary(year, month)
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set())

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const net = totalIncome - totalExpense
  const breakdown = summary?.categoryBreakdown ?? []

  const parentBreakdown = useMemo(() => aggregateByParent(breakdown), [breakdown])

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

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-green-600" />
          <p className="text-xs text-muted-foreground">{t('totalIncome')}</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <TrendingDown size={16} className="mx-auto mb-1 text-red-600" />
          <p className="text-xs text-muted-foreground">{t('totalExpense')}</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Wallet size={16} className={cn('mx-auto mb-1', net >= 0 ? 'text-green-600' : 'text-red-600')} />
          <p className="text-xs text-muted-foreground">{t('net')}</p>
          <p className={cn('text-sm font-bold', net >= 0 ? 'text-green-600' : 'text-red-600')}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Category breakdown chart */}
      {breakdown.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-medium">{t('categoryBreakdown')}</h3>
          <ExpenseChart breakdown={breakdown} />
        </div>
      )}

      {/* Category breakdown list - aggregated by parent */}
      {parentBreakdown.length > 0 && (
        <div className="space-y-2">
          {parentBreakdown.map((parent) => {
            const hasChildren = parent.children.length > 0
            const isExpanded = expandedParents.has(parent.categoryRowId)

            return (
              <div key={parent.categoryRowId}>
                <div
                  className={cn(
                    'flex items-center justify-between rounded-md border px-3 py-2',
                    hasChildren && 'cursor-pointer hover:bg-muted/30 transition-colors'
                  )}
                  onClick={hasChildren ? () => toggleParent(parent.categoryRowId) : undefined}
                >
                  <div className="flex items-center gap-2">
                    {hasChildren && (
                      <ChevronRight
                        size={14}
                        className={cn(
                          'text-muted-foreground transition-transform',
                          isExpanded && 'rotate-90'
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
      )}
    </div>
  )
}
