import { CalendarHeaderMobile } from "@/widgets/calendar/ui/header/calendar-header-mobile";
import { CalendarLoadFailed } from "@/widgets/calendar/ui/calendar-load-failed";
import {
  CalendarMonthViewMobile,
  WeekdayRow,
} from "@/widgets/calendar/ui/month-view/calendar-month-view-mobile";
import { CalendarMonthViewMobileSkeleton } from "@/widgets/calendar/ui/month-view/calendar-month-view-mobile-skeleton";

import type { CalendarScreen } from "@/widgets/calendar/model/use-calendar-screen";

interface IProps {
  screen: CalendarScreen;
  isLoading: boolean;
  isFailed: boolean;
  onRetry: () => void;
}

/**
 * 폰(768 미만) 캘린더 — 달 줄 + 월 격자만. 날을 누르면 그날 시트가 뜬다(`dayDate`). 시트(`EventDetailSurface` — 목록 → 상세 → 수정 폼,
 * I-09b 5 · 9)는 `CalendarContainer` 가 그린다 — 폰을 가로로 돌려 768 이상이 되어 이 화면이 사라져도 시트와 쓰던 값이 남게(I-09 31).
 */
const CalendarMobile = ({ screen, isLoading, isFailed, onRetry }: IProps) => {
  const { singleDayEvents, multiDayEvents, setDayDate } = screen;

  return (
    <>
      {/* 달 줄 · 요일 줄은 고정 — 격자만 스크롤한다(처음부터 그린다, 불러오는 중에도) */}
      <div
        data-slot="calendar-month-head"
        className="sticky top-0 z-30 bg-bg-layer-default"
      >
        <CalendarHeaderMobile />
        <WeekdayRow />
      </div>

      {isLoading ? (
        <CalendarMonthViewMobileSkeleton />
      ) : isFailed ? (
        <CalendarLoadFailed onRetry={onRetry} />
      ) : (
        <CalendarMonthViewMobile
          singleDayEvents={singleDayEvents}
          multiDayEvents={multiDayEvents}
          onDayClick={setDayDate}
        />
      )}
    </>
  );
};

export { CalendarMobile };
