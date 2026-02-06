import type { TimerType, Lap } from '@/entities/timer'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface TimerState {
  timerType: TimerType
  status: TimerStatus
  elapsedMs: number
  targetMs: number
  laps: Lap[]
  startTimestamp: number | null
  pauseTimestamp: number | null
}

export const createTimer = (type: TimerType, targetSeconds?: number): TimerState => {
  let targetMs = 0
  if (type === 'POMODORO') {
    targetMs = 25 * 60 * 1000
  } else if (type === 'COUNTDOWN' && targetSeconds) {
    targetMs = targetSeconds * 1000
  }

  return {
    timerType: type,
    status: 'idle',
    elapsedMs: 0,
    targetMs,
    laps: [],
    startTimestamp: null,
    pauseTimestamp: null,
  }
}

export const tick = (state: TimerState, now: number): TimerState => {
  if (state.status !== 'running' || state.startTimestamp === null) {
    return state
  }

  const elapsed = now - state.startTimestamp
  const newElapsed = state.elapsedMs + (elapsed - (state.pauseTimestamp ? state.pauseTimestamp - state.startTimestamp : 0))

  // For countdown and pomodoro, check completion
  if (
    (state.timerType === 'COUNTDOWN' || state.timerType === 'POMODORO') &&
    newElapsed >= state.targetMs
  ) {
    return {
      ...state,
      elapsedMs: state.targetMs,
      status: 'completed',
    }
  }

  return state
}

export const start = (state: TimerState, now: number): TimerState => {
  if (state.status !== 'idle') return state
  return {
    ...state,
    status: 'running',
    startTimestamp: now,
    pauseTimestamp: null,
  }
}

export const pause = (state: TimerState, now: number): TimerState => {
  if (state.status !== 'running' || state.startTimestamp === null) return state
  const additionalMs = now - state.startTimestamp
  return {
    ...state,
    status: 'paused',
    elapsedMs: state.elapsedMs + additionalMs,
    startTimestamp: null,
    pauseTimestamp: null,
  }
}

export const resume = (state: TimerState, now: number): TimerState => {
  if (state.status !== 'paused') return state
  return {
    ...state,
    status: 'running',
    startTimestamp: now,
    pauseTimestamp: null,
  }
}

export const stop = (state: TimerState, now: number): TimerState => {
  if (state.status === 'idle') return state
  let finalElapsed = state.elapsedMs
  if (state.status === 'running' && state.startTimestamp !== null) {
    finalElapsed += now - state.startTimestamp
  }
  return {
    ...state,
    status: 'idle',
    elapsedMs: finalElapsed,
    startTimestamp: null,
    pauseTimestamp: null,
  }
}

export const reset = (state: TimerState): TimerState => {
  return createTimer(state.timerType, state.targetMs / 1000)
}

export const addLap = (state: TimerState, now: number): TimerState => {
  if (state.status !== 'running' || state.startTimestamp === null) return state
  const currentElapsed = state.elapsedMs + (now - state.startTimestamp)
  const lap: Lap = {
    index: state.laps.length + 1,
    time: currentElapsed,
  }
  return {
    ...state,
    laps: [...state.laps, lap],
  }
}

export const getCurrentElapsed = (state: TimerState, now: number): number => {
  if (state.status === 'running' && state.startTimestamp !== null) {
    return state.elapsedMs + (now - state.startTimestamp)
  }
  return state.elapsedMs
}

export const getRemainingMs = (state: TimerState, now: number): number => {
  if (state.timerType === 'STOPWATCH') return 0
  const elapsed = getCurrentElapsed(state, now)
  return Math.max(0, state.targetMs - elapsed)
}

export const getProgress = (state: TimerState, now: number): number => {
  if (state.targetMs === 0) return 0
  const elapsed = getCurrentElapsed(state, now)
  return Math.min(1, elapsed / state.targetMs)
}

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
