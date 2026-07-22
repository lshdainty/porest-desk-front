import { useTranslation } from 'react-i18next'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { constellationName, type ConstellationToday } from '@/features/constellation'
import { ConstellationSVG } from './ConstellationSVG'

/**
 * 밤하늘 상태 스트립 — 할일 화면의 유일한 게임 요소(슬림 진입점).
 * 탭 → 밤하늘 화면(NightSkyPanel). 디자인 SoT: forest-report.jsx ForestStrip.
 */
export function ForestStrip({
  today,
  mobile,
  onOpen,
}: {
  today: ConstellationToday
  mobile: boolean
  onOpen: () => void
}) {
  const { t, i18n } = useTranslation('constellation')
  const lit = Math.min(today.points, today.goal)
  const done = today.collected
  const name = constellationName(today.constellation, i18n.language)

  const body = (
    <button type="button" className="fstrip" onClick={onOpen}>
      <span className="fstrip__art">
        <ConstellationSVG starMap={today.constellation.starMap} size={24} lit={lit} dim={!done} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--fg-primary)',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {done ? t('strip.done', { name }) : t('strip.title', { name })}
        </span>
        <span className="fstrip__meter">
          {Array.from({ length: today.goal }, (_, i) => (
            <i key={i} className={i < lit ? 'on' : ''} />
          ))}
          <em className="num">
            {lit}/{today.goal}
          </em>
        </span>
      </span>
      <span className="fstrip__streak">
        <Sparkles size={11} strokeWidth={2.2} /> {t('strip.streak', { count: today.streak })}
      </span>
      <ChevronRight size={16} color="var(--fg-tertiary)" />
    </button>
  )

  // 모바일 카드 다이어트 — 카드 벗김. 데스크톱은 Card(padding 0) 셸.
  if (mobile) return body
  return <Card style={{ padding: 0, overflow: 'hidden' }}>{body}</Card>
}
