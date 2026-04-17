import { cn } from '@/shared/lib'

interface BudgetRingProps {
  /** 0 ~ 100+ (over 100 means over-budget) */
  percentage: number
  label?: string
  /** Formatted total budget string e.g. "₩1,500,000" */
  totalBudget?: string
  /** Formatted spent string */
  spent?: string
  /** Formatted remaining string */
  remaining?: string
  /** Negative remaining → over budget, we highlight it */
  isOverBudget?: boolean
  /** Optional per-day suggestion */
  perDay?: string
  size?: number
  strokeWidth?: number
  className?: string
  onClick?: () => void
}

/** Pick stroke color by threshold — mirrors the gradient logic previously in ExpenseFullWidget. */
function getRingStroke(percentage: number): string {
  if (percentage > 100) return 'stroke-red-500'
  if (percentage > 90) return 'stroke-orange-500'
  if (percentage > 70) return 'stroke-yellow-500'
  return 'stroke-primary'
}

function getTextTone(percentage: number): string {
  if (percentage > 100) return 'text-red-600 dark:text-red-400'
  if (percentage > 90) return 'text-orange-600 dark:text-orange-400'
  if (percentage > 70) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-primary'
}

export const BudgetRing = ({
  percentage,
  label,
  totalBudget,
  spent,
  remaining,
  isOverBudget,
  perDay,
  size = 140,
  strokeWidth = 12,
  className,
  onClick,
}: BudgetRingProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(percentage, 0), 100)
  const dashOffset = circumference - (clamped / 100) * circumference
  const strokeClass = getRingStroke(percentage)
  const textToneClass = getTextTone(percentage)

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors text-left w-full',
        onClick && 'hover:bg-muted/40 active:scale-[0.99]',
        className,
      )}
    >
      {/* Ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn('transition-[stroke-dashoffset] duration-700 ease-out', strokeClass)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', textToneClass)}>
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</span>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 space-y-1">
        {spent && totalBudget && (
          <p className="text-xs sm:text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{spent}</span>
            <span className="mx-1">/</span>
            <span>{totalBudget}</span>
          </p>
        )}
        {remaining && (
          <p
            className={cn(
              'text-xs sm:text-sm tabular-nums',
              isOverBudget
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-muted-foreground',
            )}
          >
            {remaining}
          </p>
        )}
        {perDay && !isOverBudget && (
          <p className="text-[11px] sm:text-xs text-muted-foreground tabular-nums">
            {perDay}
          </p>
        )}
      </div>
    </Wrapper>
  )
}
