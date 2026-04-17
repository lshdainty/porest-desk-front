import { useMemo, useState } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useExpenseCategories } from '@/features/expense'
import {
  useCardBenefitMappings,
  useDeleteCardBenefitMapping,
  useUpsertCardBenefitMapping,
} from '../model/useCardBenefitMappings'

export function CardBenefitMappingEditor() {
  const { data: mappingData, isLoading } = useCardBenefitMappings()
  const { data: categories } = useExpenseCategories()
  const upsertMutation = useUpsertCardBenefitMapping()
  const deleteMutation = useDeleteCardBenefitMapping()

  const [filter, setFilter] = useState('')

  const leafCategories = useMemo(
    () => (categories ?? []).filter((c) => c.parentRowId != null && c.expenseType === 'EXPENSE'),
    [categories]
  )

  const mappings = mappingData?.mappings ?? []
  const filtered = filter.trim()
    ? mappings.filter((m) => m.benefitCategory.includes(filter.trim()))
    : mappings

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">불러오는 중…</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="혜택 카테고리로 필터"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="text-xs text-muted-foreground">총 {mappings.length}개</div>
      </div>

      <div className="divide-y rounded-md border">
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <div>혜택 카테고리</div>
          <div>가계부 경비 카테고리</div>
          <div>상태</div>
          <div className="w-20 text-right">작업</div>
        </div>
        {filtered.map((m) => (
          <div
            key={`${m.rowId}-${m.benefitCategory}`}
            className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-3 px-4 py-2.5 text-sm"
          >
            <div className="truncate font-medium">{m.benefitCategory}</div>
            <div>
              <Select
                value={`${m.expenseCategoryRowId}`}
                onValueChange={(v) =>
                  upsertMutation.mutate({
                    benefitCategory: m.benefitCategory,
                    expenseCategoryRowId: Number(v),
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leafCategories.map((c) => (
                    <SelectItem key={c.rowId} value={`${c.rowId}`}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              {m.isCustom ? (
                <Badge variant="default">커스텀</Badge>
              ) : (
                <Badge variant="secondary">공용</Badge>
              )}
            </div>
            <div className="w-20 text-right">
              {m.isCustom && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(m.rowId)}
                  disabled={deleteMutation.isPending}
                >
                  초기화
                </Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">매핑이 없습니다</div>
        )}
      </div>
    </div>
  )
}
