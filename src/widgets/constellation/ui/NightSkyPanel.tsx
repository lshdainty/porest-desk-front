import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import {
  useConstellationCollection,
  useConstellationSky,
  useConstellationToday,
} from '@/features/constellation'
import { NightSkyHero } from './NightSkyHero'
import { ForestWeekEntry } from './ForestWeekEntry'
import { MySkyCard } from './MySkyCard'
import { CollectionCard } from './CollectionCard'

/**
 * 밤하늘 화면 — 성장·수집 전용 공간. 히어로 + 관측 리포트 진입 + 나의 밤하늘 + 도감 v2.
 * mobile: 풀스크린 서브페이지(.m-subpage 플랫) / desktop: 와이드 모달.
 * 디자인 SoT: forest-report.jsx NightSkyPage.
 */
export function NightSkyPanel({
  mobile,
  doneToday,
  onClose,
  onOpenReport,
}: {
  mobile: boolean
  doneToday: number
  onClose: () => void
  onOpenReport: () => void
}) {
  const { t } = useTranslation('constellation')
  const todayQ = useConstellationToday()
  const skyQ = useConstellationSky(14)
  const collectionQ = useConstellationCollection()

  const body =
    todayQ.data && skyQ.data && collectionQ.data ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <NightSkyHero today={todayQ.data} doneToday={doneToday} mobile={mobile} />
        <ForestWeekEntry
          today={todayQ.data}
          sky={skyQ.data}
          entries={collectionQ.data.entries}
          mobile={mobile}
          onOpen={onOpenReport}
        />
        <MySkyCard
          sky={skyQ.data}
          today={todayQ.data}
          entries={collectionQ.data.entries}
          mobile={mobile}
        />
        <CollectionCard
          collection={collectionQ.data}
          todayKey={todayQ.data.constellation.constellationKey}
          mobile={mobile}
        />
      </div>
    ) : null

  if (mobile) {
    // 풀스크린 서브페이지 — 앱 push 화면 미러(surface 배경 + 스티키 백 헤더).
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'var(--bg-surface)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '12px 8px',
            background: 'var(--bg-surface)',
          }}
        >
          <Button variant="ghost" size="icon" aria-label={t('nightSky.back')} onClick={onClose}>
            <ChevronLeft size={22} />
          </Button>
          <h1
            style={{
              flex: 1,
              fontSize: 'var(--text-title-md)',
              fontWeight: 600,
              letterSpacing: '-0.012em',
              color: 'var(--fg-primary)',
              margin: 0,
            }}
          >
            {t('nightSky.title')}
          </h1>
        </div>
        <div style={{ padding: '4px 16px 36px' }}>{body}</div>
      </div>
    )
  }

  return (
    <ModalShell title={t('nightSky.title')} onClose={onClose} size="lg" mobile={false}>
      {body}
    </ModalShell>
  )
}
