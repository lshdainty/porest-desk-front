import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'
import { useCalendarEvents } from '@/features/calendar/model/useCalendarEvents'
import { useCalendarHolidays } from '@/features/calendar/model/useCalendarHolidays'
import { useUserCalendars } from '@/features/user-calendar'
import { CalendarMonthViewSkeleton } from '@/features/calendar/ui/month-view/calendar-month-view-skeleton'
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

/** 모바일 헤더 skeleton — `<` 2026년 N월 `>` 네비 + 우측 소스 토글 칩 (calendar-header 모바일 분기 미러). */
function CalendarMobileHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-1">
        <SkeletonBase className="h-8 w-8 rounded-md" />
        <SkeletonBase className="h-5 w-24" />
        <SkeletonBase className="h-8 w-8 rounded-md" />
      </div>
      <SkeletonBase className="h-7 w-16 rounded-full" />
    </div>
  )
}

/** Calendar 페이지 구조 일치 skeleton — 헤더(모바일/데스크톱 분기) + 실제 월뷰 skeleton 재사용. */
function CalendarPageSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {mobile ? <CalendarMobileHeaderSkeleton /> : <CalendarHeaderSkeleton />}
      <div className="flex-1 overflow-hidden">
        <CalendarMonthViewSkeleton />
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
        <CalendarProvider events={[]} initialView="month">
          <CalendarContent />
        </CalendarProvider>
      )}
    </div>
  )
}
