const AgendaDayGroupSkeleton = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="ml-[52px] space-y-2">
        <div className="rounded-lg border p-3 space-y-2">
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

const CalendarAgendaViewSkeleton = () => {
  return (
    <div className="w-full h-full overflow-hidden">
      <div className="space-y-6 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <AgendaDayGroupSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export { CalendarAgendaViewSkeleton }
