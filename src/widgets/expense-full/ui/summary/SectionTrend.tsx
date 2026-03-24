import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { PeriodSelector } from './PeriodSelector'
import { ExpenseDailyTrendChart } from './ExpenseDailyTrendChart'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { MonthlyCompareChart } from './MonthlyCompareChart'
import { YearOverYearChart } from './YearOverYearChart'
import { SavingsRateChart } from './SavingsRateChart'
import type { Expense, MonthlyAmount, StatsPeriod } from '@/entities/expense'

interface SectionTrendProps {
  expenses: Expense[]
  filteredMonthlyAmounts: MonthlyAmount[]
  allMonthlyAmounts: MonthlyAmount[]
  prevYearMonthlyAmounts: MonthlyAmount[]
  year: number
  month: number
  period: StatsPeriod
  onPeriodChange: (p: StatsPeriod) => void
}

export const SectionTrend = ({
  expenses,
  filteredMonthlyAmounts,
  allMonthlyAmounts,
  prevYearMonthlyAmounts,
  year,
  month,
  period,
  onPeriodChange,
}: SectionTrendProps) => {
  const { t } = useTranslation('expense')

  return (
    <div className="rounded-xl border p-5">
      <Tabs defaultValue="daily">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="daily">{t('stats.dailyTrend')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('stats.monthlyTrend')}</TabsTrigger>
            <TabsTrigger value="yoy">{t('stats.yearOverYear')}</TabsTrigger>
            <TabsTrigger value="savings">{t('stats.savingsRate')}</TabsTrigger>
          </TabsList>
          <PeriodSelector value={period} onChange={onPeriodChange} />
        </div>

        <TabsContent value="daily" className="mt-4">
          <ExpenseDailyTrendChart expenses={expenses} />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyTrendChart monthlyAmounts={filteredMonthlyAmounts} />
        </TabsContent>
        <TabsContent value="yoy" className="mt-4">
          <MonthlyCompareChart monthlyAmounts={allMonthlyAmounts} year={year} />
          <div className="mt-4">
            <YearOverYearChart
              currentYearData={allMonthlyAmounts}
              previousYearData={prevYearMonthlyAmounts}
              currentYear={year}
            />
          </div>
        </TabsContent>
        <TabsContent value="savings" className="mt-4">
          <SavingsRateChart
            currentYearData={allMonthlyAmounts}
            previousYearData={prevYearMonthlyAmounts}
            year={year}
            month={month}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
