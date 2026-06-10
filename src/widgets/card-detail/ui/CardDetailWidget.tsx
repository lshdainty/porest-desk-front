import { useCardCatalogDetail } from '@/features/card-catalog'
import { Card, CardContent } from '@/shared/ui/card'
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
        {/* CardInfoHeader: 카드 이미지(h-32 w-52) + 회사명/카드명/배지 */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
            <SkeletonBase className="h-32 w-52 shrink-0 self-center rounded-lg sm:self-start" />
            <div className="flex-1 space-y-2">
              <SkeletonBase className="h-4 w-1/3" />
              <SkeletonBase className="h-7 w-2/3" />
              <div className="flex gap-1.5">
                <SkeletonBase className="h-5 w-12 rounded-full" />
                <SkeletonBase className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* CardPerformanceSection: 전월 실적 헤더 + 진행 바 */}
        <Card>
          <CardContent className="space-y-1.5 p-5">
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <SkeletonBase className="h-3 w-16" />
              <SkeletonBase className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
        {/* AvailableBenefitsList: 혜택 헤더 + 아이콘(h-8 w-8 rounded) 행 목록 */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <SkeletonBase className="h-5 w-32" />
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBase className="h-8 w-8 shrink-0 rounded" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBase className="h-4 w-2/3" />
                  <SkeletonBase className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
