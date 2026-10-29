import { MonthTitle } from "@/shared/ui/groo/month-title";

/**
 * 달 머리 — "2026년 10월 ▾" (I-07 26 · 27 · I-10 27 · 28, I-27). 달 이름 t6 · 700 + 아래 꺾쇠, 누르면 연 | 월 휠.
 * ‹ › 는 두지 않는다(사용자 10-29) — 달은 휠로만 옮긴다. 왼쪽은 카드 여백 24 에 선다.
 * 가계부 · 할 일 데스크톱의 작은 달력 · 요약 카드가 같이 쓴다. 기간이 걸려 있으면 그 밖의 달은 부르는 쪽이 기간 안으로 모은다(가계부 Q5-C).
 */
export function MonthHead({
  month,
  onChange,
}: {
  /** "yyyy-MM" */
  month: string;
  onChange: (month: string) => void;
}) {
  return <MonthTitle month={month} onChange={onChange} className="text-t6" />;
}
