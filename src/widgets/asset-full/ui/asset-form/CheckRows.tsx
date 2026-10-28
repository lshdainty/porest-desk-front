import { ListCheckGroup, ListCheckItem } from "@/shared/ds/list";
import type { AssetForm } from "./use-asset-form";

/**
 * "전체 자산 합계에 포함" · "금액 가리기" — 저장해야 적용되는 값이라 체크 줄 둘(DESIGN.desk "합계에 포함은 Checkbox", I-17 17).
 * 줄은 본문 좌우 0 에 제 24 를 가진다(본문 가장자리까지). 둘 다 이 자산 하나에 붙는 표시 규칙이라 나란히 둔다.
 */
export function CheckRows({ f }: { f: AssetForm }) {
  const {
    t,
    isIncludedInTotal,
    setIsIncludedInTotal,
    isAmountHidden,
    setIsAmountHidden,
    unlockedRef,
  } = f;
  return (
    <div className="-mx-x6 pt-x2">
      <ListCheckGroup aria-label={t("editDialog.rulesGroup")}>
        <ListCheckItem
          markPosition="suffix"
          title={t("editDialog.includeInTotal")}
          detail={t("editDialog.includeInTotalDesc")}
          checked={isIncludedInTotal === "Y"}
          onCheckedChange={(b) => setIsIncludedInTotal(b === true ? "Y" : "N")}
        />
        <ListCheckItem
          id="asset-edit-hide-amount"
          markPosition="suffix"
          title={t("editDialog.hideAmount")}
          detail={t("editDialog.hideAmountDesc")}
          checked={isAmountHidden === "Y"}
          onCheckedChange={(b) => {
            // 다시 켜면 앞서 받은 확인은 무른다 — 또 끄면 다시 물어야 한다.
            if (b === true) unlockedRef.current = false;
            setIsAmountHidden(b === true ? "Y" : "N");
          }}
        />
      </ListCheckGroup>
    </div>
  );
}
