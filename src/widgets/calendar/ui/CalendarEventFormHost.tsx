import { useEventLabels } from "@/features/event-label";
import { withOpenedOccurrence } from "@/widgets/calendar/lib/helpers";
import {
  useCreateEvent,
  useUpdateEvent,
} from "@/widgets/calendar/model/useCalendarEvents";
import { EventForm } from "@/widgets/calendar/ui/EventForm";

import type { CalendarEvent } from "@/entities/calendar";

/**
 * 일정 폼을 여는 자리 하나 (I-09 36) — 일정 추가(셸 + · 그날 시트/패널/제목 줄 · 끌어 고른 기간)와 수정이
 * 모두 이것을 마운트한다. 표면(1280 미만 시트 · 이상 "자세히" 대화상자)은 `EventForm` 이 고르고,
 * 라벨 · 저장(만들기 · 수정 + 반복 회차 알림) · 닫기만 여기서 이어 준다.
 *
 * `event` 가 있으면 수정, 없으면 `selectedDate` ~ `selectedEndDate` 로 새 일정.
 */
export function CalendarEventFormHost({
  event,
  selectedDate,
  selectedEndDate,
  onClose,
  onDelete,
}: {
  event?: CalendarEvent | null;
  selectedDate?: Date;
  selectedEndDate?: Date;
  onClose: () => void;
  /** 수정 폼 바닥 [삭제] — 확인창은 부르는 쪽이 연다 */
  onDelete?: () => void;
}) {
  const { data: labels = [] } = useEventLabels();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  return (
    <EventForm
      event={event}
      selectedDate={selectedDate}
      selectedEndDate={selectedEndDate}
      labels={labels}
      isLoading={event ? updateEvent.isPending : createEvent.isPending}
      onClose={onClose}
      onDelete={onDelete}
      onSubmit={(data) => {
        if (event) {
          // 반복 일정은 연 회차를 함께 알린다 — 안 알리면 서버가 그 회차 날짜를 반복의
          // 새 시작으로 써서 앞 회차들이 사라졌다(QA 30 2).
          updateEvent.mutate(
            { id: event.rowId, data: withOpenedOccurrence(data, event) },
            { onSuccess: onClose },
          );
        } else {
          createEvent.mutate(data, { onSuccess: onClose });
        }
      }}
    />
  );
}
