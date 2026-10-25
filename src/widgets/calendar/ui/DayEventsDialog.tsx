import { Flag, Clock, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import { List, ListButtonItem, ListItem, ListTile } from "@/shared/ds/list";
import { formatMonthDayDow } from "@/shared/lib/date";
import { eventBadgeTone } from "@/widgets/calendar/lib/helpers";
import { eventLineDetail } from "@/widgets/calendar/lib/event-line";
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
  const { t, i18n } = useTranslation("calendar");
  // 공휴일이 먼저, 그다음 시작 시각(같은 시각이면 들어온 차례)
  const sorted = [...events].sort(
    (a, b) =>
      Number(b.sourceType === "holiday") - Number(a.sourceType === "holiday"),
  );

  return (
    <BottomSheet open onOpenChange={(open) => !open && onClose()}>
      <BottomSheetContent
        title={formatMonthDayDow(date)}
        aria-describedby={undefined}
      >
        <BottomSheetBody scrollFog>
          {sorted.length === 0 ? (
            <p
              data-slot="day-sheet-empty"
              className="m-0 py-x8 text-center text-t4 text-fg-neutral-subtle"
            >
              {t("noEvents")}
            </p>
          ) : (
            <List className="-mx-x6" aria-label={formatMonthDayDow(date)}>
              {sorted.map((e) => {
                const tone = eventBadgeTone(e);
                const holiday = e.sourceType === "holiday";
                const Icon = holiday ? Flag : e.isAllDay ? Sun : Clock;
                const common = {
                  title: e.title,
                  detail: eventLineDetail(e, t, i18n.language),
                  prefix: (
                    <ListTile
                      aria-hidden
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      <Icon className="size-5" />
                    </ListTile>
                  ),
                };
                // 공휴일은 읽기 전용 — 보기만 하는 줄(누를 곳 없음)
                return holiday ? (
                  <ListItem key={`${e.id}-${e.startDate}`} {...common} />
                ) : (
                  <ListButtonItem
                    key={`${e.id}-${e.startDate}`}
                    {...common}
                    onClick={() => onTapEvent(e)}
                  />
                );
              })}
            </List>
          )}
        </BottomSheetBody>
        <BottomSheetFooter>
          <Button onClick={onAdd}>{t("addEvent")}</Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
