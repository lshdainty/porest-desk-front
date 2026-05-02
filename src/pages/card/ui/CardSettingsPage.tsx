import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { CardBenefitMappingEditor } from '@/features/card-benefit-mapping'

export const CardSettingsPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">카드 혜택 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          카드 혜택 카테고리를 가계부 경비 카테고리에 매핑합니다. 매핑된 카테고리의 지출 발생 시 해당 카드의 혜택이 자동 제안됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">혜택 카테고리 매핑</CardTitle>
        </CardHeader>
        <CardContent>
          <CardBenefitMappingEditor />
        </CardContent>
      </Card>
    </div>
  )
}
