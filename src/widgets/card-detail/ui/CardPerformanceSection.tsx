import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
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
  const { t } = useTranslation('card')
  const [ym, setYm] = useState(currentYearMonth())
  const { data: performance, isLoading } = useCardPerformance(assetRowId, ym)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{t('benefit.statPerformance')}</CardTitle>
        <Input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="h-8 w-[140px]"
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <SkeletonBase className="h-4 w-2/3" />
              <SkeletonBase className="h-4 w-12" />
            </div>
            <SkeletonBase className="h-2 w-full rounded-full" />
            <SkeletonBase className="h-3 w-1/2" />
          </div>
        ) : performance ? (
          <CardPerformanceBar performance={performance} />
        ) : (
          <div className="text-sm text-muted-foreground">{t('detail.performanceLoadError')}</div>
        )}
      </CardContent>
    </Card>
  )
}
