import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { useExpenses } from '@/features/expense'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const getHeatColor = (ratio: number, isDark: boolean) => {
  if (ratio === 0) return isDark ? 'bg-muted/30' : 'bg-muted'
  if (ratio <= 0.25) return isDark ? 'bg-red-900/40' : 'bg-red-100'
  if (ratio <= 0.5) return isDark ? 'bg-red-800/50' : 'bg-red-200'
  if (ratio <= 0.75) return isDark ? 'bg-red-700/60' : 'bg-red-300'
  return isDark ? 'bg-red-600/70' : 'bg-red-500'
}

export const DailyExpenseCalendarWidget = () => {
  const { t } = useTranslation('dashboard')
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

  const startDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`
  const lastDay = new Date(viewYear, viewMonth, 0).getDate()
  const endDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: expenses, isLoading } = useExpenses({
    startDate,
    endDate,
    expenseType: 'EXPENSE',
  })

  // 일별 지출 집계
  const { dailyMap, maxAmount, totalAmount, avgAmount } = useMemo(() => {
    const map = new Map<number, number>()
    if (!expenses) return { dailyMap: map, maxAmount: 0, totalAmount: 0, avgAmount: 0 }

    expenses.forEach((expense) => {
      const day = new Date(expense.expenseDate).getDate()
      map.set(day, (map.get(day) ?? 0) + expense.amount)
    })

    const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0)
    const max = Math.max(...Array.from(map.values()), 0)
    const daysWithExpense = map.size || 1

    return {
      dailyMap: map,
      maxAmount: max,
      totalAmount: total,
      avgAmount: Math.round(total / daysWithExpense),
    }
  }, [expenses])

  // 달력 그리드 계산
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay()
    const days: Array<{ day: number | null; amount: number }> = []

    // 빈 칸
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, amount: 0 })
    }

    // 날짜
    for (let d = 1; d <= lastDay; d++) {
      days.push({ day: d, amount: dailyMap.get(d) ?? 0 })
    }

    return days
  }, [viewYear, viewMonth, lastDay, dailyMap])

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1)
      setViewMonth(12)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1)
      setViewMonth(1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // 다크모드 감지
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      {/* 헤더: 월 이동 + 총액 */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[100px] text-center text-sm font-semibold">
            {viewYear}.{String(viewMonth).padStart(2, '0')}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground">
            {t('calendar.dailyAvg')}: {formatCurrency(avgAmount)}
          </p>
        </div>
      </div>

      {/* 달력 그리드 */}
      <div className="mt-3 flex-1">
        {/* 요일 헤더 */}
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

        {/* 날짜 셀 */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (cell.day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }

              const ratio = maxAmount > 0 ? cell.amount / maxAmount : 0
              const dayOfWeek = (new Date(viewYear, viewMonth - 1, cell.day).getDay())
              const isToday =
                viewYear === now.getFullYear() &&
                viewMonth === now.getMonth() + 1 &&
                cell.day === now.getDate()

              return (
                <Tooltip key={cell.day}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex aspect-square cursor-default flex-col items-center justify-center rounded-md text-xs transition-colors ${getHeatColor(ratio, isDark)} ${
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
                                ? isDark ? 'text-white' : 'text-white'
                                : 'text-foreground'
                        }`}
                      >
                        {cell.day}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">
                      {viewMonth}/{cell.day}
                    </p>
                    <p className="tabular-nums">
                      {cell.amount > 0 ? formatCurrency(cell.amount) : t('calendar.noExpense')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* 범례 */}
      <div className="mt-2 flex shrink-0 items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>{t('calendar.less')}</span>
        <div className={`h-3 w-3 rounded-sm ${isDark ? 'bg-muted/30' : 'bg-muted'}`} />
        <div className={`h-3 w-3 rounded-sm ${isDark ? 'bg-red-900/40' : 'bg-red-100'}`} />
        <div className={`h-3 w-3 rounded-sm ${isDark ? 'bg-red-800/50' : 'bg-red-200'}`} />
        <div className={`h-3 w-3 rounded-sm ${isDark ? 'bg-red-700/60' : 'bg-red-300'}`} />
        <div className={`h-3 w-3 rounded-sm ${isDark ? 'bg-red-600/70' : 'bg-red-500'}`} />
        <span>{t('calendar.more')}</span>
      </div>
    </div>
  )
}
