import { useTranslation } from "react-i18next";

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import { formatMonthDayDow } from "@/shared/lib/date";
import { DayEventList } from "@/widgets/calendar/ui/day-event-list";
import type { IEvent } from "@/widgets/calendar/model/interfaces";

/**
 * 그날 시트 (I-09 11) — 폰 월 격자에서 칸을 누르면 뜨는 ds Bottom Sheet 조회(바깥 · 끌기로 닫힌다).
 * 제목 "10월 22일 (목)" · 본문은 일정 줄 목록(공휴일 먼저, 그다음 시작 시각 차례 — 위에서 정렬해 넘긴다) · 바닥 "일정 추가".
 * 줄 사이 선 · 꺾쇠가 없다. 공휴일 줄은 보기만 하고 일정 줄은 누르면 상세(지금 길 — 시트를 닫고 상세).
 * 높이는 내용만큼 · 90% 상한 · 끝 흐림.
 */
export function DayEventsDialog({
  date,
  events,
  onClose,
  onAdd,
  onTapEvent,
}: {
  date: Date;
  events: IEvent[];
  onClose: () => void;
  onAdd: () => void;
  onTapEvent: (event: IEvent) => void;
}) {
  const { t } = useTranslation("calendar");

  return (
    <BottomSheet open onOpenChange={(open) => !open && onClose()}>
      <BottomSheetContent
        title={formatMonthDayDow(date)}
        aria-describedby={undefined}
      >
        <BottomSheetBody scrollFog>
          {events.length === 0 ? (
            <p
              data-slot="day-sheet-empty"
              className="m-0 py-x8 text-center text-t4 text-fg-neutral-subtle"
            >
              {t("noEvents")}
            </p>
          ) : (
            <div data-slot="day-sheet-list" className="-mx-x6">
              <DayEventList
                events={events}
                label={formatMonthDayDow(date)}
                onTapEvent={(e) => onTapEvent(e)}
              />
            </div>
          )}
        </BottomSheetBody>
        <BottomSheetFooter>
          <Button onClick={onAdd}>{t("addEvent")}</Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
