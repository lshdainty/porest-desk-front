const MonthSkeleton = () => {
  return (
    <div className="rounded-lg border p-4">
      <div className="h-5 w-20 mb-3 bg-muted animate-pulse rounded" />

      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-muted animate-pulse rounded" />
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

const CalendarYearViewSkeleton = () => {
  return (
    <div className="w-full h-full overflow-hidden p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MonthSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export { CalendarYearViewSkeleton }
