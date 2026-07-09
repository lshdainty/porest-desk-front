import { useTranslation } from 'react-i18next'
import { CheckCircle2, Lock } from 'lucide-react'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { type CollectionEntry } from '@/features/constellation'
import { ConstellationSVG } from './ConstellationSVG'

/**
 * 별자리 상세 감상 — 밤하늘 패널에 실제 모양(수집=점등, 미수집=실루엣) + 수집 이력.
 * 반응형은 ModalShell(데스크탑 modal / 모바일 sheet) 재사용. 디자인 SoT: forest.jsx ConstellationDetail.
 */
const SKY_DIM_STARS: [number, number][] = [
  [5, 18], [11, 72], [17, 30], [22, 84], [28, 12], [33, 52], [38, 88],
  [45, 8], [55, 90], [62, 10], [68, 86], [75, 20], [83, 78], [90, 14],
]

export function ConstellationDetailDialog({
  entry,
  onClose,
  mobile,
}: {
  entry: CollectionEntry
  onClose: () => void
  mobile: boolean
}) {
  const { t } = useTranslation('constellation')
  const collected = entry.collectCount > 0
  const key = entry.constellation.constellationKey
  const name = t(`name.${key}`, { defaultValue: entry.constellation.name })
  const description = t(`desc.${key}`, { defaultValue: entry.constellation.description ?? '' })

  return (
    <ModalShell title={t('detail.title')} onClose={onClose} size="sm" mobile={mobile}>
      {/* 밤하늘 감상 패널 — 고정 다크 팔레트 (라이트/다크 공통) */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(165deg, #0d1430 0%, #17224a 60%, #1f2c5e 100%)',
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
              background: 'rgba(200, 212, 255, 0.3)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        <div
          style={{
            color: collected ? '#dfe7ff' : 'rgba(190,205,255,0.4)',
            filter: collected ? 'drop-shadow(0 0 10px rgba(176,196,255,0.55))' : 'none',
          }}
        >
          <ConstellationSVG
            starMap={entry.constellation.starMap}
            lit={collected ? undefined : 0}
            size={180}
          />
        </div>
        {!collected && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(205,216,255,0.65)',
            }}
          >
            {t('detail.notMet')}
          </div>
        )}
      </div>
      {/* 정보 */}
      <div style={{ padding: '16px 4px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-primary)' }}>
            {name}
          </span>
          <span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-brand)' }}>
            {t('collection.starCount', { count: entry.constellation.starCount })}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-secondary)', marginTop: 4 }}>{description}</div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--fg-tertiary)',
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {collected ? <CheckCircle2 size={13} /> : <Lock size={13} />}
          {collected
            ? t('detail.collectedTimes', { count: entry.collectCount })
            : t('detail.hint', { count: entry.constellation.starCount })}
        </div>
      </div>
    </ModalShell>
  )
}
