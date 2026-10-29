import type { ReactNode } from "react";
import { MonthTitle } from "@/shared/ui/groo/month-title";

/**
 * 달 줄(I-08 7 · 19, I-27) — 띠 맨 위 4 + 8 = 12, "2026년 10월 ▾" 글과 오른쪽 자리 한 줄, 좌우 24.
 * 달 글을 누르면 달 고르기(연 | 월 휠). ‹ › 는 두지 않는다(사용자 10-29).
 * 페이지 전체를 조절하는 줄이라 첫 구역과 한 덩어리다 — 위 틈 없음, 첫 구역과는 12(구역이 준다).
 */
type MonthControlsProps = {
  monthKey: string;
  onChange: (key: string) => void;
};

/** 달 글 한 덩어리 — 폰 달 줄과 데스크톱 화면 제목 줄이 같은 부품을 쓴다. 글 + 꺾쇠, 누르면 연 | 월 휠 */
export function MonthControls({ monthKey, onChange }: MonthControlsProps) {
  return (
    <MonthTitle month={monthKey} onChange={onChange} className="text-t5" />
  );
}

export function MonthBar({
  right,
  ...controls
}: MonthControlsProps & {
  /** 오른쪽 자리 — 글 버튼("설정" · "지난달 복사") */
  right?: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-center px-x6 pt-x3"
      data-slot="month-bar"
    >
      <MonthControls {...controls} />
      {right != null && (
        <div className="ml-auto flex items-center">{right}</div>
      )}
    </div>
  );
}
