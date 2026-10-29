import { CalendarContent } from "@/widgets/calendar/ui/CalendarContent";
import { CalendarProvider } from "@/widgets/calendar/model/calendar-provider";

/**
 * 캘린더 화면 — 화면 틀(폰: 달 줄 + 월 격자, 데스크톱 · 태블릿: 제목 줄 · 도구 줄 · 카드)은 항상 실제로 그린다.
 * 틀은 selectedDate/view 로컬 상태로 동기 렌더되므로 스켈레톤화 대상이 아니다(틀 보존 규칙).
 * 서버 쿼리 로딩(events/holiday)은 CalendarContent → CalendarContainer 가 isLoading 으로
 * 받아 데이터 영역(월/주/일/연/agenda 뷰)만 해당 view 의 *ViewSkeleton 으로 교체한다.
 * 폰 · 데스크톱 화면 틀은 widgets/calendar 의 CalendarMobile · CalendarDesktop 이 맡는다.
 */
export const CalendarPage = () => (
  <CalendarProvider events={[]} initialView="month">
    <CalendarContent />
  </CalendarProvider>
);
