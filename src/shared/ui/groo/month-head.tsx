import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ds/button";
import { formatYearMonth } from "@/shared/lib/date";

/**
 * 달 이동 머리 — ‹ "2026년 10월" › (I-07 26 · 27 · I-10 27 · 28). 꺾쇠 Button ghost medium iconOnly 40 · 아이콘 18, 달 이름 t6 · 700 ·
 * 고정폭 · 좌우 4. 줄을 왼쪽으로 10 내어 꺾쇠 글자가 카드 여백 24 에 선다. 가계부 · 할 일 데스크톱의 작은 달력 · 요약 카드가 같이 쓴다.
 * 기간이 걸려 있으면 그 밖의 달 단추는 막힌다(가계부 Q5-C). 달 이동이 쪽 넘김이다 — 누른 단추에 초점이 남는다.
 */
export function MonthHead({
  month,
  onMove,
  prevLabel,
  nextLabel,
  canPrev = true,
  canNext = true,
}: {
  /** "yyyy-MM" */
  month: string;
  onMove: (delta: -1 | 1) => void;
  prevLabel: string;
  nextLabel: string;
  canPrev?: boolean;
  canNext?: boolean;
}) {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  return (
    <div className="-ml-x2_5 flex items-center">
      <Button
        variant="ghost"
        size="medium"
        layout="iconOnly"
        aria-label={prevLabel}
        disabled={!canPrev}
        onClick={() => onMove(-1)}
      >
        <ChevronLeft />
      </Button>
      <span className="num px-x1 text-t6 font-bold text-fg-neutral whitespace-nowrap">
        {formatYearMonth(new Date(y, m - 1))}
      </span>
      <Button
        variant="ghost"
        size="medium"
        layout="iconOnly"
        aria-label={nextLabel}
        disabled={!canNext}
        onClick={() => onMove(1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
