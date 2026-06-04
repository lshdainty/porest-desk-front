import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { PorestSidebar } from './PorestSidebar'
import { PorestTopBar } from './PorestTopBar'
import { MobileHeader } from './MobileHeader'
import { MobileTabBar } from './MobileTabBar'
import { MoneyTabBar } from './MoneyTabBar'
import { useDeviceSize } from '@/shared/lib/porest/responsive'
import { AddTxSheet } from '@/features/porest/add-tx/AddTxSheet'
import { EventForm } from '@/widgets/calendar-view/ui/EventForm'
import { useCreateEvent } from '@/features/calendar/model/useCalendarEvents'
import { useEventLabels } from '@/features/event-label'

// money group 4 페이지 — 진입 시 MoneyTabBar 표시 (← / 가계부 / 자산 / 통계 / 예산).
const MONEY_PATHS = ['/desk/expense', '/desk/asset', '/desk/stats', '/desk/budget']
const CALENDAR_PATH = '/desk/calendar'
// 모바일 풀스크린 페이지 — 전역 헤더/탭바 없이 페이지 자체 ← 헤더로 렌더 (앱 push 화면 미러).
const FULLSCREEN_PATHS = ['/desk/memo']

/** 캘린더 일정 생성 폼 — AppLayout에서 + 버튼 클릭 시 마운트. */
const CalendarEventAddForm = ({ onClose }: { onClose: () => void }) => {
  const { data: labels = [] } = useEventLabels()
  const createEvent = useCreateEvent()
  return (
    <EventForm
      labels={labels}
      onSubmit={(data) => createEvent.mutate(data, { onSuccess: onClose })}
      onClose={onClose}
      isLoading={createEvent.isPending}
    />
  )
}

export const AppLayout = () => {
  const size = useDeviceSize()
  const [addOpen, setAddOpen] = useState(false)
  const [calendarAddOpen, setCalendarAddOpen] = useState(false)
  const location = useLocation()

  if (size === 'mobile') {
    const isMoney = MONEY_PATHS.some(p => location.pathname.startsWith(p))
    const isCalendar = location.pathname.startsWith(CALENDAR_PATH)
    const isFullscreen = FULLSCREEN_PATHS.some(p => location.pathname.startsWith(p))
    const handleAdd = isCalendar ? () => setCalendarAddOpen(true) : () => setAddOpen(true)

    // 풀스크린 페이지 — 페이지가 자체 헤더(← 뒤로 + 타이틀)를 렌더 (앱과 동일).
    if (isFullscreen) {
      return (
        <div className="m-app" data-screen-label="Mobile">
          <div className="m-scroll flex flex-col">
            <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: true }} />
          </div>
          {addOpen && <AddTxSheet mobile onClose={() => setAddOpen(false)} />}
        </div>
      )
    }

    return (
      <div className="m-app" data-screen-label="Mobile">
        <MobileHeader />
        {/* flex flex-col — 페이지가 flex-1 로 m-scroll 전체 height 를 차지하도록 (viewport
            fit 패턴 지원). 자식 페이지가 자연 height 면 동일 동작 (변경 없음). */}
        <div className="m-scroll flex flex-col">
          <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: true }} />
        </div>
        {isMoney ? <MoneyTabBar /> : <MobileTabBar onAdd={handleAdd} />}
        {addOpen && <AddTxSheet mobile onClose={() => setAddOpen(false)} />}
        {calendarAddOpen && <CalendarEventAddForm onClose={() => setCalendarAddOpen(false)} />}
      </div>
    )
  }

  return (
    <SidebarProvider className="h-svh">
      <PorestSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <PorestTopBar onOpenAdd={() => setAddOpen(true)} />
        {/* flex flex-col — 페이지가 flex-1 로 scroll wrapper 전체 height 를 차지하도록
            (viewport fit 패턴 지원). 자식 페이지가 자연 height 면 동일 동작. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
          <Outlet context={{ onAddTx: () => setAddOpen(true), mobile: false }} />
        </div>
      </SidebarInset>
      {addOpen && <AddTxSheet mobile={false} onClose={() => setAddOpen(false)} />}
    </SidebarProvider>
  )
}
