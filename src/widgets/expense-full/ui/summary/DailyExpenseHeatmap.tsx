import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import type { Expense } from '@/entities/expense'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const getHeatColor = (ratio: number) => {
  if (ratio === 0) return 'bg-muted'
  if (ratio <= 0.15) return 'bg-emerald-100 dark:bg-emerald-900/30'
  if (ratio <= 0.3) return 'bg-emerald-200 dark:bg-emerald-800/40'
  if (ratio <= 0.45) return 'bg-emerald-300 dark:bg-emerald-700/50'
  if (ratio <= 0.6) return 'bg-emerald-400 dark:bg-emerald-600/60'
  if (ratio <= 0.8) return 'bg-emerald-500 dark:bg-emerald-500/70'
  return 'bg-emerald-700 dark:bg-emerald-400/80'
}

interface DailyExpenseHeatmapProps {
  expenses: Expense[]
  year: number
  month: number
}

export const DailyExpenseHeatmap = ({ expenses, year, month }: DailyExpenseHeatmapProps) => {
  const { t } = useTranslation('expense')
  const now = new Date()
  const lastDay = new Date(year, month, 0).getDate()

  const { dailyMap, maxAmount } = useMemo(() => {
    const map = new Map<number, number>()
    const expenseOnly = expenses.filter((e) => e.expenseType === 'EXPENSE')

    expenseOnly.forEach((expense) => {
      const day = new Date(expense.expenseDate).getDate()
      map.set(day, (map.get(day) ?? 0) + expense.amount)
    })

    const max = Math.max(...Array.from(map.values()), 0)

    return { dailyMap: map, maxAmount: max }
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
    <div className="rounded-xl border p-5">
      <h3 className="mb-3 text-sm font-semibold">
        {year}.{String(month).padStart(2, '0')} 일별 지출 히트맵
      </h3>

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
                            : ratio > 0.6
                              ? 'text-white dark:text-white'
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

      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>적음</span>
        <div className="h-3 w-3 rounded-sm bg-muted" />
        <div className="h-3 w-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30" />
        <div className="h-3 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700/50" />
        <div className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-500/70" />
        <div className="h-3 w-3 rounded-sm bg-emerald-700 dark:bg-emerald-400/80" />
        <span>많음</span>
      </div>
    </div>
  )
}
