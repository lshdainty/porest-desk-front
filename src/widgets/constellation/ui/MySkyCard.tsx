import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloudy, Moon, Sparkle, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import {
  constellationColorVar,
  type CollectionEntry,
  type ConstellationToday,
  type SkyDay,
} from '@/features/constellation'
import { ConstellationSVG } from './ConstellationSVG'

/**
 * 나의 밤하늘 — 최근 2주 관측 그리드. GROWN=수집 별자리 미니 SVG, WITHERED=흐린 밤,
 * REST=쉼(점), 오늘=진행 단계 아이콘. 디자인 SoT: forest.jsx MyForest.
 */
const STAGES: { min: number; Icon: LucideIcon }[] = [
  { min: 0, Icon: Moon },
  { min: 1, Icon: Sparkle },
  { min: 3, Icon: Sparkles },
  { min: 5, Icon: Star },
]

function stageIconOf(points: number): LucideIcon {
  let icon: LucideIcon = Moon
  for (const stage of STAGES) {
    if (points >= stage.min) icon = stage.Icon
  }
  return icon
}

export function MySkyCard({
  sky,
  today,
  entries,
  mobile,
}: {
  sky: SkyDay[]
  today: ConstellationToday
  entries: CollectionEntry[]
  mobile: boolean
}) {
  const { t } = useTranslation('constellation')
  const byKey = useMemo(() => {
    const map = new Map<string, CollectionEntry>()
    entries.forEach(entry => map.set(entry.constellation.constellationKey, entry))
    return map
  }, [entries])
  const todayISO = sky[sky.length - 1]?.date ?? ''
  const StageIcon = stageIconOf(today.points)

  return (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
          {t('mySky.title')}
        </h2>
        <span className="num" style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginLeft: 'auto' }}>
          {t('mySky.total', { count: today.totalCollected })}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginBottom: 12 }}>{t('mySky.subtitle')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {sky.map(day => {
          const dayNum = parseInt(day.date.slice(8), 10)
          const isToday = day.date === todayISO
          const entry = day.constellationKey ? byKey.get(day.constellationKey) : undefined
          const grownColor = day.colorKey ? constellationColorVar(day.colorKey) : 'var(--fg-tertiary)'
          return (
            <div key={day.date} style={{ textAlign: 'center' }}>
              <div
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isToday
                    ? 'color-mix(in oklab, var(--color-primary) 10%, var(--bg-surface))'
                    : day.status === 'GROWN'
                      ? `color-mix(in oklab, ${grownColor} 13%, var(--bg-surface))`
                      : 'var(--bg-sunken)',
                  boxShadow: isToday ? 'inset 0 0 0 1.5px var(--color-primary)' : 'none',
                  color: isToday
                    ? 'var(--fg-brand)'
                    : day.status === 'GROWN'
                      ? grownColor
                      : day.status === 'WITHERED'
                        ? 'var(--fg-tertiary)'
                        : 'var(--fg-tertiary)',
                  opacity: day.status === 'WITHERED' && !isToday ? 0.75 : 1,
                }}
              >
                {isToday ? (
                  <StageIcon size={16} strokeWidth={2} />
                ) : day.status === 'GROWN' && entry ? (
                  <ConstellationSVG starMap={entry.constellation.starMap} size={22} />
                ) : day.status === 'WITHERED' ? (
                  <Cloudy size={15} strokeWidth={1.6} />
                ) : (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 999,
                      background: 'currentColor',
                      display: 'inline-block',
                    }}
                  />
                )}
              </div>
              <div
                className="num"
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  color: isToday ? 'var(--fg-brand)' : 'var(--fg-tertiary)',
                  fontWeight: isToday ? 700 : 500,
                }}
              >
                {dayNum}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
