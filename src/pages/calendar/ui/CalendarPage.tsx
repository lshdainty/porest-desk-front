import { useOutletContext } from 'react-router-dom'
import { CalendarContent } from '@/features/calendar/ui/CalendarContent'
import { CalendarProvider } from '@/features/calendar/model/calendar-context'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

/**
 * CalendarPage 는 정적 UI 틀(헤더: 오늘 버튼·월 네비·view 토글·소스 토글)을 항상 실제 렌더한다.
 * 헤더는 selectedDate/view 로컬 상태로 동기 렌더되므로 스켈레톤화 대상 아님(틀 보존 규칙).
 * 서버 쿼리 로딩(events/holiday/expense)은 CalendarContent → CalendarContainer 가 isLoading 으로
 * 받아 데이터 영역(월/주/일/연/agenda 뷰)만 해당 view 의 *ViewSkeleton 으로 교체한다.
 */
export const CalendarPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()

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
      <CalendarProvider events={[]} initialView="month">
        <CalendarContent />
      </CalendarProvider>
    </div>
  )
}
