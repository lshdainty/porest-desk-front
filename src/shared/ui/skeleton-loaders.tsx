import { cn } from '@/shared/lib/index'
import { Skeleton } from '@/shared/ui/skeleton'

interface CardSkeletonProps {
  className?: string
  lines?: number
}

export const CardSkeleton = ({ className, lines = 3 }: CardSkeletonProps) => {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-1/2' : 'w-full')}
        />
      ))}
    </div>
  )
}

interface ListSkeletonProps {
  className?: string
  rows?: number
  showAvatar?: boolean
}

export const ListSkeleton = ({ className, rows = 5, showAvatar = false }: ListSkeletonProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton className="h-9 w-9 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface ChartSkeletonProps {
  className?: string
  bars?: number
}

export const ChartSkeleton = ({ className, bars = 7 }: ChartSkeletonProps) => {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: bars }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  className?: string
  rows?: number
  columns?: number
}

export const TableSkeleton = ({ className, rows = 5, columns = 4 }: TableSkeletonProps) => {
  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn('flex gap-4 px-4 py-3', rowIdx < rows - 1 && 'border-b')}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn('h-4 flex-1', colIdx === 0 && 'w-1/3')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
