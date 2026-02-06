import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createTimer,
  start,
  pause,
  resume,
  reset,
  addLap,
  getCurrentElapsed,
} from '@/features/timer'
import { useSaveTimerSession } from '@/features/timer'
import type { TimerState } from '@/features/timer'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { LapList } from './LapList'

export const StopwatchTimer = () => {
  const { t } = useTranslation('timer')
  const [timerState, setTimerState] = useState<TimerState>(() => createTimer('STOPWATCH'))
  const rafRef = useRef<number>(0)
  const [displayMs, setDisplayMs] = useState(0)
  const saveSession = useSaveTimerSession()
  const startTimeRef = useRef<string>('')

  // RAF loop
  useEffect(() => {
    const update = () => {
      setTimerState((prev) => {
        if (prev.status === 'running' && prev.startTimestamp !== null) {
          const elapsed = getCurrentElapsed(prev, Date.now())
          setDisplayMs(elapsed)
        }
        return prev
      })
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleStart = useCallback(() => {
    const now = Date.now()
    startTimeRef.current = new Date(now).toISOString()
    setTimerState((prev) => start(prev, now))
  }, [])

  const handlePause = useCallback(() => {
    setTimerState((prev) => pause(prev, Date.now()))
  }, [])

  const handleResume = useCallback(() => {
    setTimerState((prev) => resume(prev, Date.now()))
  }, [])

  const handleStop = useCallback(() => {
    const now = Date.now()
    const elapsed = getCurrentElapsed(timerState, now)
    if (elapsed > 0) {
      const lapsJson = timerState.laps.length > 0
        ? JSON.stringify(timerState.laps)
        : undefined
      saveSession.mutate({
        timerType: 'STOPWATCH',
        label: t('stopwatch'),
        startTime: startTimeRef.current,
        endTime: new Date(now).toISOString(),
        durationSeconds: Math.floor(elapsed / 1000),
        isCompleted: true,
        laps: lapsJson,
      })
    }
    setTimerState(createTimer('STOPWATCH'))
    setDisplayMs(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState])

  const handleReset = useCallback(() => {
    setTimerState(createTimer('STOPWATCH'))
    setDisplayMs(0)
  }, [])

  const handleLap = useCallback(() => {
    setTimerState((prev) => addLap(prev, Date.now()))
  }, [])

  return (
    <div className="flex flex-col items-center space-y-6">
      <TimerDisplay timeMs={displayMs} />

      <TimerControls
        status={timerState.status}
        showLap
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onReset={handleReset}
        onLap={handleLap}
      />

      <div className="w-full max-w-sm">
        <LapList laps={timerState.laps} />
      </div>
    </div>
  )
}
