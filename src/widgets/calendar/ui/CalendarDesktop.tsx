import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ds/button";
import { Card } from "@/shared/ds/card";
import { useWideSurface } from "@/shared/ds/overlay";
import { PageHead } from "@/shared/ui/groo/page-head";
import { eventsOnDay } from "@/widgets/calendar/lib/helpers";
import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { DndProviderWrapper } from "@/widgets/calendar/ui/dnd/dnd-provider";
import { CalendarLoadFailed } from "@/widgets/calendar/ui/calendar-load-failed";
import { DayPanel } from "@/widgets/calendar/ui/day-panel";
import { EventDetailPopover } from "@/widgets/calendar/ui/EventDetailPopover";
import { CalendarAgendaView } from "@/widgets/calendar/ui/agenda-view/calendar-agenda-view";
import { CalendarAgendaViewSkeleton } from "@/widgets/calendar/ui/agenda-view/calendar-agenda-view-skeleton";
import { CalendarHeaderDesktop } from "@/widgets/calendar/ui/header/calendar-header-desktop";
import {
  CalendarMonthViewDesktop,
  WeekdayHead,
} from "@/widgets/calendar/ui/month-view/calendar-month-view-desktop";
import { CalendarMonthViewDesktopSkeleton } from "@/widgets/calendar/ui/month-view/calendar-month-view-desktop-skeleton";
import { CalendarDayView } from "@/widgets/calendar/ui/week-and-day-view/calendar-day-view";
import { CalendarDayViewSkeleton } from "@/widgets/calendar/ui/week-and-day-view/calendar-day-view-skeleton";
import { CalendarWeekView } from "@/widgets/calendar/ui/week-and-day-view/calendar-week-view";
import { CalendarWeekViewSkeleton } from "@/widgets/calendar/ui/week-and-day-view/calendar-week-view-skeleton";
import { CalendarYearView } from "@/widgets/calendar/ui/year-view/calendar-year-view";
import { CalendarYearViewSkeleton } from "@/widgets/calendar/ui/year-view/calendar-year-view-skeleton";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/ui/popover";

import type { CalendarScreen } from "@/widgets/calendar/model/use-calendar-screen";

interface IProps {
  screen: CalendarScreen;
  isLoading: boolean;
  isFailed: boolean;
  onRetry: () => void;
}

/**
 * 데스크톱 · 태블릿(768 이상) 캘린더 (I-09 13 ~ 17) — 화면 틀(제목 줄 h1 "캘린더" + 오른쪽 "일정 추가") 아래
 * 도구 줄(달 이동 · 오늘 · 캘린더 고르기 · 보기) 16, 그 아래 카드.
 * 월 보기: 1280 이상은 격자 카드 + 오른쪽 그날 패널 320(사이 24), 미만은 격자 카드 아래 그날 목록 카드(사이 8).
 * 주 · 일 · 연 · 목록 보기는 카드 하나 폭 전체(안 모양은 그대로). 일정 칩을 누르면 상세 Popover.
 */
const CalendarDesktop = ({ screen, isLoading, isFailed, onRetry }: IProps) => {
  const { t } = useTranslation("calendar");
  const { t: tl } = useTranslation("layout");
  const { view, selectedDate } = useCalendar();
  const wide = useWideSurface();
  const {
    selectedEvent,
    anchorRef,
    handleEventClick,
    handleClosePopover,
    handleEditEvent,
    handleDeleteEvent,
    filteredEvents,
    singleDayEvents,
    multiDayEvents,
    eventStartDates,
    setCreatingDate,
  } = screen;

  const dayEvents = eventsOnDay(filteredEvents, selectedDate);

  const monthBody = (
    <>
      {isLoading ? (
        <CalendarMonthViewDesktopSkeleton />
      ) : isFailed ? (
        <Card data-slot="calendar-month-grid" className="p-0">
          <WeekdayHead />
          <CalendarLoadFailed onRetry={onRetry} />
        </Card>
      ) : (
        <CalendarMonthViewDesktop
          singleDayEvents={singleDayEvents}
          multiDayEvents={multiDayEvents}
          onEventClick={handleEventClick}
        />
      )}
      {/* 실패는 "일정 없음" 이 아니다 — 그날 패널은 불러온 일정이 있을 때만 */}
      {!isFailed && (
        <DayPanel
          date={selectedDate}
          events={dayEvents}
          loading={isLoading}
          onAdd={() => setCreatingDate(selectedDate)}
          onTapEvent={handleEventClick}
        />
      )}
    </>
  );

  // 주 · 일 · 연 · 목록 — 카드 하나(안 모양 그대로). 안쪽 스크롤이 서도록 높이를 준다
  const otherView = (body: React.ReactNode) => (
    <Card
      data-slot="calendar-view-card"
      className="h-[max(560px,calc(100dvh-14rem))] p-0"
    >
      {isFailed && !isLoading ? <CalendarLoadFailed onRetry={onRetry} /> : body}
    </Card>
  );

  return (
    <div
      data-slot="calendar-desktop"
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto w-full max-w-[var(--layout-max-low)] lg:max-w-[var(--layout-max-medium)]">
        <PageHead
          title={tl("calendar")}
          style={{ marginBottom: "var(--spacing-x4)" }}
          actions={
            <Button
              variant="neutralOutline"
              size="small"
              onClick={() => setCreatingDate(new Date())}
            >
              <Plus aria-hidden />
              {t("addEvent")}
            </Button>
          }
        />
        <CalendarHeaderDesktop />

        <div className="mt-x4">
          <DndProviderWrapper>
            {view === "month" &&
              (wide ? (
                <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-x6">
                  {monthBody}
                </div>
              ) : (
                <div className="flex flex-col gap-x2">{monthBody}</div>
              ))}
            {view === "day" &&
              otherView(
                isLoading ? (
                  <CalendarDayViewSkeleton />
                ) : (
                  <CalendarDayView
                    singleDayEvents={singleDayEvents}
                    multiDayEvents={multiDayEvents}
                    onEventClick={handleEventClick}
                  />
                ),
              )}
            {view === "week" &&
              otherView(
                isLoading ? (
                  <CalendarWeekViewSkeleton />
                ) : (
                  <CalendarWeekView
                    singleDayEvents={singleDayEvents}
                    multiDayEvents={multiDayEvents}
                    onEventClick={handleEventClick}
                  />
                ),
              )}
            {view === "year" &&
              otherView(
                isLoading ? (
                  <CalendarYearViewSkeleton />
                ) : (
                  <CalendarYearView allEvents={eventStartDates} />
                ),
              )}
            {view === "agenda" &&
              otherView(
                isLoading ? (
                  <CalendarAgendaViewSkeleton />
                ) : (
                  <CalendarAgendaView
                    singleDayEvents={singleDayEvents}
                    multiDayEvents={multiDayEvents}
                    onEventClick={handleEventClick}
                  />
                ),
              )}
          </DndProviderWrapper>
        </div>
      </div>

      {/* Event Detail — 데스크톱·태블릿은 Popover */}
      <Popover
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) handleClosePopover();
        }}
      >
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className="pointer-events-none"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
            }}
          />
        </PopoverAnchor>
        {/* 새 상세(시간블록·D-day) 레이아웃 폭 확보 — 디자인 dialog(md) 근사 */}
        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] overflow-y-auto"
          sideOffset={8}
          collisionPadding={16}
        >
          {selectedEvent && (
            <EventDetailPopover
              event={selectedEvent}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { CalendarDesktop };
