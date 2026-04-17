import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { CardPerformanceBar, useCardPerformance } from '@/features/card-performance'

interface Props {
  assetRowId: number
}

function currentYearMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function CardPerformanceSection({ assetRowId }: Props) {
  const [ym, setYm] = useState(currentYearMonth())
  const { data: performance, isLoading } = useCardPerformance(assetRowId, ym)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">전월 실적</CardTitle>
        <Input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="h-8 w-[140px]"
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">불러오는 중…</div>
        ) : performance ? (
          <CardPerformanceBar performance={performance} />
        ) : (
          <div className="text-sm text-muted-foreground">실적 정보를 불러올 수 없습니다</div>
        )}
      </CardContent>
    </Card>
  )
}
