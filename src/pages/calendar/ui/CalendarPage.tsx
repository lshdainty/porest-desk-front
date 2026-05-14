import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import { useCalendarEvents } from '@/features/calendar/model/useCalendarEvents'
import { useCalendarHolidays } from '@/features/calendar/model/useCalendarHolidays'
import { useUserCalendars } from '@/features/user-calendar'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

/**
 * CalendarPage 진입 시 사용하는 모든 useQuery 의 isLoading 을 한곳에서 집계.
 * 자식 CalendarContent 가 동일 쿼리를 호출해도 TanStack Query 캐시 히트라 추가 fetch 없음.
 * 기본 enabled 인 holiday + events + userCalendars 만 게이트에 포함 — expense/todo source 는
 * 토글 후 enable 되므로 초기 게이트 대상 아님.
 *
 * 모바일은 initialView=agenda, 데스크는 initialView=month 이며 둘 다 month range 쿼리 사용.
 */
function useCalendarPageData() {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  const startDateTime = format(start, "yyyy-MM-dd'T'HH:mm:ss")
  const endDateTime = format(end, "yyyy-MM-dd'T'HH:mm:ss")
  const startDate = format(start, 'yyyy-MM-dd')
  const endDate = format(end, 'yyyy-MM-dd')

  const eventsQ = useCalendarEvents(startDateTime, endDateTime)
  const holidaysQ = useCalendarHolidays(startDate, endDate, true)
  const userCalendarsQ = useUserCalendars()

  return {
    isLoading: eventsQ.isLoading || holidaysQ.isLoading || userCalendarsQ.isLoading,
  }
}

/** 캘린더 헤더 skeleton — 좌측 오늘 버튼 + 월 이름 + 화살표 / 우측 view 토글. */
function CalendarHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-14 w-14 rounded-lg shrink-0" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonBase className="h-6 w-32" />
            <SkeletonBase className="h-5 w-12 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBase className="h-6 w-6 rounded-md" />
            <SkeletonBase className="h-4 w-32" />
            <SkeletonBase className="h-6 w-6 rounded-md" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBase className="h-9 w-9 rounded-md" />
        <SkeletonBase className="h-9 w-9 rounded-md" />
        <SkeletonBase className="h-9 w-9 rounded-md" />
        <SkeletonBase className="h-9 w-9 rounded-md" />
        <SkeletonBase className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}

/** Month grid skeleton — 7×6 셀(요일 row + 6 weeks). */
function CalendarMonthGridSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="p-2 border-r last:border-r-0">
            <SkeletonBase className="h-4 w-8" />
          </div>
        ))}
      </div>
      {/* 6 weeks */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="border-r border-b last:border-r-0 p-1.5 flex flex-col gap-1"
            style={{ minHeight: 100 }}
          >
            <SkeletonBase className="h-4 w-5" />
            {/* 0~2 mock event lines per cell — 시각적 다양성을 위해 일부 셀에만 추가 */}
            {i % 5 === 0 && <SkeletonBase className="h-3 w-full" />}
            {i % 7 === 0 && <SkeletonBase className="h-3 w-3/4" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Agenda(mobile) skeleton — 날짜 그룹별 이벤트 rows. */
function CalendarAgendaSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {[0, 1, 2].map(g => (
        <div key={g} className="flex flex-col gap-2">
          <SkeletonBase className="h-4 w-24 mb-1" />
          <Card>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <SkeletonBase className="h-3 w-3 rounded-full shrink-0" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <SkeletonBase className="h-4 w-2/3 mb-1.5" />
                    <SkeletonBase className="h-3 w-1/3" />
                  </div>
                  <SkeletonBase className="h-4 w-14 shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

/** Calendar 페이지 구조 일치 skeleton — header + month-grid(desktop) 혹은 agenda(mobile). */
function CalendarPageSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <CalendarHeaderSkeleton />
      <div className="flex-1 overflow-hidden">
        {mobile ? <CalendarAgendaSkeleton /> : <CalendarMonthGridSkeleton />}
      </div>
    </div>
  )
}

export const CalendarPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useCalendarPageData()
  const [hasEverLoaded, setHasEverLoaded] = useState(false)
  // 데이터가 모두 도착하면 hasEverLoaded 를 true 로 — render 중 동기 set(React 권장).
  // 이후 사용자가 view/date 를 바꿔 다른 query key 로 fetch 할 때는 view-level skeleton 에 위임.
  if (!isLoading && !hasEverLoaded) setHasEverLoaded(true)

  return (
    <div
      style={{
        height: mobile ? 'calc(100dvh - 132px)' : 'calc(100dvh - 56px)',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {!hasEverLoaded ? (
        <CalendarPageSkeleton mobile={mobile} />
      ) : (
        <CalendarProvider events={[]} initialView={mobile ? 'agenda' : 'month'}>
          <CalendarContent />
        </CalendarProvider>
      )}
    </div>
  )
}
