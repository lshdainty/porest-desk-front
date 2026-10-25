import { useTranslation } from "react-i18next";

import { useIsMobile } from "@/shared/hooks";
import { useCalendarScreen } from "@/widgets/calendar/model/use-calendar-screen";
import { CalendarDesktop } from "@/widgets/calendar/ui/CalendarDesktop";
import { CalendarMobile } from "@/widgets/calendar/ui/CalendarMobile";
import { ConfirmDialog } from "@/shared/ui/groo/dialogs";

import { EventForm } from "./EventForm";

import type { IEvent } from "@/widgets/calendar/model/interfaces";

interface IProps {
  events: IEvent[];
  isLoading?: boolean;
  /** 일정 질의가 내용 없이 실패했다 */
  isFailed?: boolean;
  /** 일정 질의만 다시 받는다 */
  onRetry?: () => void;
}

/**
 * 캘린더 화면의 뼈대 — 상태(`useCalendarScreen`)를 들고 폰 · 데스크톱/태블릿 표면을 고르며,
 * 둘이 함께 쓰는 일정 폼(그날 추가 · 수정)과 삭제 확인을 그린다.
 */
const CalendarContainer = ({
  events,
  isLoading = false,
  isFailed = false,
  onRetry = () => {},
}: IProps) => {
  const { t } = useTranslation("calendar");
  const isMobile = useIsMobile();
  const screen = useCalendarScreen(events);
  const {
    labels,
    editingEvent,
    setEditingEvent,
    deletingEventId,
    setDeletingEventId,
    creatingDate,
    setCreatingDate,
    createEvent,
    updateEvent,
    deleteEvent,
    handleSubmitEdit,
    handleConfirmDelete,
    handleSubmitCreate,
  } = screen;

  return (
    <div className="flex w-full flex-col">
      {isMobile ? (
        <CalendarMobile
          screen={screen}
          isLoading={isLoading}
          isFailed={isFailed}
          onRetry={onRetry}
        />
      ) : (
        <CalendarDesktop
          screen={screen}
          isLoading={isLoading}
          isFailed={isFailed}
          onRetry={onRetry}
        />
      )}

      {/* 일별 시트 [+] → 해당 날짜 기본값 이벤트 생성 폼 */}
      {creatingDate && (
        <EventForm
          selectedDate={creatingDate}
          labels={labels}
          onSubmit={handleSubmitCreate}
          onClose={() => setCreatingDate(null)}
          isLoading={createEvent.isPending}
        />
      )}

      {/* Edit Event Form */}
      {editingEvent && (
        <EventForm
          event={editingEvent}
          labels={labels}
          onSubmit={handleSubmitEdit}
          onClose={() => setEditingEvent(null)}
          isLoading={updateEvent.isPending}
          onDelete={() => {
            setDeletingEventId(editingEvent.rowId);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Delete Confirmation — 삭제 확인은 전부 ConfirmDialog 한 모양이다(spec alert-dialog.md) */}
      {deletingEventId !== null && (
        <ConfirmDialog
          title={t("deleteConfirm.title")}
          message={t("deleteConfirm.message", {
            name: events.find((e) => e.id === deletingEventId)?.title ?? "",
          })}
          confirmLabel={t("deleteConfirm.confirm")}
          cancelLabel={t("deleteConfirm.cancel")}
          danger
          loading={deleteEvent.isPending}
          onCancel={() => setDeletingEventId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export { CalendarContainer };
