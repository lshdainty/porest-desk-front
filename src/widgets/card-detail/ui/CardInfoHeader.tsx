import { ExternalLink } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { decodeHtml } from '@/shared/lib'
import type { CardCatalogDetail } from '@/entities/card'

interface Props {
  detail: CardCatalogDetail
}

function formatKRW(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

export function CardInfoHeader({ detail }: Props) {
  const s = detail.summary
  const cardName = decodeHtml(s.cardName)
  const companyName = decodeHtml(s.company?.name ?? '')

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
        {s.imgUrl && (
          <div className="relative shrink-0 self-center sm:self-start">
            <img
              src={s.imgUrl}
              alt={cardName}
              className="h-32 w-52 rounded-lg object-cover shadow-md ring-1 ring-black/5"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {s.company?.logoUrl && (
                <img
                  src={s.company.logoUrl}
                  alt=""
                  className="h-5 w-5 rounded object-contain"
                />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {companyName}
              </span>
              {s.isDiscontinued === 'Y' && (
                <Badge variant="destructive" className="ml-auto">
                  단종
                </Badge>
              )}
            </div>
            <h2 className="truncate text-xl font-semibold leading-tight sm:text-2xl">
              {cardName}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {s.cardType === 'CREDIT' ? '신용' : '체크'}
              </Badge>
              <Badge variant="outline">
                {s.benefitType === 'DISCOUNT'
                  ? '할인형'
                  : s.benefitType === 'MILEAGE'
                    ? '마일리지형'
                    : '포인트형'}
              </Badge>
              {detail.brands.map((b) => (
                <Badge key={b} variant="outline" className="font-normal">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Separator className="mb-3" />
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">연회비</dt>
                <dd className="font-semibold tabular-nums">
                  {s.annualFee.amount > 0
                    ? `${formatKRW(s.annualFee.amount)}원`
                    : '없음'}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">전월 실적</dt>
                <dd className="font-semibold tabular-nums">
                  {s.performance.isRequired === 'Y'
                    ? `${formatKRW(s.performance.requiredAmount)}원 이상`
                    : '실적 무관'}
                </dd>
              </div>
            </dl>
            {s.detailUrl && (
              <a
                href={s.detailUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                카드고릴라 원문
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
