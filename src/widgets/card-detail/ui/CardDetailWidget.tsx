import { useCardCatalogDetail } from '@/features/card-catalog'
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
    return <div className="text-sm text-muted-foreground">불러오는 중…</div>
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
