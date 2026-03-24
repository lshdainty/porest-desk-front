import { useIsMobile } from '@/shared/hooks'
import { MonthlySummaryCard } from '../MonthlySummary'
import { DailyExpenseCalendarChart } from './DailyExpenseCalendarChart'
import type { Expense } from '@/entities/expense'

interface SectionOverviewProps {
  year: number
  month: number
  expenses: Expense[]
}

export const SectionOverview = ({ year, month, expenses }: SectionOverviewProps) => {
  const isMobile = useIsMobile()

  return (
    <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
      <MonthlySummaryCard year={year} month={month} />
      <div className="rounded-xl border p-5">
        <DailyExpenseCalendarChart expenses={expenses} year={year} month={month} />
      </div>
    </div>
  )
}
