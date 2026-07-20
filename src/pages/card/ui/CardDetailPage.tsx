import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { useAsset } from '@/features/asset'
import { CardDetailWidget } from '@/widgets/card-detail'
import { useDeviceSize } from '@/shared/lib/porest/responsive'

export const CardDetailPage = () => {
  const { t } = useTranslation('card')
  const { assetRowId } = useParams<{ assetRowId: string }>()
  const navigate = useNavigate()
  // 모바일 카드 다이어트 — 이 페이지는 Outlet ctx 밖 라우트라 디바이스 훅으로 판정.
  const mobile = useDeviceSize() === 'mobile'

  const assetId = Number(assetRowId)
  const { data: asset, isLoading } = useAsset(assetId)

  if (!assetRowId || Number.isNaN(assetId)) {
    return <div className="p-6 text-sm text-destructive">{t('cardDetail.invalidAssetId')}</div>
  }

  return (
    // max-w-3xl 금지 — porest --spacing-3xl 이 Tailwind 스케일을 가려 48px 로 컴파일됨.
    <div className="mx-auto w-full max-w-[48rem] space-y-4 px-5 py-6 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ChevronLeft className="h-4 w-4" />
        {t('cardDetail.back')}
      </Button>

      {isLoading && (
        <div className={mobile ? 'space-y-9' : 'space-y-4'}>
          {/* CardInfoHeader: 카드 이미지(h-32 w-52) + 회사명/카드명/배지 — 모바일은 셸 카드 없이 */}
          {mobile ? (
            <>
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
              <div className="space-y-1.5">
                <SkeletonBase className="h-4 w-24" />
                <SkeletonBase className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <SkeletonBase className="h-3 w-16" />
                  <SkeletonBase className="h-3 w-20" />
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {!isLoading && asset && !asset.cardCatalog && (
        <div className="rounded-md border bg-muted/50 p-4 text-sm">
          {t('cardDetail.noCardCatalog')}
        </div>
      )}

      {!isLoading && asset?.cardCatalog && (
        <CardDetailWidget cardCatalogRowId={asset.cardCatalog.rowId} assetRowId={asset.rowId} mobile={mobile} />
      )}
    </div>
  )
}
