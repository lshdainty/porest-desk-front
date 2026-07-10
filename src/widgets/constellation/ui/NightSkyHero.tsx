import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, Moon, Sparkles } from 'lucide-react'
import { constellationName, parseStarMap, type ConstellationToday } from '@/features/constellation'

/**
 * 밤하늘 히어로 — 오늘의 목표 별자리가 별빛만큼 점등된다.
 * 밤 장면이라 라이트/다크 공통의 고정 다크 팔레트(dashboard hero 선례의 커스텀 컨테이너 영역).
 * 디자인 SoT: 클로드 디자인 forest.jsx ForestHero.
 */
const SKY_DIM_STARS: [number, number][] = [
  [5, 18], [11, 72], [17, 30], [22, 84], [28, 12], [33, 52], [38, 88],
  [45, 8], [55, 90], [62, 10], [68, 86], [75, 20], [83, 78], [90, 14],
  [95, 52], [8, 48], [92, 82], [60, 30], [20, 58], [86, 44],
]

export function NightSkyHero({
  today,
  doneToday,
  mobile,
}: {
  today: ConstellationToday
  doneToday: number
  mobile: boolean
}) {
  const { t, i18n } = useTranslation('constellation')
  const map = useMemo(() => parseStarMap(today.constellation.starMap), [today.constellation.starMap])
  const lit = Math.min(today.points, today.goal)
  const done = today.collected
  const name = constellationName(today.constellation, i18n.language)
  const lineColor = done ? 'rgba(178, 197, 255, 0.85)' : 'rgba(148, 168, 235, 0.5)'

  const caption = done
    ? t('hero.captionDone')
    : doneToday > 0 || today.memoPoints > 0
      ? [
          t('hero.captionProgress', { count: doneToday }),
          today.memoPoints > 0 ? t('hero.captionMemo', { count: today.memoPoints }) : null,
          t('hero.captionRemain', { count: today.goal - lit }),
        ]
          .filter(Boolean)
          .join(' · ')
      : t('hero.captionEmpty')

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        background: 'linear-gradient(155deg, #0d1430 0%, #17224a 55%, #1f2c5e 100%)',
        height: mobile ? 168 : 208,
      }}
    >
      {/* 은은한 달빛 */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: 999,
          background: 'radial-gradient(circle, rgba(154,176,255,0.16) 0%, transparent 65%)',
        }}
      />
      <span style={{ position: 'absolute', top: 14, right: 16, color: 'rgba(210,220,255,0.55)', display: 'inline-flex' }}>
        <Moon size={mobile ? 15 : 17} strokeWidth={1.7} />
      </span>

      {/* 좌상단: 오늘의 목표 */}
      <div style={{ position: 'absolute', top: mobile ? 12 : 15, left: mobile ? 16 : 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', color: 'rgba(205,216,255,0.62)' }}>
          {t('hero.todayTarget')}
        </div>
        <div
          style={{
            fontSize: mobile ? 16 : 18,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#f2f5ff',
            marginTop: 2,
          }}
        >
          {done ? t('hero.collectedBang', { name }) : name}
          <span
            className="num"
            style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(190,205,255,0.85)', marginLeft: 8 }}
          >
            {t('hero.starlightCount', { lit, goal: today.goal })}
          </span>
        </div>
      </div>

      {/* 배경 잔별 */}
      {SKY_DIM_STARS.map(([x, y], i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: i % 3 === 0 ? 2.5 : 1.5,
            height: i % 3 === 0 ? 2.5 : 1.5,
            borderRadius: 999,
            background: 'rgba(200, 212, 255, 0.32)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* 별자리 figure — 비율 유지 박스 (중앙) */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          bottom: '24%',
          left: '50%',
          transform: 'translateX(-50%)',
          aspectRatio: '1.45',
        }}
      >
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {map.edges.map(([a, b], i) => {
            const pa = map.pts[a]
            const pb = map.pts[b]
            if (!pa || !pb || a >= lit || b >= lit) return null
            return (
              <line
                key={i}
                x1={pa[0]}
                y1={pa[1]}
                x2={pb[0]}
                y2={pb[1]}
                stroke={lineColor}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeDasharray={done ? 'none' : '3 4'}
              />
            )
          })}
        </svg>
        {map.pts.map(([x, y], i) => {
          const on = i < lit
          // 별 수 적응형 점 크기 — 실좌표 별자리(최대 27별)의 밀집 구간 겹침 방지
          const dense = map.pts.length > 15
          const onSize = dense ? (mobile ? 5 : 6) : mobile ? 7 : 8
          const offSize = dense ? 3.5 : 5
          return (
            <span
              key={i}
              className={on ? 'constellation-pop' : undefined}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: on ? onSize : offSize,
                height: on ? onSize : offSize,
                borderRadius: 999,
                transform: 'translate(-50%, -50%)',
                background: on ? '#e8eeff' : 'transparent',
                border: on ? 'none' : '1px solid rgba(190, 205, 255, 0.45)',
                boxShadow: on
                  ? `0 0 ${done ? 14 : 9}px 2px rgba(176, 196, 255, ${done ? 0.8 : 0.55})`
                  : 'none',
                transition: 'all var(--motion-duration-fast) var(--motion-ease-out)',
              }}
            />
          )
        })}
      </div>

      {/* 좌하단: 진행 캡션 */}
      <div style={{ position: 'absolute', left: mobile ? 16 : 20, bottom: mobile ? 13 : 16 }}>
        <div style={{ fontSize: mobile ? 11 : 11.5, color: 'rgba(198,209,250,0.55)' }}>{caption}</div>
      </div>

      {/* 우하단: 스트릭 */}
      <div
        style={{
          position: 'absolute',
          right: mobile ? 14 : 18,
          bottom: mobile ? 13 : 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.09)',
            borderRadius: 999,
            padding: mobile ? '4px 10px' : '5px 12px',
            color: '#e6ecff',
            fontSize: mobile ? 11.5 : 12,
            fontWeight: 700,
          }}
        >
          <Sparkles size={12} strokeWidth={2} />
          {t('hero.streak', { count: today.streak })}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 600,
            color: 'rgba(190,205,255,0.7)',
          }}
        >
          <Cloud size={11} /> {t('hero.guardInfo', { count: today.guardCount })}
        </div>
      </div>
    </div>
  )
}
