import type { ExpenseCategory, ExpenseCategoryTreeNode, CategoryBreakdown, ParentCategoryBreakdown } from '../model/types'

export function buildCategoryTree(categories: ExpenseCategory[]): ExpenseCategoryTreeNode[] {
  const map = new Map<number, ExpenseCategoryTreeNode>()
  const roots: ExpenseCategoryTreeNode[] = []

  categories.forEach((cat) => map.set(cat.rowId, { ...cat, children: [] }))

  categories.forEach((cat) => {
    const node = map.get(cat.rowId)!
    if (cat.parentRowId && map.has(cat.parentRowId)) {
      map.get(cat.parentRowId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export function getSelectableCategories(categories: ExpenseCategory[]): ExpenseCategory[] {
  return categories.filter((cat) => !cat.hasChildren)
}

export function aggregateByParent(breakdown: CategoryBreakdown[]): ParentCategoryBreakdown[] {
  const parentMap = new Map<number, ParentCategoryBreakdown>()

  breakdown.forEach((item) => {
    const parentId = item.parentCategoryRowId ?? item.categoryRowId
    const parentName = item.parentCategoryName ?? item.categoryName

    if (!parentMap.has(parentId)) {
      parentMap.set(parentId, {
        categoryRowId: parentId,
        categoryName: parentName,
        totalAmount: 0,
        children: [],
      })
    }

    const parent = parentMap.get(parentId)!
    parent.totalAmount += item.totalAmount

    if (item.parentCategoryRowId) {
      parent.children.push(item)
    }
  })

  return Array.from(parentMap.values())
}
