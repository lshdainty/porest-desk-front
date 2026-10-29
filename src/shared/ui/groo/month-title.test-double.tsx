// 시험용 대역 — 진짜 MonthTitle(연 | 월 휠)은 month-title.test.tsx 가 본다. 화면 시험은 "달이 바뀌면 화면이 따라간다" 만 보면 되어
// 이전 · 다음 달로 값을 바꿔 주는 단추 둘로 갈음한다(화면에는 ‹ › 가 없다).
import { formatYearMonth } from "@/shared/lib/date";

const shift = (key: string, d: number) => {
  const [y = 1970, m = 1] = key.split("-").map(Number);
  const x = new Date(y, m - 1 + d, 1);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

export function MonthTitle({
  month,
  onChange,
}: {
  month: string;
  onChange: (key: string) => void;
}) {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  return (
    <>
      <span data-slot="month-title">{formatYearMonth(new Date(y, m - 1))}</span>
      <button
        type="button"
        aria-label="이전 달"
        onClick={() => onChange(shift(month, -1))}
      />
      <button
        type="button"
        aria-label="다음 달"
        onClick={() => onChange(shift(month, 1))}
      />
    </>
  );
}

export function MonthTitleStatic({ month }: { month: string }) {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  return <span>{formatYearMonth(new Date(y, m - 1))}</span>;
}
