import { useTranslation } from "react-i18next";
import { formatDay, money } from "@/shared/lib/groo/format";

/** 날 버튼 이름 — "10월 21일, 지출 1,128,128,106원"(지출이 없으면 날짜만) */
export function useDayLabel() {
  const { t } = useTranslation("expense");
  return (ds: string, out: number) => {
    const date = formatDay(ds).md;
    return out > 0
      ? t("calendar.dayLabel", { date, amount: money(out) })
      : t("calendar.dayLabelNone", { date });
  };
}
