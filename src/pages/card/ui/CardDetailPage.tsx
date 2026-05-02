import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
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
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        뒤로
      </Button>

      {isLoading && <div className="text-sm text-muted-foreground">불러오는 중…</div>}

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
