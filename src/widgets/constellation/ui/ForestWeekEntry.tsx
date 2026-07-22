import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Cloudy, Moon, Sparkle, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import {
  constellationColorVar,
  constellationName,
  type CollectionEntry,
  type ConstellationToday,
  type SkyDay,
} from '@/features/constellation'
import { ConstellationSVG } from './ConstellationSVG'

/** 오늘 진행 단계 아이콘 — MySkyCard STAGES 미러. */
const STAGES: { min: number; Icon: LucideIcon }[] = [
  { min: 0, Icon: Moon },
  { min: 1, Icon: Sparkle },
  { min: 3, Icon: Sparkles },
  { min: 5, Icon: Star },
]
function stageIconOf(points: number): LucideIcon {
  let icon: LucideIcon = Moon
  for (const stage of STAGES) if (points >= stage.min) icon = stage.Icon
  return icon
}

/**
 * 관측 리포트 진입 카드 — 최근 7일 도트 + 오늘의 목표 배지.
 * 디자인 SoT: forest-report.jsx ForestWeekEntry.
 */
export function ForestWeekEntry({
  today,
  sky,
  entries,
  mobile,
  onOpen,
}: {
  today: ConstellationToday
  sky: SkyDay[]
  entries: CollectionEntry[]
  mobile: boolean
  onOpen: () => void
}) {
  const { t, i18n } = useTranslation('constellation')
  const name = constellationName(today.constellation, i18n.language)
  const days = useMemo(() => sky.slice(-7), [sky])
  const todayISO = sky[sky.length - 1]?.date ?? ''
  const StageIcon = stageIconOf(today.points)
  const byKey = useMemo(() => {
    const map = new Map<string, CollectionEntry>()
    entries.forEach(entry => map.set(entry.constellation.constellationKey, entry))
    return map
  }, [entries])
  // 요일 라벨 — 로케일 짧은 요일.
  const dowOf = (ds: string) =>
    new Date(`${ds}T00:00:00`).toLocaleDateString(i18n.language.startsWith('ko') ? 'ko-KR' : 'en-US', {
      weekday: i18n.language.startsWith('ko') ? 'narrow' : 'short',
    })

  const body = (
    <button type="button" className="frp-entry" onClick={onOpen}>
      <span className="frp-entry__art">
        <ConstellationSVG starMap={today.constellation.starMap} size={30} linesOnly />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--fg-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {t('report.title')}
          </span>
          <span className="fcol-badge fcol-badge--rep">
            <Star size={9} strokeWidth={2.6} /> {name}
          </span>
        </span>
        <span className="frp-entry__dots">
          {days.map(d => {
            const isToday = d.date === todayISO
            const grown = d.status === 'GROWN' && d.constellationKey
            const entry = grown ? byKey.get(d.constellationKey!) : null
            const color = entry ? constellationColorVar(entry.constellation.colorKey) : d.colorKey ? constellationColorVar(d.colorKey) : null
            return (
              <span
                key={d.date}
                className={`frp-entry__dot ${isToday ? 'frp-entry__dot--today' : ''}`}
                style={
                  !isToday && grown && color
                    ? { background: `color-mix(in oklab, ${color} 16%, var(--bg-surface))`, color }
                    : undefined
                }
              >
                {isToday ? (
                  <StageIcon size={11} strokeWidth={2.4} />
                ) : grown ? (
                  <Star size={10} strokeWidth={0} fill="currentColor" />
                ) : d.status === 'WITHERED' ? (
                  <Cloudy size={11} strokeWidth={2} />
                ) : (
                  dowOf(d.date)
                )}
              </span>
            )
          })}
        </span>
      </span>
      <ChevronRight size={17} color="var(--fg-tertiary)" />
    </button>
  )

  // 모바일(서브페이지 .m-subpage 플랫) — 카드 벗김. 데스크톱은 Card(padding 0).
  if (mobile) return body
  return <Card style={{ padding: 0, overflow: 'hidden' }}>{body}</Card>
}
