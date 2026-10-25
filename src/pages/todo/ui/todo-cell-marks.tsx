import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Cloudy, Star } from "lucide-react";
import { constellationColorVar, type SkyDay } from "@/features/constellation";
import type { Todo } from "@/entities/todo";
import { cellMarkOf } from "@/pages/todo/model/todo-ledger";

/**
 * 달력 칸 아래 표시(I-10 9 · 27 · 28) — 폰 주 달력 · 태블릿 주 달력 · 1280 작은 달력이 같은 판정 · 같은 이름을 쓴다.
 * 판정은 모델(`cellMarkOf`)이 하고 여기서는 그리는 것(★ · 구름 · ✓ · 남은 수 글)과 칸 이름만 정한다.
 * 표시는 장식(`aria-hidden`)이다 — 뜻은 칸 이름이 읽는다: "10월 22일, 남은 할 일 3개".
 * `compact` — 남은 수를 숫자만("3") 낸다(작은 달력 칸 41 에 "3건" 이 넘친다). 폰은 "3건".
 */
export function useTodoCellMarks({
  today,
  byDay,
  skyByDate,
  skyDone,
  todayColor,
  compact = false,
}: {
  today: string;
  byDay: ReadonlyMap<string, Todo[]>;
  skyByDate: ReadonlyMap<string, SkyDay>;
  skyDone: boolean;
  /** 오늘 수집한 별자리 색 */
  todayColor: string;
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation("todo");
  const en = !i18n.language.startsWith("ko");
  const markOf = (ds: string) =>
    cellMarkOf(ds, today, byDay, skyByDate, skyDone);

  const dateName = (ds: string) =>
    new Intl.DateTimeFormat(en ? "en-US" : "ko-KR", {
      month: "long",
      day: "numeric",
    }).format(new Date(`${ds}T00:00:00`));

  /** 칸 아래 표시 — 없으면 null */
  const glyph = (ds: string): ReactNode => {
    const mark = markOf(ds);
    if (!mark) return null;
    switch (mark.kind) {
      case "collected":
        return (
          <Star
            size={10}
            strokeWidth={0}
            fill="currentColor"
            style={{ color: todayColor }}
          />
        );
      case "grown":
        return (
          <Star
            size={10}
            strokeWidth={0}
            fill="currentColor"
            style={{ color: constellationColorVar(mark.colorKey) }}
          />
        );
      case "missed":
        return <Cloudy size={10} strokeWidth={2} />;
      case "left":
        return compact
          ? String(mark.count)
          : t("tdm.countN", { count: mark.count });
      case "done":
        return <Check size={10} strokeWidth={3} className="text-fg-positive" />;
    }
  };

  /** 칸 이름 — 표시가 없는 날은 날짜만 */
  const name = (ds: string): string => {
    const mark = markOf(ds);
    const date = dateName(ds);
    if (!mark) return date;
    switch (mark.kind) {
      case "collected":
      case "grown":
        return t("tdm.cellCollected", { date });
      case "missed":
        return t("tdm.cellMissed", { date });
      case "left":
        return t("tdm.cellLeft", { date, count: mark.count });
      case "done":
        return t("tdm.cellDone", { date });
    }
  };

  /** 오늘의 남은 수 — 이것만 fg-brand · 700 */
  const isTodayLeft = (ds: string): boolean => {
    const mark = markOf(ds);
    return mark?.kind === "left" && mark.today;
  };

  return { glyph, name, isTodayLeft };
}
