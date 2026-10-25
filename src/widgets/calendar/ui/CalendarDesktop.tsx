import { DndProviderWrapper } from "@/widgets/calendar/ui/dnd/dnd-provider";
import { EventDetailPopover } from "@/widgets/calendar/ui/EventDetailPopover";
import { CalendarAgendaView } from "@/widgets/calendar/ui/agenda-view/calendar-agenda-view";
import { CalendarAgendaViewSkeleton } from "@/widgets/calendar/ui/agenda-view/calendar-agenda-view-skeleton";
import { CalendarHeaderDesktop } from "@/widgets/calendar/ui/header/calendar-header-desktop";
import { CalendarMonthView } from "@/widgets/calendar/ui/month-view/calendar-month-view";
import { CalendarMonthViewSkeleton } from "@/widgets/calendar/ui/month-view/calendar-month-view-skeleton";
import { CalendarDayView } from "@/widgets/calendar/ui/week-and-day-view/calendar-day-view";
import { CalendarDayViewSkeleton } from "@/widgets/calendar/ui/week-and-day-view/calendar-day-view-skeleton";
import { CalendarWeekView } from "@/widgets/calendar/ui/week-and-day-view/calendar-week-view";
import { CalendarWeekViewSkeleton } from "@/widgets/calendar/ui/week-and-day-view/calendar-week-view-skeleton";
import { CalendarYearView } from "@/widgets/calendar/ui/year-view/calendar-year-view";
import { CalendarYearViewSkeleton } from "@/widgets/calendar/ui/year-view/calendar-year-view-skeleton";
import { useCalendar } from "@/widgets/calendar/model/calendar-context";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/ui/popover";

import type { CalendarScreen } from "@/widgets/calendar/model/use-calendar-screen";

interface IProps {
  screen: CalendarScreen;
  isLoading: boolean;
}

/** 데스크톱 · 태블릿(768 이상) 캘린더 — 머리(달 이동 · 보기 · 캘린더 고르기) + 다섯 보기. 일정을 누르면 상세 Popover. */
const CalendarDesktop = ({ screen, isLoading }: IProps) => {
  const { view } = useCalendar();
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
  } = screen;

  return (
    <>
      <CalendarHeaderDesktop events={filteredEvents} />

      <div className="flex-1 overflow-hidden">
        <DndProviderWrapper>
          {view === "day" &&
            (isLoading ? (
              <CalendarDayViewSkeleton />
            ) : (
              <CalendarDayView
                singleDayEvents={singleDayEvents}
                multiDayEvents={multiDayEvents}
                onEventClick={handleEventClick}
              />
            ))}
          {view === "month" &&
            (isLoading ? (
              <CalendarMonthViewSkeleton />
            ) : (
              <CalendarMonthView
                singleDayEvents={singleDayEvents}
                multiDayEvents={multiDayEvents}
                onEventClick={handleEventClick}
                mobileHeaderBorder={false}
              />
            ))}
          {view === "week" &&
            (isLoading ? (
              <CalendarWeekViewSkeleton />
            ) : (
              <CalendarWeekView
                singleDayEvents={singleDayEvents}
                multiDayEvents={multiDayEvents}
                onEventClick={handleEventClick}
              />
            ))}
          {view === "year" &&
            (isLoading ? (
              <CalendarYearViewSkeleton />
            ) : (
              <CalendarYearView allEvents={eventStartDates} />
            ))}
          {view === "agenda" &&
            (isLoading ? (
              <CalendarAgendaViewSkeleton />
            ) : (
              <CalendarAgendaView
                singleDayEvents={singleDayEvents}
                multiDayEvents={multiDayEvents}
                onEventClick={handleEventClick}
              />
            ))}
        </DndProviderWrapper>
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
    </>
  );
};

export { CalendarDesktop };
