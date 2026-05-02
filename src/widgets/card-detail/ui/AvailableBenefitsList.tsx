import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import { Separator } from '@/shared/ui/separator'
import { decodeHtml } from '@/shared/lib'
import type { CardBenefit } from '@/entities/card'

interface Props {
  benefits: CardBenefit[]
}

export function AvailableBenefitsList({ benefits }: Props) {
  if (benefits.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">혜택</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 text-sm text-muted-foreground">
          등록된 혜택이 없습니다
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">혜택</CardTitle>
        <Badge variant="secondary" className="rounded-full">
          {benefits.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {benefits.map((b) => {
            const summary = decodeHtml(b.summary ?? b.title ?? '')
            const detail = decodeHtml(b.detail ?? '')
            const hasDetail = detail.length > 0

            return (
              <li key={b.rowId}>
                <Collapsible>
                  <CollapsibleTrigger
                    disabled={!hasDetail}
                    className="group flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    {b.categoryIcon && (
                      <img
                        src={b.categoryIcon}
                        alt=""
                        className="mt-0.5 h-8 w-8 shrink-0 rounded object-contain"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <Badge variant="outline" className="font-normal">
                        {decodeHtml(b.category)}
                      </Badge>
                      <p className="text-sm font-medium leading-snug">{summary}</p>
                    </div>
                    {hasDetail && (
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    )}
                  </CollapsibleTrigger>
                  {hasDetail && (
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <Separator />
                      <div className="bg-muted/30 py-3 pl-15 pr-4">
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                          {detail}
                        </p>
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
