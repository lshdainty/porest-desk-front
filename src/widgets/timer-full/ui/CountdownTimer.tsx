import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createTimer,
  start,
  pause,
  resume,
  getCurrentElapsed,
} from '@/features/timer'
import { useSaveTimerSession } from '@/features/timer'
import type { TimerState } from '@/features/timer'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'

export const CountdownTimer = () => {
  const { t } = useTranslation('timer')
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(5)
  const [seconds, setSeconds] = useState(0)
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const rafRef = useRef<number>(0)
  const [displayMs, setDisplayMs] = useState(0)
  const saveSession = useSaveTimerSession()
  const startTimeRef = useRef<string>('')

  const totalTargetSeconds = hours * 3600 + minutes * 60 + seconds

  // RAF loop
  useEffect(() => {
    const update = () => {
      setTimerState((prev) => {
        if (!prev || prev.status !== 'running' || prev.startTimestamp === null) return prev
        const elapsed = getCurrentElapsed(prev, Date.now())
        setDisplayMs(elapsed)
        if (elapsed >= prev.targetMs) {
          return { ...prev, elapsedMs: prev.targetMs, status: 'completed', startTimestamp: null }
        }
        return prev
      })
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Handle completion
  useEffect(() => {
    if (timerState?.status === 'completed') {
      const durationSeconds = Math.floor(timerState.targetMs / 1000)
      saveSession.mutate({
        timerType: 'COUNTDOWN',
        label: t('countdown'),
        startTime: startTimeRef.current,
        endTime: new Date().toISOString(),
        durationSeconds,
        targetSeconds: durationSeconds,
        isCompleted: true,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState?.status])

  const handleStart = useCallback(() => {
    if (totalTargetSeconds <= 0) return
    const now = Date.now()
    startTimeRef.current = new Date(now).toISOString()
    const timer = createTimer('COUNTDOWN', totalTargetSeconds)
    setTimerState(start(timer, now))
    setDisplayMs(0)
  }, [totalTargetSeconds])

  const handlePause = useCallback(() => {
    setTimerState((prev) => prev ? pause(prev, Date.now()) : prev)
  }, [])

  const handleResume = useCallback(() => {
    setTimerState((prev) => prev ? resume(prev, Date.now()) : prev)
  }, [])

  const handleStop = useCallback(() => {
    if (!timerState) return
    const now = Date.now()
    const elapsed = getCurrentElapsed(timerState, now)
    if (elapsed > 0) {
      saveSession.mutate({
        timerType: 'COUNTDOWN',
        label: t('countdown'),
        startTime: startTimeRef.current,
        endTime: new Date(now).toISOString(),
        durationSeconds: Math.floor(elapsed / 1000),
        targetSeconds: totalTargetSeconds,
        isCompleted: false,
      })
    }
    setTimerState(null)
    setDisplayMs(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState, totalTargetSeconds])

  const handleReset = useCallback(() => {
    setTimerState(null)
    setDisplayMs(0)
  }, [])

  // Time setter UI (shown when timer is not active)
  if (!timerState) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <p className="text-sm font-medium text-muted-foreground">{t('setTime')}</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <label className="mb-1 text-xs text-muted-foreground">{t('hours')}</label>
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
              className="h-16 w-20 rounded-lg border bg-background text-center font-mono text-2xl font-bold outline-none focus:border-primary"
            />
          </div>
          <span className="mt-4 text-2xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <label className="mb-1 text-xs text-muted-foreground">{t('minutes')}</label>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="h-16 w-20 rounded-lg border bg-background text-center font-mono text-2xl font-bold outline-none focus:border-primary"
            />
          </div>
          <span className="mt-4 text-2xl font-bold">:</span>
          <div className="flex flex-col items-center">
            <label className="mb-1 text-xs text-muted-foreground">{t('seconds')}</label>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="h-16 w-20 rounded-lg border bg-background text-center font-mono text-2xl font-bold outline-none focus:border-primary"
            />
          </div>
        </div>

        <TimerControls
          status="idle"
          onStart={handleStart}
          onPause={() => {}}
          onResume={() => {}}
          onStop={() => {}}
          onReset={() => {}}
        />
      </div>
    )
  }

  const remaining = timerState.targetMs - displayMs
  const progress = timerState.targetMs > 0 ? displayMs / timerState.targetMs : 0

  return (
    <div className="flex flex-col items-center space-y-6">
      <TimerDisplay
        timeMs={Math.max(0, remaining)}
        progress={progress}
        isCountdown
      />

      {timerState.status === 'completed' ? (
        <div className="space-y-4 text-center">
          <p className="text-lg font-bold text-primary">{t('completed')}</p>
          <TimerControls
            status="completed"
            onStart={() => {}}
            onPause={() => {}}
            onResume={() => {}}
            onStop={() => {}}
            onReset={handleReset}
          />
        </div>
      ) : (
        <TimerControls
          status={timerState.status}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
