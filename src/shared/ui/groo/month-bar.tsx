import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ds/button";
import { MonthPicker } from "@/shared/ui/groo/primitives";

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
      <MonthPicker
        value={monthKey}
        onChange={onChange}
        variant="borderless"
        align="left"
        allowFuture
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
      <MonthControls flushLeft {...controls} />
      {right != null && (
        <div className="ml-auto flex items-center">{right}</div>
      )}
    </div>
  );
}
