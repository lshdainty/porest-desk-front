import type { CategoryBreakdown, ExpenseCategory, ExpenseType } from '../model/types'

export interface SeparatedBreakdown {
  incomeBreakdown: CategoryBreakdown[]
  expenseBreakdown: CategoryBreakdown[]
}

/**
 * CategoryBreakdown[]을 ExpenseCategory[]의 expenseType을 참조하여 수입/지출로 분리
 */
export function separateBreakdownByType(
  breakdown: CategoryBreakdown[],
  categories: ExpenseCategory[],
): SeparatedBreakdown {
  const typeMap = new Map<number, ExpenseType>()
  categories.forEach((cat) => typeMap.set(cat.rowId, cat.expenseType))

  const incomeBreakdown: CategoryBreakdown[] = []
  const expenseBreakdown: CategoryBreakdown[] = []

  breakdown.forEach((item) => {
    // 자식 카테고리는 부모의 타입을 따르므로 parentCategoryRowId 우선 조회
    const lookupId = item.parentCategoryRowId ?? item.categoryRowId
    const type = typeMap.get(lookupId) ?? 'EXPENSE'

    if (type === 'INCOME') {
      incomeBreakdown.push(item)
    } else {
      expenseBreakdown.push(item)
    }
  })

  return { incomeBreakdown, expenseBreakdown }
}

/**
 * 각 항목에 비율(%) 계산 추가
 */
export function withPercentages(
  breakdown: CategoryBreakdown[],
): Array<CategoryBreakdown & { percentage: number }> {
  const total = breakdown.reduce((sum, item) => sum + item.totalAmount, 0)
  if (total === 0) return breakdown.map((item) => ({ ...item, percentage: 0 }))

  return breakdown.map((item) => ({
    ...item,
    percentage: Math.round((item.totalAmount / total) * 1000) / 10,
  }))
}
