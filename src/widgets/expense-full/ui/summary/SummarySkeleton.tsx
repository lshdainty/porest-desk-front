import { Skeleton } from '@/shared/ui/skeleton'

export const OverviewSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border p-4">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
    <div className="rounded-xl border p-5">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="h-48 w-full" />
    </div>
  </div>
)

export const CategorySkeleton = () => (
  <div className="rounded-xl border p-5">
    <Skeleton className="mb-4 h-4 w-28" />
    <div className="flex gap-4">
      <Skeleton className="h-40 w-40 rounded-full" />
      <div className="flex-1 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const TrendSkeleton = () => (
  <div className="space-y-4">
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-7 w-16 rounded-md" />
      ))}
    </div>
    <div className="rounded-xl border p-5">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-48 w-full" />
    </div>
  </div>
)

export const BudgetSkeleton = () => (
  <div className="rounded-xl border p-5">
    <Skeleton className="mb-4 h-4 w-28" />
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  </div>
)

export const DetailedSkeleton = () => (
  <div className="rounded-xl border p-5">
    <Skeleton className="mb-4 h-4 w-20" />
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
)
