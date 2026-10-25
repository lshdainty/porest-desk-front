import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBackClose } from "@/shared/lib/groo/use-back-close";
import { DayEventsDialog } from "@/widgets/calendar/ui/DayEventsDialog";
import { EventDetailPopover } from "@/widgets/calendar/ui/EventDetailPopover";
import { CalendarHeaderMobile } from "@/widgets/calendar/ui/header/calendar-header-mobile";
import { CalendarMonthViewMobile } from "@/widgets/calendar/ui/month-view/calendar-month-view-mobile";
import { CalendarMonthViewMobileSkeleton } from "@/widgets/calendar/ui/month-view/calendar-month-view-mobile-skeleton";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";

import type { CalendarScreen } from "@/widgets/calendar/model/use-calendar-screen";

interface IProps {
  screen: CalendarScreen;
  isLoading: boolean;
}

/** 폰(768 미만) 캘린더 — 달 줄 + 월 격자만. 날을 누르면 일별 시트, 일정을 누르면 상세 Drawer. */
const CalendarMobile = ({ screen, isLoading }: IProps) => {
  const { t } = useTranslation("calendar");
  const {
    selectedEvent,
    handleClosePopover,
    handleEditEvent,
    handleDeleteEvent,
    singleDayEvents,
    multiDayEvents,
    dayDate,
    setDayDate,
    dayEvents,
    setCreatingDate,
    setSelectedEvent,
  } = screen;
  // 일정 상세는 모바일에서만 drawer 다(데스크톱은 Popover) — 그때만 뒤로가기로 닫는다(QA #129).
  useBackClose(handleClosePopover, !!selectedEvent);

  return (
    <>
      <CalendarHeaderMobile />

      {isLoading ? (
        <CalendarMonthViewMobileSkeleton />
      ) : (
        <CalendarMonthViewMobile
          singleDayEvents={singleDayEvents}
          multiDayEvents={multiDayEvents}
          onDayClick={setDayDate}
        />
      )}

      {/* Event Detail — 모바일은 표준 모바일 drawer 패턴(DrawerHeader+제목+X), 데스크톱·태블릿은 Popover */}
      <Drawer
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) handleClosePopover();
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex-1">{t("eventDetail")}</DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label={t("close")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <DrawerBody className="pb-5">
            {selectedEvent && (
              <EventDetailPopover
                event={selectedEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* 모바일 월간뷰 일별 이벤트 시트 — 앱 _DayEventsSheetBody 정합 */}
      {dayDate && (
        <DayEventsDialog
          date={dayDate}
          events={dayEvents}
          mobile
          onClose={() => setDayDate(null)}
          onAdd={() => {
            setCreatingDate(dayDate);
            setDayDate(null);
          }}
          onTapEvent={(e) => {
            setDayDate(null);
            setSelectedEvent(e);
          }}
        />
      )}
    </>
  );
};

export { CalendarMobile };
