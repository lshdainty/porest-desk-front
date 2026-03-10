import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { timerApi } from '@/features/timer/api/timerApi'
import { timerKeys } from '@/shared/config'

const DAY_KEYS = ['focus.mon', 'focus.tue', 'focus.wed', 'focus.thu', 'focus.fri', 'focus.sat', 'focus.sun']

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export const WeeklyFocusWidget = () => {
  const { t } = useTranslation('dashboard')

  const chartConfig = {
    focus: {
      label: t('timer.todayFocus'),
      color: '#8b5cf6',
    },
  } satisfies ChartConfig

  const { startDate, endDate } = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Monday is start of week (dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    return { startDate: fmt(monday), endDate: fmt(sunday) }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: timerKeys.dailyStats({ startDate, endDate }),
    queryFn: () => timerApi.getDailyStats({ startDate, endDate }),
  })

  const chartData = useMemo(() => {
    const monday = new Date(startDate)
    const days = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const stat = data?.find((s) => s.date === dateStr)

      days.push({
        day: t(DAY_KEYS[i]),
        focus: stat?.totalSeconds ?? 0,
        focusMinutes: Math.round((stat?.totalSeconds ?? 0) / 60),
      })
    }

    return days
  }, [data, startDate])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasAnyData = chartData.some((d) => d.focus > 0)

  if (!hasAnyData) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-3">
      <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums">
                    {formatDuration(value as number)}
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="focus" fill="var(--color-focus)" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
