import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ds/button";
import { MonthPicker } from "@/shared/ds/month-picker";
import { formatYearMonth } from "@/shared/lib/date";

/**
 * 달 줄(I-08 7 · 19) — 띠 맨 위 4 + 8 = 12, ← 달 → 와 오른쪽 자리 한 줄, 좌우 24.
 * ← → 는 ds 아이콘 버튼(크기표 medium — 보이는 40 · 아이콘 18 · 누르는 44, 아이콘이 글 왼쪽 24 에 서도록 −10), 달 글을 누르면 달 고르기.
 * 페이지 전체를 조절하는 줄이라 첫 구역과 한 덩어리다 — 위 틈 없음, 첫 구역과는 12(구역이 준다).
 */
type MonthControlsProps = {
  monthKey: string;
  onChange: (key: string) => void;
  onStep: (delta: number) => void;
  /** 폰 줄은 ← 가 글 왼쪽 24 에 서도록 −12 */
  flushLeft?: boolean;
};

/** ← 달 → — 폰 달 줄과 데스크톱 화면 제목 줄이 같은 부품을 쓴다 */
export function MonthControls({
  monthKey,
  onChange,
  onStep,
  flushLeft = false,
}: MonthControlsProps) {
  const { t } = useTranslation("budget");
  const { t: tc } = useTranslation("common");
  const [y = 1970, m = 1] = monthKey.split("-").map(Number);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        layout="iconOnly"
        className={flushLeft ? "-ml-x2_5" : undefined}
        aria-label={t("prevMonth")}
        onClick={() => onStep(-1)}
      >
        <ChevronLeft aria-hidden />
      </Button>
      {/* 달 글을 누르면 연 | 월 휠(I-27) — 글 t5 16/22 · 700 · fg-neutral + 아래 꺾쇠 16, 누르는 높이 44. ← 상자 끝에서 10 들인다 */}
      <MonthPicker
        value={{ year: y, month: m }}
        onValueChange={(v) =>
          onChange(`${v.year}-${String(v.month).padStart(2, "0")}`)
        }
        title={tc("selectMonth")}
        doneLabel={tc("done")}
        trigger={
          <button
            type="button"
            className="month-picker__trigger ml-x2_5 mr-x2_5 inline-flex min-h-11 cursor-pointer items-center gap-x1 border-0 bg-transparent p-0 font-sans text-t5 font-bold text-fg-neutral"
          >
            {formatYearMonth(new Date(y, m - 1))}
            <ChevronDown
              aria-hidden
              size={16}
              className="text-fg-neutral-muted"
            />
          </button>
        }
      />
      <Button
        type="button"
        variant="ghost"
        layout="iconOnly"
        aria-label={t("nextMonth")}
        onClick={() => onStep(1)}
      >
        <ChevronRight aria-hidden />
      </Button>
    </>
  );
}

export function MonthBar({
  right,
  ...controls
}: Omit<MonthControlsProps, "flushLeft"> & {
  /** 오른쪽 자리 — 글 버튼("설정" · "지난달 복사") */
  right?: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-center px-x6 pt-x3"
      data-slot="month-bar"
    >
      {/* ← 달 → 는 한 덩어리 — 큰 글자에서 오른쪽 버튼만 다음 줄로 내려간다 */}
      <div className="flex items-center">
        <MonthControls flushLeft {...controls} />
      </div>
      {right != null && (
        <div className="ml-auto flex items-center">{right}</div>
      )}
    </div>
  );
}
