import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import { Separator } from '@/shared/ui/separator'
import { decodeHtml } from '@/shared/lib'
import type { CardBenefit } from '@/entities/card'

interface Props {
  cautions: CardBenefit[]
}

export function CardCautionList({ cautions }: Props) {
  if (cautions.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          유의사항
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {cautions.map((c) => {
            const summary = decodeHtml(c.summary ?? '')
            const detail = decodeHtml(c.detail ?? '')
            const hasDetail = detail.length > 0

            return (
              <li key={c.rowId}>
                <Collapsible>
                  <CollapsibleTrigger
                    disabled={!hasDetail}
                    className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {summary || '세부 사항'}
                    </span>
                    {hasDetail && (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    )}
                  </CollapsibleTrigger>
                  {hasDetail && (
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <Separator />
                      <div className="bg-muted/30 px-4 py-3">
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
