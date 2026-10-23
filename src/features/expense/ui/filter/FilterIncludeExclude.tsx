import { useTranslation } from "react-i18next";
import { ChipRadio, ChipRadioGroup } from "@/shared/ds/chip";
import type { PickMode } from "./use-include-exclude";

export function PickModeChips({
  mode,
  onChange,
  name,
}: {
  mode: PickMode;
  onChange: (m: PickMode) => void;
  /** 어느 조건의 방식인가 — 묶음 이름 */
  name: string;
}) {
  const { t } = useTranslation("expense");
  return (
    <ChipRadioGroup
      aria-label={`${name} ${t("filter.modeGroup")}`}
      value={mode}
      onValueChange={(v) => onChange(v as PickMode)}
    >
      <ChipRadio variant="outlineStrong" size="medium" value="include">
        {t("filter.modeInclude")}
      </ChipRadio>
      <ChipRadio variant="outlineStrong" size="medium" value="exclude">
        {t("filter.modeExclude")}
      </ChipRadio>
    </ChipRadioGroup>
  );
}
