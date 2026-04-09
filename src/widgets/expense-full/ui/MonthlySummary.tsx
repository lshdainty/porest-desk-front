import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import { cn, formatCurrency } from '@/shared/lib'
import { useMonthlySummary } from '@/features/expense'

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

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const net = totalIncome - totalExpense

  const prevIncome = prevSummary?.totalIncome ?? 0
  const prevExpense = prevSummary?.totalExpense ?? 0
  const prevNet = prevIncome - prevExpense

  const incomeChange = calcChangePercent(totalIncome, prevIncome)
  const netChange = calcChangePercent(net, prevNet)

  const cards = useMemo(() => [
    {
      key: 'income',
      label: t('totalIncome'),
      value: totalIncome,
      change: incomeChange,
      isPositiveGood: true,
      icon: TrendingUp,
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderClass: 'border-emerald-200/60 dark:border-emerald-800/40',
      valueClass: 'text-emerald-700 dark:text-emerald-400',
      iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/50',
      prefix: '+',
    },
    {
      key: 'balance',
      label: t('balance'),
      value: Math.abs(net),
      change: netChange,
      isPositiveGood: true,
      icon: Wallet,
      bgClass: 'bg-blue-50 dark:bg-blue-950/40',
      borderClass: 'border-blue-200/60 dark:border-blue-800/40',
      valueClass: net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400',
      iconBgClass: 'bg-blue-100 dark:bg-blue-900/50',
      prefix: net >= 0 ? '+' : '-',
    },
  ], [t, totalIncome, net, incomeChange, netChange])

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        const changeIsGood = card.change !== null
          ? card.isPositiveGood
            ? card.change >= 0
            : card.change <= 0
          : true

        return (
          <div
            key={card.key}
            className={cn(
              'rounded-xl border p-3 sm:p-4 transition-all',
              card.bgClass,
              card.borderClass,
            )}
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className={cn('rounded-lg p-1.5', card.iconBgClass)}>
                <Icon size={14} className={card.valueClass} />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
                {card.label}
              </span>
            </div>

            {/* Amount - Hero number */}
            <p className={cn(
              'text-base sm:text-xl font-bold tabular-nums tracking-tight leading-tight',
              card.valueClass,
            )}>
              {card.prefix}{formatCurrency(card.value)}
            </p>

            {/* Change percent */}
            {card.change !== null && (
              <div className={cn(
                'mt-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium',
                changeIsGood
                  ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-red-100/80 text-red-700 dark:bg-red-900/40 dark:text-red-400',
              )}>
                {card.change >= 0 ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                <span>{Math.abs(card.change)}%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
