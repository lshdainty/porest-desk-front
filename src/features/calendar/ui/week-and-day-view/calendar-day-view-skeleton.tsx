const CalendarDayViewSkeleton = () => {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)

  return (
    <div className="w-full h-full flex">
      <div className="flex flex-1 flex-col h-full">
        {/* Multi-day events row skeleton */}
        <div className="border-b">
          <div className="flex">
            <div className="w-18" />
            <div className="flex-1 border-l p-2">
              <div className="h-6 w-full rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>

        {/* Day header skeleton */}
        <div className="relative z-20 flex border-b">
          <div className="w-18" />
          <div className="flex-1 border-l py-2 flex flex-col items-center gap-1">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-3 w-12 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Time grid skeleton */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: '96px' }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && <div className="h-3 w-10 bg-muted animate-pulse rounded" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative flex-1 border-l">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: '96px' }}>
                  {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b" />}
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                </div>
              ))}

              <div className="absolute top-[96px] left-1 right-1 h-[144px] p-1">
                <div className="h-full w-full rounded bg-muted animate-pulse" />
              </div>
              <div className="absolute top-[384px] left-1 right-1 h-[96px] p-1">
                <div className="h-full w-3/4 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side panel skeleton */}
      <div className="hidden w-64 divide-y border-l md:block">
        <div className="p-4">
          <div className="h-[280px] w-full rounded bg-muted animate-pulse" />
        </div>

        <div className="p-4 space-y-4">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            <div className="h-16 w-full rounded bg-muted animate-pulse" />
            <div className="h-16 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { CalendarDayViewSkeleton }
