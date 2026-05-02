import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { decodeHtml } from '@/shared/lib'
import type { CardTagGroup } from '@/entities/card'

interface Props {
  groups: CardTagGroup[]
  title?: string
}

export function CardSearchTagsSection({ groups, title = '혜택 태그' }: Props) {
  if (groups.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  )
}
