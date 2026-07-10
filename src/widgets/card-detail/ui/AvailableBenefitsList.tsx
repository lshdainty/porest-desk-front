import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  /** 모바일 카드 다이어트 — 셸 카드 벗기고 flat-group 헤드 + 아코디언 리스트(divide-y 유지) */
  mobile?: boolean
}

export function AvailableBenefitsList({ benefits, mobile = false }: Props) {
  const { t } = useTranslation('card')
  if (benefits.length === 0) {
    if (mobile) {
      return (
        <section>
          <div className="flat-group__head"><h2>{t('detail.benefitsTitle')}</h2></div>
          <div className="text-sm text-muted-foreground">{t('detail.noBenefits')}</div>
        </section>
      )
    }
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('detail.benefitsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 text-sm text-muted-foreground">
          {t('detail.noBenefits')}
        </CardContent>
      </Card>
    )
  }

  const list = (
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
  )
  if (mobile) {
    return (
      <section>
        <div className="flat-group__head">
          <h2>{t('detail.benefitsTitle')}</h2>
          <Badge variant="secondary" className="ml-auto rounded-full">
            {benefits.length}
          </Badge>
        </div>
        {list}
      </section>
    )
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{t('detail.benefitsTitle')}</CardTitle>
        <Badge variant="secondary" className="rounded-full">
          {benefits.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">{list}</CardContent>
    </Card>
  )
}
