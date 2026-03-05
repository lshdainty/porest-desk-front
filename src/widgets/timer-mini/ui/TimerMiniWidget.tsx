import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Timer, Clock, Hourglass, Play, Pause, Square, RotateCcw } from 'lucide-react'
import { cn } from '@/shared/lib'
import {
  createTimer,
  start,
  pause,
  resume,
  getCurrentElapsed,
  formatTime,
} from '@/features/timer'
import { useSaveTimerSession } from '@/features/timer'
import type { TimerState } from '@/features/timer'

type WidgetMode = 'STOPWATCH' | 'COUNTDOWN'

export const TimerMiniWidget = () => {
  const { t } = useTranslation('timer')
  const [mode, setMode] = useState<WidgetMode>('STOPWATCH')

  // Stopwatch state
  const [swState, setSwState] = useState<TimerState>(() => createTimer('STOPWATCH'))
  const [swDisplayMs, setSwDisplayMs] = useState(0)
  const swStartTimeRef = useRef<string>('')

  // Countdown state
  const [cdMinutes, setCdMinutes] = useState(5)
  const [cdState, setCdState] = useState<TimerState | null>(null)
  const [cdDisplayMs, setCdDisplayMs] = useState(0)
  const cdStartTimeRef = useRef<string>('')

  const saveSession = useSaveTimerSession()
  const rafRef = useRef<number>(0)

  // RAF loop for both timers
  useEffect(() => {
    const update = () => {
      const now = Date.now()

      // Update stopwatch
      setSwState((prev) => {
        if (prev.status === 'running' && prev.startTimestamp !== null) {
          const elapsed = getCurrentElapsed(prev, now)
          setSwDisplayMs(elapsed)
        }
        return prev
      })

      // Update countdown
      setCdState((prev) => {
        if (!prev || prev.status !== 'running' || prev.startTimestamp === null) return prev
        const elapsed = getCurrentElapsed(prev, now)
        setCdDisplayMs(elapsed)
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

  // Handle countdown completion
  useEffect(() => {
    if (cdState?.status === 'completed') {
      const durationSeconds = Math.floor(cdState.targetMs / 1000)
      saveSession.mutate({
        timerType: 'COUNTDOWN',
        label: t('countdown'),
        startTime: cdStartTimeRef.current,
        endTime: new Date().toISOString(),
        durationSeconds,
        targetSeconds: durationSeconds,
        isCompleted: true,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdState?.status])

  // --- Stopwatch handlers ---
  const swStart = useCallback(() => {
    const now = Date.now()
    swStartTimeRef.current = new Date(now).toISOString()
    setSwState((prev) => start(prev, now))
  }, [])

  const swPause = useCallback(() => {
    setSwState((prev) => pause(prev, Date.now()))
  }, [])

  const swResume = useCallback(() => {
    setSwState((prev) => resume(prev, Date.now()))
  }, [])

  const swStop = useCallback(() => {
    const now = Date.now()
    const elapsed = getCurrentElapsed(swState, now)
    if (elapsed > 0) {
      saveSession.mutate({
        timerType: 'STOPWATCH',
        label: t('stopwatch'),
        startTime: swStartTimeRef.current,
        endTime: new Date(now).toISOString(),
        durationSeconds: Math.floor(elapsed / 1000),
        isCompleted: true,
      })
    }
    setSwState(createTimer('STOPWATCH'))
    setSwDisplayMs(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swState])

  const swReset = useCallback(() => {
    setSwState(createTimer('STOPWATCH'))
    setSwDisplayMs(0)
  }, [])

  // --- Countdown handlers ---
  const cdStart = useCallback(() => {
    if (cdMinutes <= 0) return
    const now = Date.now()
    cdStartTimeRef.current = new Date(now).toISOString()
    const timer = createTimer('COUNTDOWN', cdMinutes * 60)
    setCdState(start(timer, now))
    setCdDisplayMs(0)
  }, [cdMinutes])

  const cdPause = useCallback(() => {
    setCdState((prev) => prev ? pause(prev, Date.now()) : prev)
  }, [])

  const cdResume = useCallback(() => {
    setCdState((prev) => prev ? resume(prev, Date.now()) : prev)
  }, [])

  const cdStop = useCallback(() => {
    if (!cdState) return
    const now = Date.now()
    const elapsed = getCurrentElapsed(cdState, now)
    if (elapsed > 0) {
      saveSession.mutate({
        timerType: 'COUNTDOWN',
        label: t('countdown'),
        startTime: cdStartTimeRef.current,
        endTime: new Date(now).toISOString(),
        durationSeconds: Math.floor(elapsed / 1000),
        targetSeconds: cdMinutes * 60,
        isCompleted: false,
      })
    }
    setCdState(null)
    setCdDisplayMs(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdState, cdMinutes])

  const cdReset = useCallback(() => {
    setCdState(null)
    setCdDisplayMs(0)
  }, [])

  const isSwActive = swState.status !== 'idle'
  const isCdActive = cdState !== null

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-3">
        <Timer size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{t('title')}</h3>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setMode('STOPWATCH')}
          disabled={isCdActive}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
            mode === 'STOPWATCH'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
            isCdActive && mode !== 'STOPWATCH' && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Clock size={12} />
          {t('stopwatch')}
        </button>
        <button
          onClick={() => setMode('COUNTDOWN')}
          disabled={isSwActive}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
            mode === 'COUNTDOWN'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
            isSwActive && mode !== 'COUNTDOWN' && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Hourglass size={12} />
          {t('countdown')}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-3">
        {mode === 'STOPWATCH' ? (
          <StopwatchContent
            displayMs={swDisplayMs}
            status={swState.status}
            onStart={swStart}
            onPause={swPause}
            onResume={swResume}
            onStop={swStop}
            onReset={swReset}
          />
        ) : (
          <CountdownContent
            displayMs={cdDisplayMs}
            state={cdState}
            minutes={cdMinutes}
            onMinutesChange={setCdMinutes}
            onStart={cdStart}
            onPause={cdPause}
            onResume={cdResume}
            onStop={cdStop}
            onReset={cdReset}
          />
        )}
      </div>
    </div>
  )
}

// --- Stopwatch sub-component ---
interface StopwatchContentProps {
  displayMs: number
  status: 'idle' | 'running' | 'paused' | 'completed'
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

const StopwatchContent = ({
  displayMs, status, onStart, onPause, onResume, onStop, onReset,
}: StopwatchContentProps) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-3xl font-bold font-mono tracking-tight">
        {formatTime(displayMs)}
      </p>
      <CompactControls
        status={status}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        onReset={onReset}
      />
    </div>
  )
}

// --- Countdown sub-component ---
interface CountdownContentProps {
  displayMs: number
  state: TimerState | null
  minutes: number
  onMinutesChange: (m: number) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

const presetMinutes = [1, 3, 5, 10, 15, 25]

const CountdownContent = ({
  displayMs, state, minutes, onMinutesChange,
  onStart, onPause, onResume, onStop, onReset,
}: CountdownContentProps) => {
  const { t } = useTranslation('timer')

  // Setter view
  if (!state) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex flex-wrap justify-center gap-1.5">
          {presetMinutes.map((m) => (
            <button
              key={m}
              onClick={() => onMinutesChange(m)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                minutes === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {m}{t('minutes').charAt(0)}
            </button>
          ))}
        </div>
        <p className="text-3xl font-bold font-mono tracking-tight">
          {formatTime(minutes * 60 * 1000)}
        </p>
        <CompactControls
          status="idle"
          onStart={onStart}
          onPause={() => {}}
          onResume={() => {}}
          onStop={() => {}}
          onReset={() => {}}
        />
      </div>
    )
  }

  const remaining = state.targetMs - displayMs

  if (state.status === 'completed') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <p className="text-sm font-bold text-primary">{t('completed')}</p>
        <p className="text-3xl font-bold font-mono tracking-tight">00:00</p>
        <button
          onClick={onReset}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-3xl font-bold font-mono tracking-tight">
        {formatTime(Math.max(0, remaining))}
      </p>
      <CompactControls
        status={state.status}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        onReset={onReset}
      />
    </div>
  )
}

// --- Compact controls ---
interface CompactControlsProps {
  status: 'idle' | 'running' | 'paused' | 'completed'
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

const CompactControls = ({ status, onStart, onPause, onResume, onStop, onReset }: CompactControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {status === 'idle' && (
        <button
          onClick={onStart}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Play size={16} />
        </button>
      )}

      {status === 'running' && (
        <>
          <button
            onClick={onPause}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow hover:bg-amber-500/90 active:scale-95 transition-all"
          >
            <Pause size={16} />
          </button>
          <button
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 active:scale-95 transition-all"
          >
            <Square size={12} />
          </button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button
            onClick={onReset}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={onResume}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Play size={16} />
          </button>
          <button
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 active:scale-95 transition-all"
          >
            <Square size={12} />
          </button>
        </>
      )}
    </div>
  )
}
