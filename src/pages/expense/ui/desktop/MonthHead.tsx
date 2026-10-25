import { useTranslation } from "react-i18next";
import { MonthHead as SharedMonthHead } from "@/shared/ui/groo/month-head";

/** 가계부 달 이동 머리 — 공용 `MonthHead`(할 일 데스크톱과 같은 부품)에 가계부 단추 이름을 준다 */
export function MonthHead(props: {
  month: string;
  onMove: (delta: -1 | 1) => void;
  canPrev?: boolean;
  canNext?: boolean;
}) {
  const { t } = useTranslation("expense");
  return (
    <SharedMonthHead
      {...props}
      prevLabel={t("prevMonth")}
      nextLabel={t("nextMonth")}
    />
  );
}
