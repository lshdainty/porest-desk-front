import { useTranslation } from 'react-i18next'
import { Play, Pause, Square, RotateCcw, Flag } from 'lucide-react'
import { cn } from '@/shared/lib'
import type { TimerStatus } from '@/features/timer'

interface TimerControlsProps {
  status: TimerStatus
  showLap?: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onLap?: () => void
}

export const TimerControls = ({
  status,
  showLap,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onLap,
}: TimerControlsProps) => {
  const { t } = useTranslation('timer')

  return (
    <div className="flex items-center justify-center gap-3">
      {status === 'idle' && (
        <button
          onClick={onStart}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            'bg-primary text-primary-foreground shadow-lg',
            'hover:bg-primary/90 active:scale-95 transition-all'
          )}
        >
          <Play size={24} />
        </button>
      )}

      {status === 'running' && (
        <>
          {showLap && onLap && (
            <button
              onClick={onLap}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                'border-2 border-muted-foreground/30 text-muted-foreground',
                'hover:border-foreground hover:text-foreground active:scale-95 transition-all'
              )}
              title={t('lap')}
            >
              <Flag size={18} />
            </button>
          )}
          <button
            onClick={onPause}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              'bg-amber-500 text-white shadow-lg',
              'hover:bg-amber-500/90 active:scale-95 transition-all'
            )}
          >
            <Pause size={24} />
          </button>
          <button
            onClick={onStop}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              'border-2 border-destructive/30 text-destructive',
              'hover:border-destructive hover:bg-destructive/10 active:scale-95 transition-all'
            )}
            title={t('stop')}
          >
            <Square size={18} />
          </button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button
            onClick={onReset}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              'border-2 border-muted-foreground/30 text-muted-foreground',
              'hover:border-foreground hover:text-foreground active:scale-95 transition-all'
            )}
            title={t('reset')}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onResume}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              'bg-primary text-primary-foreground shadow-lg',
              'hover:bg-primary/90 active:scale-95 transition-all'
            )}
          >
            <Play size={24} />
          </button>
          <button
            onClick={onStop}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              'border-2 border-destructive/30 text-destructive',
              'hover:border-destructive hover:bg-destructive/10 active:scale-95 transition-all'
            )}
            title={t('stop')}
          >
            <Square size={18} />
          </button>
        </>
      )}

      {status === 'completed' && (
        <button
          onClick={onReset}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            'bg-primary text-primary-foreground shadow-lg',
            'hover:bg-primary/90 active:scale-95 transition-all'
          )}
          title={t('reset')}
        >
          <RotateCcw size={24} />
        </button>
      )}
    </div>
  )
}
