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
}

/**
 * 캘린더 화면의 뼈대 — 상태(`useCalendarScreen`)를 들고 폰 · 데스크톱/태블릿 표면을 고르며,
 * 둘이 함께 쓰는 일정 폼(그날 추가 · 수정)과 삭제 확인을 그린다.
 */
const CalendarContainer = ({ events, isLoading = false }: IProps) => {
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
    <div
      className={
        // 폰은 격자가 화면보다 길면 화면(셸 본문)이 스크롤한다 — 높이를 가두지 않는다
        isMobile
          ? "flex w-full flex-col"
          : "w-full h-full flex flex-col overflow-hidden"
      }
    >
      {isMobile ? (
        <CalendarMobile screen={screen} isLoading={isLoading} />
      ) : (
        <CalendarDesktop screen={screen} isLoading={isLoading} />
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
