import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MonthPicker } from "@/shared/ds/month-picker";
import { cn } from "@/shared/lib/cn";
import { formatYearMonth } from "@/shared/lib/date";

/**
 * 달 글 — "2026년 10월 ▾" 하나. 누르면 연 | 월 휠(I-27)이 열린다. 달 줄에 ‹ › 는 두지 않는다 —
 * 연 · 월은 휠로만 옮긴다(사용자 10-29). 글 크기는 부르는 쪽이 className 으로 준다(예산 t5 · 가계부 · 할 일 t6 · 홈 t4 …).
 * 누르는 높이 44px(rem 이 아니라 px — 글자 200% 에서 커지지 않는다, DESIGN.md:2442), 왼쪽은 부르는 줄의 여백(24)에 선다.
 *
 * max — 이 달(yyyy-MM)보다 뒤를 고르고 "완료" 하면 이 달로 되돌린다(홈: 미래 달은 이번 달로, 사용자 10-29 (가)).
 */
export function MonthTitle({
  month,
  onChange,
  max,
  className,
}: {
  /** "yyyy-MM" */
  month: string;
  onChange: (month: string) => void;
  max?: string;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const [y = 1970, m = 1] = month.split("-").map(Number);
  return (
    <MonthPicker
      value={{ year: y, month: m }}
      onValueChange={(v) => {
        const key = `${v.year}-${String(v.month).padStart(2, "0")}`;
        onChange(max && key > max ? max : key);
      }}
      title={t("selectMonth")}
      doneLabel={t("done")}
      trigger={
        <button
          type="button"
          data-slot="month-title"
          className={cn(
            "inline-flex min-h-[44px] cursor-pointer items-center gap-x1 whitespace-nowrap rounded-r2 border-0 bg-transparent p-0 font-sans font-bold tabular-nums text-fg-neutral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
            className,
          )}
        >
          {formatYearMonth(new Date(y, m - 1))}
          <ChevronDown
            aria-hidden
            size={16}
            className="shrink-0 text-fg-neutral-muted"
          />
        </button>
      }
    />
  );
}

/** 불러오는 틀용 — 달 글과 같은 모양, 누르지 못한다 */
export function MonthTitleStatic({
  month,
  className,
}: {
  month: string;
  className?: string;
}) {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  return (
    <span
      className={cn(
        "inline-flex min-h-[44px] items-center gap-x1 whitespace-nowrap font-bold tabular-nums text-fg-neutral",
        className,
      )}
    >
      {formatYearMonth(new Date(y, m - 1))}
      <ChevronDown
        aria-hidden
        size={16}
        className="shrink-0 text-fg-neutral-muted"
      />
    </span>
  );
}
