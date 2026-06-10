import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { useAsset } from '@/features/asset'
import { CardDetailWidget } from '@/widgets/card-detail'

export const CardDetailPage = () => {
  const { assetRowId } = useParams<{ assetRowId: string }>()
  const navigate = useNavigate()

  const assetId = Number(assetRowId)
  const { data: asset, isLoading } = useAsset(assetId)

  if (!assetRowId || Number.isNaN(assetId)) {
    return <div className="p-6 text-sm text-destructive">잘못된 자산 ID</div>
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-6 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ChevronLeft className="h-4 w-4" />
        뒤로
      </Button>

      {isLoading && (
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
        </div>
      )}

      {!isLoading && asset && !asset.cardCatalog && (
        <div className="rounded-md border bg-muted/50 p-4 text-sm">
          이 자산에는 연결된 카드 카탈로그가 없습니다. 자산 편집에서 카드를 선택해주세요.
        </div>
      )}

      {!isLoading && asset?.cardCatalog && (
        <CardDetailWidget cardCatalogRowId={asset.cardCatalog.rowId} assetRowId={asset.rowId} />
      )}
    </div>
  )
}
