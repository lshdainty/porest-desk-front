import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createTimer,
  start,
  pause,
  resume,
  reset,
  getCurrentElapsed,
  getRemainingMs,
  getProgress,
  formatTime,
} from '@/features/timer'
import { useSaveTimerSession } from '@/features/timer'
import type { TimerState } from '@/features/timer'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export const PomodoroTimer = () => {
  const { t } = useTranslation('timer')
  const [timerState, setTimerState] = useState<TimerState>(() => createTimer('POMODORO', WORK_SECONDS))
  const [isBreak, setIsBreak] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const rafRef = useRef<number>(0)
  const [displayMs, setDisplayMs] = useState(0)
  const saveSession = useSaveTimerSession()
  const startTimeRef = useRef<string>('')

  // RAF loop
  useEffect(() => {
    const update = () => {
      const now = Date.now()
      setTimerState((prev) => {
        if (prev.status !== 'running' || prev.startTimestamp === null) return prev
        const elapsed = getCurrentElapsed(prev, now)
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
    if (timerState.status === 'completed') {
      const durationSeconds = Math.floor(timerState.targetMs / 1000)
      saveSession.mutate({
        timerType: 'POMODORO',
        label: isBreak ? t('break') : t('work'),
        startTime: startTimeRef.current,
        endTime: new Date().toISOString(),
        durationSeconds,
        targetSeconds: durationSeconds,
        isCompleted: true,
      })

      if (!isBreak) {
        setSessionCount((prev) => prev + 1)
        setIsBreak(true)
        setTimerState(createTimer('POMODORO', BREAK_SECONDS))
      } else {
        setIsBreak(false)
        setTimerState(createTimer('POMODORO', WORK_SECONDS))
      }
      setDisplayMs(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState.status])

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
      saveSession.mutate({
        timerType: 'POMODORO',
        label: isBreak ? t('break') : t('work'),
        startTime: startTimeRef.current,
        endTime: new Date(now).toISOString(),
        durationSeconds: Math.floor(elapsed / 1000),
        targetSeconds: Math.floor(timerState.targetMs / 1000),
        isCompleted: false,
      })
    }
    setTimerState(createTimer('POMODORO', isBreak ? BREAK_SECONDS : WORK_SECONDS))
    setDisplayMs(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState, isBreak])

  const handleReset = useCallback(() => {
    setIsBreak(false)
    setTimerState(createTimer('POMODORO', WORK_SECONDS))
    setDisplayMs(0)
  }, [])

  const remaining = timerState.targetMs - displayMs
  const progress = timerState.targetMs > 0 ? displayMs / timerState.targetMs : 0

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${isBreak ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {isBreak ? t('break') : t('work')} - {t('session')} {sessionCount + 1}
        </span>
      </div>

      <TimerDisplay
        timeMs={Math.max(0, remaining)}
        progress={progress}
        label={isBreak ? t('break') : formatTime(timerState.targetMs)}
        isCountdown
      />

      <TimerControls
        status={timerState.status}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onReset={handleReset}
      />
    </div>
  )
}
