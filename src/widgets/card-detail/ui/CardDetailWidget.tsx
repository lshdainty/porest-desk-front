import { useTranslation } from 'react-i18next'
import { useCardCatalogDetail } from '@/features/card-catalog'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { CardInfoHeader } from './CardInfoHeader'
import { CardPerformanceSection } from './CardPerformanceSection'
import { AvailableBenefitsList } from './AvailableBenefitsList'
import { CardCautionList } from './CardCautionList'
import { CardSearchTagsSection } from './CardSearchTagsSection'

// 모바일 카드 다이어트 — 스켈레톤 셸: 모바일은 카드 없이, 데스크톱은 Card.
// (렌더 중 컴포넌트 생성 금지 — React Compiler 룰 — 로 모듈 레벨 정의.)
function Shell({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  return mobile ? <div>{children}</div> : <Card><CardContent className="p-5">{children}</CardContent></Card>
}

interface Props {
  /** Asset.cardCatalog.rowId 또는 직접 전달된 카드 row id */
  cardCatalogRowId: number
  /** 실적 섹션 표시에 필요 — asset.rowId */
  assetRowId?: number
  /** 모바일 카드 다이어트 — 하위 섹션들의 셸 카드를 벗기고 플랫 렌더 */
  mobile?: boolean
}

export function CardDetailWidget({ cardCatalogRowId, assetRowId, mobile = false }: Props) {
  const { t } = useTranslation('card')
  const { data: detail, isLoading, error } = useCardCatalogDetail(cardCatalogRowId)

  if (isLoading) {
    return (
      <div className={mobile ? 'space-y-9' : 'space-y-4'}>
        {/* CardInfoHeader: 카드 이미지(h-32 w-52) + 회사명/카드명/배지 */}
        <Shell mobile={mobile}>
          <div className="flex flex-col gap-5 sm:flex-row">
            <SkeletonBase className="h-32 w-52 shrink-0 self-center rounded-lg sm:self-start" />
            <div className="flex-1 space-y-2">
              <SkeletonBase className="h-4 w-1/3" />
              <SkeletonBase className="h-7 w-2/3" />
              <div className="flex gap-1.5">
                <SkeletonBase className="h-5 w-12 rounded-full" />
                <SkeletonBase className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </Shell>
        {/* CardPerformanceSection: 전월 실적 헤더 + 진행 바 */}
        <Shell mobile={mobile}>
          <div className="space-y-1.5">
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <SkeletonBase className="h-3 w-16" />
              <SkeletonBase className="h-3 w-20" />
            </div>
          </div>
        </Shell>
        {/* AvailableBenefitsList: 혜택 헤더 + 아이콘(h-8 w-8 rounded) 행 목록 */}
        <Shell mobile={mobile}>
          <div className="space-y-3">
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
          </div>
        </Shell>
      </div>
    )
  }

  if (error || !detail) {
    return <div className="text-sm text-destructive">{t('detail.loadError')}</div>
  }

  return (
    // 모바일 카드 다이어트 — 섹션 gap 36 이 카드 대신 구분 담당.
    <div className={mobile ? 'space-y-9' : 'space-y-4'}>
      <CardInfoHeader detail={detail} mobile={mobile} />
      {assetRowId != null && <CardPerformanceSection assetRowId={assetRowId} mobile={mobile} />}
      <AvailableBenefitsList benefits={detail.benefits} mobile={mobile} />
      {detail.searchBenefits.length > 0 && (
        <CardSearchTagsSection groups={detail.searchBenefits} title={t('detail.searchTagsTitle')} mobile={mobile} />
      )}
      <CardCautionList cautions={detail.cautions} mobile={mobile} />
    </div>
  )
}
