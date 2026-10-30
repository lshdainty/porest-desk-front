import { useCallback, useState } from "react";
import { isBefore, startOfDay, isAfter, isSameDay } from "date-fns";

import { CalendarEventFormHost } from "../ui/CalendarEventFormHost";
import { DragSelectContext } from "./drag-select-context";

export const DragSelectProvider = ({
  children,
  onSelectDay,
}: {
  children: React.ReactNode;
  /** 한 날을 눌렀다 뗐을 때 — 그 날을 고른다(폼은 열지 않는다). 두 날 이상 끌어 놓으면 그 기간으로 일정 폼이 뜬다(I-09 18) */
  onSelectDay?: (date: Date) => void;
}) => {
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);

  // 값이 있으면 일정 추가 폼이 열려 있다는 뜻이다.
  const [dialogDateRange, setDialogDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

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

      // 한 날 누름 = 그 날 고르기(폼 없음). 두 날 이상을 끌어 놓으면 그 기간으로 일정 추가 폼이 곧바로 뜬다.
      //
      // 예전엔 여기서 "일정 / 거래" 를 고르는 팝업을 한 번 더 띄웠다(거래도 여기서 넣던 때). 이제 거래는 가계부에서
      // 넣으므로 고르는 단계는 없다 — 그리고 한 날 누름은 폼이 아니라 날 고르기다(I-09 18, 사용자 결정 Q2-A).
      if (isSameDay(start, end)) {
        onSelectDay?.(start);
      } else {
        setDialogDateRange({ start, end });
      }

      // Reset selection visual state
      setSelectionStart(null);
      setSelectionEnd(null);
    } else {
      setIsDragSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isDragSelecting, selectionStart, selectionEnd, onSelectDay]);

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
        <CalendarEventFormHost
          selectedDate={dialogDateRange.start}
          selectedEndDate={dialogDateRange.end}
          onClose={handleClose}
        />
      )}
    </DragSelectContext.Provider>
  );
};
