import { useTranslation } from 'react-i18next'
import { formatTime } from '@/features/timer'
import type { Lap } from '@/entities/timer'

interface LapListProps {
  laps: Lap[]
}

export const LapList = ({ laps }: LapListProps) => {
  const { t } = useTranslation('timer')

  if (laps.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        {t('noLaps')}
      </div>
    )
  }

  const reversedLaps = [...laps].reverse()

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground">{t('laps')}</h3>
      <div className="max-h-48 overflow-y-auto rounded-lg border">
        {reversedLaps.map((lap, idx) => {
          const prevLapTime = idx < reversedLaps.length - 1 ? reversedLaps[idx + 1].time : 0
          const lapDuration = lap.time - prevLapTime

          return (
            <div
              key={lap.index}
              className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0"
            >
              <span className="text-muted-foreground">
                {t('lap')} {lap.index}
              </span>
              <div className="flex gap-4">
                <span className="font-mono text-muted-foreground">
                  +{formatTime(lapDuration)}
                </span>
                <span className="font-mono font-medium">{formatTime(lap.time)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
