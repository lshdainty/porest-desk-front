import { useTranslation } from "react-i18next";

import { useDsText } from "@/shared/ds/i18n";
import { ResultSection } from "@/shared/ds/result-section";

/**
 * 일정 질의 실패 (I-09 12 · 19) — 빈 격자가 아니라 격자 자리에 Result Section failure + "다시 시도".
 * 다시 시도는 일정 질의 하나만 다시 받는다. 공휴일 · 라벨 질의 실패는 이 자리가 아니라 격자를 그대로 그린다.
 */
export function CalendarLoadFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("calendar");
  const dsT = useDsText();
  return (
    <ResultSection
      data-slot="calendar-load-failed"
      size="medium"
      kind="failure"
      title={t("loadFailed")}
      description={t("loadFailedDesc")}
      primaryAction={{ label: dsT("common.retry"), onClick: onRetry }}
    />
  );
}
