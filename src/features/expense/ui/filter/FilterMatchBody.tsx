import { useTranslation } from "react-i18next";
import { ListRadioGroup, ListRadioItem } from "@/shared/ds/list";
import type { MatchMode } from "../../model/filter";

/**
 * 조건 맞추기 본문 — "모두 일치" / "하나라도 일치" 하나 고르기(List 라디오 줄, 오른쪽 라디오 24 — list.md "하나 고르기").
 * 기간은 항상 함께 적용된다는 안내가 위에 있다. 조건이 하나 이하면 두 줄 모두 막히고(`disabled`) 왜 막혔는지를 아래에 말한다.
 *
 * 폰 시트 · 태블릿 시트 · 데스크톱 팝오버가 이 본문 하나를 나눠 담는다(I-07 E) — 값은 `FilterValue.match` 그대로.
 */
export function FilterMatchBody({
  value,
  onChange,
  disabled,
}: {
  value: MatchMode;
  onChange: (next: MatchMode) => void;
  /** 걸린 조건이 하나 이하라 고를 수 없다 */
  disabled: boolean;
}) {
  const { t } = useTranslation("expense");
  return (
    <div className="flex flex-col gap-x2">
      <p className="m-0 text-t3 text-fg-neutral-subtle">
        {t("filter.periodAlwaysAnd")}
      </p>
      {/* 줄이 제 좌우 24 를 갖는다 — 본문 여백 24 와 겹치지 않게 그 만큼 바깥으로 낸다(목록은 w-full 이라 감싸서 낸다) */}
      <div className="-mx-global-gutter">
        <ListRadioGroup
          aria-label={t("filter.match")}
          value={disabled ? "all" : value}
          onValueChange={(v) => onChange(v as MatchMode)}
        >
          <ListRadioItem
            value="all"
            title={t("filter.matchAll")}
            detail={t("filter.matchAllDesc")}
            disabled={disabled}
          />
          <ListRadioItem
            value="any"
            title={t("filter.matchAny")}
            detail={t("filter.matchAnyDesc")}
            disabled={disabled}
          />
        </ListRadioGroup>
      </div>
      {disabled && (
        <p className="m-0 text-t3 text-fg-neutral-subtle">
          {t("filter.matchHint")}
        </p>
      )}
    </div>
  );
}
