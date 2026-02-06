import { cn } from '@/shared/lib'
import { formatTime } from '@/features/timer'

interface TimerDisplayProps {
  timeMs: number
  progress?: number
  label?: string
  isCountdown?: boolean
}

export const TimerDisplay = ({ timeMs, progress, label, isCountdown }: TimerDisplayProps) => {
  const displayTime = formatTime(timeMs)

  // SVG circle progress
  const size = 240
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress ?? 0) * circumference

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="absolute"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          {progress !== undefined && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn(
                'transition-all duration-200',
                isCountdown ? 'text-orange-500' : 'text-primary'
              )}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>

        {/* Time display */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-mono text-4xl font-bold tracking-tight md:text-5xl">
            {displayTime}
          </span>
          {label && (
            <span className="mt-1 text-sm text-muted-foreground">{label}</span>
          )}
        </div>
      </div>
    </div>
  )
}
