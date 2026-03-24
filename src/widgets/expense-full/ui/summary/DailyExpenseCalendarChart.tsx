import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import type { Expense } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const getHeatColor = (ratio: number) => {
  if (ratio === 0) return 'bg-muted'
  if (ratio <= 0.25) return 'bg-red-100 dark:bg-red-900/40'
  if (ratio <= 0.5) return 'bg-red-200 dark:bg-red-800/50'
  if (ratio <= 0.75) return 'bg-red-300 dark:bg-red-700/60'
  return 'bg-red-500 dark:bg-red-600/70'
}

interface DailyExpenseCalendarChartProps {
  expenses: Expense[]
  year: number
  month: number
}

export const DailyExpenseCalendarChart = ({ expenses, year, month }: DailyExpenseCalendarChartProps) => {
  const { t } = useTranslation('expense')
  const now = new Date()
  const lastDay = new Date(year, month, 0).getDate()

  const { dailyMap, maxAmount, totalAmount, avgAmount } = useMemo(() => {
    const map = new Map<number, number>()
    const expenseOnly = expenses.filter((e) => e.expenseType === 'EXPENSE')

    expenseOnly.forEach((expense) => {
      const day = new Date(expense.expenseDate).getDate()
      map.set(day, (map.get(day) ?? 0) + expense.amount)
    })

    const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0)
    const max = Math.max(...Array.from(map.values()), 0)
    const daysWithExpense = map.size || 1

    return { dailyMap: map, maxAmount: max, totalAmount: total, avgAmount: Math.round(total / daysWithExpense) }
  }, [expenses])

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
    const days: Array<{ day: number | null; amount: number }> = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, amount: 0 })
    }
    for (let d = 1; d <= lastDay; d++) {
      days.push({ day: d, amount: dailyMap.get(d) ?? 0 })
    }
    return days
  }, [year, month, lastDay, dailyMap])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">
          {year}.{String(month).padStart(2, '0')}
        </span>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {t('daily')} {t('stats.noData') ? '' : ''}{formatCurrency(avgAmount)}/일
          </p>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const ratio = maxAmount > 0 ? cell.amount / maxAmount : 0
            const dayOfWeek = new Date(year, month - 1, cell.day).getDay()
            const isToday =
              year === now.getFullYear() && month === now.getMonth() + 1 && cell.day === now.getDate()

            return (
              <Tooltip key={cell.day}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex aspect-square cursor-default items-center justify-center rounded-md text-xs transition-colors ${getHeatColor(ratio)} ${
                      isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                            ? 'text-blue-500'
                            : ratio > 0.75
                              ? 'text-white'
                              : 'text-foreground'
                      }`}
                    >
                      {cell.day}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{month}/{cell.day}</p>
                  <p className="tabular-nums">
                    {cell.amount > 0 ? formatCurrency(cell.amount) : t('noTransactions')}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>적음</span>
        <div className="h-3 w-3 rounded-sm bg-muted" />
        <div className="h-3 w-3 rounded-sm bg-red-100" />
        <div className="h-3 w-3 rounded-sm bg-red-200" />
        <div className="h-3 w-3 rounded-sm bg-red-300" />
        <div className="h-3 w-3 rounded-sm bg-red-500" />
        <span>많음</span>
      </div>
    </div>
  )
}
