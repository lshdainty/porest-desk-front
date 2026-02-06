import { useTranslation } from 'react-i18next'
import { Timer, Clock, Hourglass } from 'lucide-react'
import { cn } from '@/shared/lib'
import type { TimerType } from '@/entities/timer'

interface TimerModeSelectorProps {
  mode: TimerType
  onModeChange: (mode: TimerType) => void
  disabled?: boolean
}

const modes: { type: TimerType; icon: typeof Timer; labelKey: string }[] = [
  { type: 'POMODORO', icon: Timer, labelKey: 'pomodoro' },
  { type: 'STOPWATCH', icon: Clock, labelKey: 'stopwatch' },
  { type: 'COUNTDOWN', icon: Hourglass, labelKey: 'countdown' },
]

export const TimerModeSelector = ({ mode, onModeChange, disabled }: TimerModeSelectorProps) => {
  const { t } = useTranslation('timer')

  return (
    <div className="flex rounded-lg border bg-muted/30 p-1">
      {modes.map(({ type, icon: Icon, labelKey }) => (
        <button
          key={type}
          onClick={() => onModeChange(type)}
          disabled={disabled}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === type
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Icon size={14} />
          <span className="hidden sm:inline">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  )
}
