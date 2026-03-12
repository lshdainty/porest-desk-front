import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import type {
  StatsPeriod,
  MonthlyAmount,
  CategoryBreakdown,
} from '@/entities/expense'
import {
  useYearlySummary,
  useMerchantSummary,
  useAssetExpenseSummary,
  useExpenseBudgets,
  useExpenseCategories,
} from '@/features/expense'
import { MonthlySummaryCard } from '../MonthlySummary'
import { PeriodSelector } from './PeriodSelector'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { YearOverYearChart } from './YearOverYearChart'
import { BudgetVsActualChart } from './BudgetVsActualChart'
import { CategoryTrendChart } from './CategoryTrendChart'
import { MerchantAnalysisChart } from './MerchantAnalysisChart'
import { AssetUsageChart } from './AssetUsageChart'

interface SummaryDashboardProps {
  year: number
  month: number
}

function computeDateRange(
  period: StatsPeriod,
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const monthCount = period === '3m' ? 3 : period === '6m' ? 6 : 12

  let startMonth = month - (monthCount - 1)
  let startYear = year
  while (startMonth <= 0) {
    startMonth += 12
    startYear--
  }

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`

  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { startDate, endDate }
}

function filterMonthlyAmountsByPeriod(
  monthlyAmounts: MonthlyAmount[] | undefined,
  period: StatsPeriod,
  year: number,
  month: number,
): MonthlyAmount[] {
  if (!monthlyAmounts) return []

  const monthCount = period === '3m' ? 3 : period === '6m' ? 6 : 12
  const periodMonths: Array<{ year: number; month: number }> = []

  for (let i = monthCount - 1; i >= 0; i--) {
    let m = month - i
    let y = year
    while (m <= 0) {
      m += 12
      y--
    }
    periodMonths.push({ year: y, month: m })
  }

  const currentYearMonths = new Set(
    periodMonths.filter((pm) => pm.year === year).map((pm) => pm.month),
  )

  return monthlyAmounts.filter((ma) => currentYearMonths.has(ma.month))
}

export const SummaryDashboard = ({ year, month }: SummaryDashboardProps) => {
  const { t } = useTranslation('expense')
  const [period, setPeriod] = useState<StatsPeriod>('6m')

  const { startDate, endDate } = useMemo(
    () => computeDateRange(period, year, month),
    [period, year, month],
  )

  // Data fetching
  const { data: yearlyData, isLoading: loadingYearly } =
    useYearlySummary(year)
  const { data: prevYearlyData, isLoading: loadingPrevYearly } =
    useYearlySummary(year - 1)
  const { data: merchantData, isLoading: loadingMerchants } =
    useMerchantSummary(startDate, endDate)
  const { data: assetData, isLoading: loadingAssets } =
    useAssetExpenseSummary(startDate, endDate)
  const { data: budgets, isLoading: loadingBudgets } = useExpenseBudgets({
    year,
    month,
  })
  const { data: categories } = useExpenseCategories()

  // Filter monthly amounts by selected period
  const filteredMonthlyAmounts = useMemo(
    () =>
      filterMonthlyAmountsByPeriod(
        yearlyData?.monthlyAmounts,
        period,
        year,
        month,
      ),
    [yearlyData, period, year, month],
  )

  // Category name map for budget chart
  const categoryNames = useMemo(() => {
    const map: Record<number, string> = {}
    categories?.forEach((c) => {
      map[c.rowId] = c.categoryName
    })
    return map
  }, [categories])

  // Current month's category breakdown for budget chart
  const categoryBreakdown: CategoryBreakdown[] = useMemo(() => {
    if (!yearlyData?.monthlyAmounts) return []
    const currentMonth = yearlyData.monthlyAmounts.find(
      (m) => m.month === month,
    )
    return currentMonth?.categoryBreakdown ?? []
  }, [yearlyData, month])

  const isLoading =
    loadingYearly ||
    loadingPrevYearly ||
    loadingMerchants ||
    loadingAssets ||
    loadingBudgets

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MonthlySummaryCard year={year} month={month} />

      <PeriodSelector value={period} onChange={setPeriod} />

      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {t('stats.monthlyTrend')}
        </h3>
        <MonthlyTrendChart monthlyAmounts={filteredMonthlyAmounts} />
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {t('stats.yearOverYear')}
        </h3>
        <YearOverYearChart
          currentYearData={yearlyData?.monthlyAmounts ?? []}
          previousYearData={prevYearlyData?.monthlyAmounts ?? []}
          currentYear={year}
        />
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {t('stats.budgetVsActual')}
        </h3>
        <BudgetVsActualChart
          budgets={budgets ?? []}
          categoryBreakdown={categoryBreakdown}
          categoryNames={categoryNames}
        />
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {t('stats.categoryTrend')}
        </h3>
        <CategoryTrendChart monthlyAmounts={filteredMonthlyAmounts} />
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {t('stats.merchantAnalysis')}
        </h3>
        <MerchantAnalysisChart merchants={merchantData?.merchants ?? []} />
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {t('stats.assetUsage')}
        </h3>
        <AssetUsageChart assets={assetData?.assets ?? []} />
      </div>
    </div>
  )
}
