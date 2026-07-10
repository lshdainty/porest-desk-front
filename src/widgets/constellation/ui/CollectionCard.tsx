import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import {
  constellationColorVar,
  constellationName,
  type CollectionEntry,
  type ConstellationCollection,
} from '@/features/constellation'
import { ConstellationSVG } from './ConstellationSVG'
import { ConstellationDetailDialog } from './ConstellationDetailDialog'

/**
 * 별자리 도감 — 전체 별자리 목록(수집 횟수/미수집), 클릭 시 상세 감상.
 * 디자인 SoT: forest.jsx ForestCollection.
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

  return (
    <Card style={{ padding: mobile ? 18 : 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
          {t('collection.title')}
        </h2>
        <span className="num" style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginLeft: 'auto' }}>
          {t('collection.progress', { collected: collection.collectedKinds, total: collection.entries.length })}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginBottom: 12 }}>
        {t('collection.subtitle')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {collection.entries.map(entry => {
          const key = entry.constellation.constellationKey
          const collected = entry.collectCount > 0
          const isToday = key === todayKey
          const color = constellationColorVar(entry.constellation.colorKey)
          const name = constellationName(entry.constellation, i18n.language)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDetail(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '8px 6px',
                border: 0,
                background: 'transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: collected
                    ? `color-mix(in oklab, ${color} 14%, var(--bg-surface))`
                    : 'var(--bg-sunken)',
                  color: collected ? color : 'var(--fg-tertiary)',
                }}
              >
                <ConstellationSVG
                  starMap={entry.constellation.starMap}
                  size={24}
                  dim={!collected}
                  linesOnly
                />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: collected ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                    }}
                  >
                    {name}
                  </span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--fg-brand)',
                        background: 'color-mix(in oklab, var(--color-primary) 10%, var(--bg-surface))',
                        padding: '1px 6px',
                        borderRadius: 999,
                      }}
                    >
                      {t('collection.todayBadge')}
                    </span>
                  )}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  {t('collection.starCount', { count: entry.constellation.starCount })}
                </span>
              </span>
              <span
                className="num"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: collected ? 'var(--fg-secondary)' : 'var(--fg-tertiary)',
                  flexShrink: 0,
                }}
              >
                {collected ? t('collection.timesCollected', { count: entry.collectCount }) : t('collection.notCollected')}
              </span>
              <ChevronRight size={14} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
            </button>
          )
        })}
      </div>
      {detail && <ConstellationDetailDialog entry={detail} onClose={() => setDetail(null)} mobile={mobile} />}
    </Card>
  )
}
