export type TimerType = 'POMODORO' | 'STOPWATCH' | 'COUNTDOWN'

export interface TimerSession {
  rowId: number
  timerType: TimerType
  label: string | null
  startTime: string
  endTime: string | null
  durationSeconds: number
  targetSeconds: number | null
  isCompleted: boolean
  laps: string | null
  createAt: string
}

export interface TimerSessionFormValues {
  timerType: TimerType
  label?: string
  startTime: string
  endTime?: string
  durationSeconds: number
  targetSeconds?: number
  isCompleted: boolean
  laps?: string
}

export interface Lap {
  index: number
  time: number
}
