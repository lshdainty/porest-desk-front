import { useCardCatalogDetail } from '@/features/card-catalog'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { CardInfoHeader } from './CardInfoHeader'
import { CardPerformanceSection } from './CardPerformanceSection'
import { AvailableBenefitsList } from './AvailableBenefitsList'
import { CardCautionList } from './CardCautionList'
import { CardSearchTagsSection } from './CardSearchTagsSection'

interface Props {
  /** Asset.cardCatalog.rowId 또는 직접 전달된 카드 row id */
  cardCatalogRowId: number
  /** 실적 섹션 표시에 필요 — asset.rowId */
  assetRowId?: number
}

export function CardDetailWidget({ cardCatalogRowId, assetRowId }: Props) {
  const { data: detail, isLoading, error } = useCardCatalogDetail(cardCatalogRowId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-surface-default p-4 space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonBase className="h-12 w-20 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBase className="h-5 w-2/3" />
              <SkeletonBase className="h-3 w-1/3" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-surface-default p-4 space-y-3">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <SkeletonBase className="h-3 w-16" />
            <SkeletonBase className="h-3 w-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-surface-default p-4 space-y-3">
          <SkeletonBase className="h-5 w-32" />
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBase className="h-4 w-2/3" />
                <SkeletonBase className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return <div className="text-sm text-destructive">카드 정보를 불러올 수 없습니다</div>
  }

  return (
    <div className="space-y-4">
      <CardInfoHeader detail={detail} />
      {assetRowId != null && <CardPerformanceSection assetRowId={assetRowId} />}
      <AvailableBenefitsList benefits={detail.benefits} />
      {detail.searchBenefits.length > 0 && (
        <CardSearchTagsSection groups={detail.searchBenefits} title="검색 태그" />
      )}
      <CardCautionList cautions={detail.cautions} />
    </div>
  )
}
