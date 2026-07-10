import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { decodeHtml } from '@/shared/lib'
import type { CardTagGroup } from '@/entities/card'

interface Props {
  groups: CardTagGroup[]
  title?: string
  /** 모바일 카드 다이어트 — 셸 카드 벗기고 flat-group 헤드 + 태그 그룹 */
  mobile?: boolean
}

export function CardSearchTagsSection({ groups, title, mobile = false }: Props) {
  const { t } = useTranslation('card')
  if (groups.length === 0) return null

  const body = (
    <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.category} className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {decodeHtml(g.category)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.tags.map((t, i) => (
                <Badge
                  key={`${g.category}-${i}`}
                  variant="secondary"
                  className="font-normal"
                >
                  {decodeHtml(t)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
  if (mobile) {
    return (
      <section>
        <div className="flat-group__head"><h2>{title ?? t('detail.benefitTagsTitle')}</h2></div>
        {body}
      </section>
    )
  }
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title ?? t('detail.benefitTagsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
