import { useCallback, useState } from "react";
import { isBefore, startOfDay, isAfter, isSameDay } from "date-fns";

import { useCreateEvent } from "@/widgets/calendar/model/useCalendarEvents";
import { useEventLabels } from "@/features/event-label";
import { EventForm } from "../ui/EventForm";
import type { CalendarEventFormValues } from "@/entities/calendar";
import { DragSelectContext } from "./drag-select-context";

export const DragSelectProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);

  // 값이 있으면 일정 추가 폼이 열려 있다는 뜻이다.
  const [dialogDateRange, setDialogDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // Event (schedule) dependencies
  const createEvent = useCreateEvent();
  const { data: labels = [] } = useEventLabels();

  const startSelection = useCallback((date: Date) => {
    setIsDragSelecting(true);
    setSelectionStart(date);
    setSelectionEnd(date);
  }, []);

  const updateSelection = useCallback(
    (date: Date) => {
      if (isDragSelecting) {
        setSelectionEnd(date);
      }
    },
    [isDragSelecting],
  );

  const endSelection = useCallback(() => {
    if (isDragSelecting && selectionStart && selectionEnd) {
      setIsDragSelecting(false);

      // Calculate actual start and end (handle reverse drag)
      const start =
        isBefore(selectionStart, selectionEnd) ||
        isSameDay(selectionStart, selectionEnd)
          ? selectionStart
          : selectionEnd;
      const end =
        isBefore(selectionStart, selectionEnd) ||
        isSameDay(selectionStart, selectionEnd)
          ? selectionEnd
          : selectionStart;

      // 빈 날짜를 고르면 곧바로 일정 추가로 간다.
      //
      // 예전엔 여기서 "일정 / 거래" 를 고르는 팝업을 한 번 더 띄웠다. 가계부가 자체
      // 캘린더를 갖기 전에는 거래도 여기서 넣어야 했기 때문이다. 이제 거래는 가계부
      // 캘린더에서 넣으므로, 이 화면은 캘린더 본연의 일만 한다 — 고르는 단계가 사라져
      // 클릭 한 번이 줄었다.
      setDialogDateRange({ start, end });

      // Reset selection visual state
      setSelectionStart(null);
      setSelectionEnd(null);
    } else {
      setIsDragSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isDragSelecting, selectionStart, selectionEnd]);

  const isDateInSelection = useCallback(
    (date: Date) => {
      if (!selectionStart || !selectionEnd) return false;

      const cellDate = startOfDay(date);
      const start =
        isBefore(selectionStart, selectionEnd) ||
        isSameDay(selectionStart, selectionEnd)
          ? startOfDay(selectionStart)
          : startOfDay(selectionEnd);
      const end =
        isBefore(selectionStart, selectionEnd) ||
        isSameDay(selectionStart, selectionEnd)
          ? startOfDay(selectionEnd)
          : startOfDay(selectionStart);

      return (
        (isSameDay(cellDate, start) || isAfter(cellDate, start)) &&
        (isSameDay(cellDate, end) || isBefore(cellDate, end))
      );
    },
    [selectionStart, selectionEnd],
  );

  const handleCreateEvent = useCallback(
    (data: CalendarEventFormValues) => {
      createEvent.mutate(data, {
        onSuccess: () => setDialogDateRange(null),
      });
    },
    [createEvent],
  );

  const handleClose = useCallback(() => setDialogDateRange(null), []);

  return (
    <DragSelectContext.Provider
      value={{
        isDragSelecting,
        selectionStart,
        selectionEnd,
        startSelection,
        updateSelection,
        endSelection,
        isDateInSelection,
      }}
    >
      {children}

      {dialogDateRange && (
        <EventForm
          selectedDate={dialogDateRange.start}
          selectedEndDate={dialogDateRange.end}
          labels={labels}
          onSubmit={handleCreateEvent}
          onClose={handleClose}
          isLoading={createEvent.isPending}
        />
      )}
    </DragSelectContext.Provider>
  );
};
