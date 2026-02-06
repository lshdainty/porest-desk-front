import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import type { TimerType } from '@/entities/timer'
import { TimerModeSelector } from './TimerModeSelector'
import { PomodoroTimer } from './PomodoroTimer'
import { StopwatchTimer } from './StopwatchTimer'
import { CountdownTimer } from './CountdownTimer'
import { DailyFocusStats } from './DailyFocusStats'

export const TimerFullWidget = () => {
  const { t } = useTranslation('timer')
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<TimerType>('POMODORO')

  return (
    <div className={cn('space-y-6', isMobile ? 'px-0' : 'mx-auto max-w-lg')}>
      <TimerModeSelector mode={mode} onModeChange={setMode} />

      <div className="rounded-lg border bg-background p-4 md:p-6">
        {mode === 'POMODORO' && <PomodoroTimer />}
        {mode === 'STOPWATCH' && <StopwatchTimer />}
        {mode === 'COUNTDOWN' && <CountdownTimer />}
      </div>

      <DailyFocusStats />
    </div>
  )
}
