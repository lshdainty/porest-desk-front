import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Crown, Sparkles } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import {
  constellationDesc,
  constellationName,
  type CollectionEntry,
  type ConstellationCollection,
} from '@/features/constellation'
import { ConstellationSVG } from './ConstellationSVG'
import { ConstellationDetailDialog } from './ConstellationDetailDialog'

/**
 * 별자리 도감 v2 — 실루엣 잠금 + 뱃지(오늘의 목표/NEW/수집 N회) + 감상하기/미리보기 CTA.
 * 디자인 SoT: forest-report.jsx ForestCollectionV2.
 */
export function CollectionCard({
  collection,
  todayKey,
  mobile,
}: {
  collection: ConstellationCollection
  todayKey: string
  mobile: boolean
}) {
  const { t, i18n } = useTranslation('constellation')
  const [detail, setDetail] = useState<CollectionEntry | null>(null)

  // NEW 뱃지 — 가장 최근 수집(lastCollectedDate 최대) 별자리 1종.
  const newestKey = useMemo(() => {
    let key: string | null = null
    let max = ''
    for (const entry of collection.entries) {
      if (entry.collectCount > 0 && entry.lastCollectedDate && entry.lastCollectedDate > max) {
        max = entry.lastCollectedDate
        key = entry.constellation.constellationKey
      }
    }
    return key
  }, [collection.entries])

  const head = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: 0,
        padding: mobile ? '16px 0 4px' : '18px 22px 4px',
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
        {t('collection.title')}
      </h2>
      <span
        className="num"
        style={{
          fontSize: 12,
          color: 'var(--fg-tertiary)',
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Sparkles size={12} />
        {t('collection.progress', { collected: collection.collectedKinds, total: collection.entries.length })}
      </span>
    </div>
  )

  const rows = (
    <div>
      {collection.entries.map((entry, i) => {
        const key = entry.constellation.constellationKey
        const owned = entry.collectCount > 0
        const isToday = key === todayKey
        const name = constellationName(entry.constellation, i18n.language)
        const description = constellationDesc(entry.constellation, i18n.language)
        return (
          <div
            key={key}
            className="fcol-row"
            style={{
              ...(i === 0 ? { borderTop: 'none' } : null),
              ...(mobile ? { paddingLeft: 0, paddingRight: 0 } : null),
            }}
          >
            <span className={`fcol-art ${owned ? '' : 'fcol-art--locked'}`}>
              <ConstellationSVG
                starMap={entry.constellation.starMap}
                size={mobile ? 56 : 62}
                dim={!owned}
                lit={owned ? entry.constellation.starCount : 0}
              />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: owned ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                  }}
                >
                  {name}
                </span>
                {isToday && (
                  <span className="fcol-badge fcol-badge--rep">
                    <Crown size={9} strokeWidth={2.6} /> {t('collection.todayBadge')}
                  </span>
                )}
                {key === newestKey && owned && (
                  <span className="fcol-badge fcol-badge--new">{t('collection.badgeNew')}</span>
                )}
                {owned && (
                  <span className="fcol-badge fcol-badge--own">
                    {t('collection.timesCollected', { count: entry.collectCount })}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--fg-tertiary)',
                  marginTop: 3,
                  lineHeight: 1.5,
                }}
              >
                {owned ? description : t('collection.lockedDesc', { count: entry.constellation.starCount })}
              </div>
              <button type="button" className="fcol-cta" onClick={() => setDetail(entry)}>
                {owned ? t('collection.viewOwned') : t('collection.viewLocked')}
                <ChevronRight size={12} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )

  const body = (
    <>
      {head}
      {rows}
      {detail && <ConstellationDetailDialog entry={detail} onClose={() => setDetail(null)} mobile={mobile} />}
    </>
  )
  // 모바일 카드 다이어트 — 카드 벗김(.m-subpage 플랫). 데스크톱은 Card(padding 0) 리스트형.
  if (mobile) return <section>{body}</section>
  return <Card style={{ padding: 0, overflow: 'hidden' }}>{body}</Card>
}
