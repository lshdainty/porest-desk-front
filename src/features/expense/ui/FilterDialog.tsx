import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Asset } from "@/entities/asset";
import type { ExpenseCategory, ExpenseType } from "@/entities/expense";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import { Button } from "@/shared/ds/button";
import { ModalShell } from "@/shared/ui/groo/dialogs";
import { ModalFooter } from "@/shared/ui/groo/modal-footer";
import {
  DEFAULT_FILTER,
  activeConditionCount,
  type AmountRange,
  type FilterPeriodRange,
  type FilterValue,
  type IncludeExclude,
  type MatchMode,
} from "../model/filter";
import {
  FilterAmountBody,
  FilterAssetBody,
  FilterCategoryBody,
  FilterMatchBody,
  FilterPeriodBody,
  FilterTypeBody,
} from "./filter";

/** 조건 한 칸 — 조건 이름(제목) + 본문 부품. 칸 사이 24 는 부르는 쪽이 준다 */
function Section({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-x2">
      <h3 id={id} className="m-0 text-t4 font-medium text-fg-neutral">
        {label}
      </h3>
      {children}
    </section>
  );
}

/**
 * 거래 거르기 — 조건 본문 부품(`./filter/*`) 여섯을 한 번에 쌓는다(I-07 18). 폰은 Bottom Sheet(폼 — 바깥을 눌러도 닫히지 않고,
 * 머리 ✕ 는 고른 것을 버리고 닫는다), 그 밖은 지금처럼 대화상자다(데스크톱 · 태블릿은 07-2 가 조건마다 팝오버 · 시트로 나눠 담는다).
 * 값은 `FilterValue` 그대로 — 모델 · `matchesFilter` 는 바꾸지 않는다.
 *
 * 고르지 않은 기간은 조건이 아니다 — 처음 열 때 보던 달을 기간 칸에 넣어 두지 않는다(그러면 계좌만 걸어도 그 달에 묶인다).
 */
export function FilterDialog({
  initial,
  categories,
  assets,
  onClose,
  onApply,
  mobile,
}: {
  initial?: FilterValue | null;
  categories: ExpenseCategory[];
  assets: Asset[];
  onClose: () => void;
  onApply: (v: FilterValue) => void;
  mobile: boolean;
}) {
  const { t } = useTranslation("expense");
  const start = initial ?? DEFAULT_FILTER;

  const [match, setMatch] = useState<MatchMode>(start.match);
  const [periods, setPeriods] = useState<FilterPeriodRange[]>(start.periods);
  const [types, setTypes] = useState<ExpenseType[]>(start.types);
  const [cats, setCats] = useState<IncludeExclude>(start.categories);
  const [accs, setAccs] = useState<IncludeExclude>(start.assets);
  const [amounts, setAmounts] = useState<AmountRange[]>(start.amountRanges);

  const draft: FilterValue = {
    match,
    periods,
    types,
    categories: cats,
    assets: accs,
    amountRanges: amounts,
  };
  // 조건이 하나뿐이면 "모두"와 "하나라도"가 같은 결과다 — 고르게 두면 헷갈린다.
  const matchDisabled = activeConditionCount(draft) <= 1;

  const reset = () => {
    setMatch("all");
    setPeriods([]);
    setTypes(DEFAULT_FILTER.types);
    setCats({ include: [], exclude: [] });
    setAccs({ include: [], exclude: [] });
    setAmounts([]);
  };

  const badPeriod = periods.some((p) => p.start && p.end && p.start > p.end);
  const apply = () =>
    onApply({
      ...draft,
      match: matchDisabled ? "all" : match,
      // 둘 다 끄면 둘 다 켠 것과 같다 — 같은 값으로 맞춰 둔다
      types: types.length === 0 ? DEFAULT_FILTER.types : types,
    });

  const sections = (
    <div className="flex flex-col gap-x6">
      <Section label={t("filter.match")}>
        <FilterMatchBody
          value={match}
          onChange={setMatch}
          disabled={matchDisabled}
        />
      </Section>
      <Section label={t("filter.period")}>
        <FilterPeriodBody value={periods} onChange={setPeriods} />
      </Section>
      <Section label={t("filter.txType")}>
        <FilterTypeBody value={types} onChange={setTypes} />
      </Section>
      {categories.some((c) => c.parentRowId == null) && (
        <Section label={t("category")}>
          <FilterCategoryBody
            categories={categories}
            value={cats}
            onChange={setCats}
          />
        </Section>
      )}
      {assets.length > 0 && (
        <Section label={t("accountCard")}>
          <FilterAssetBody assets={assets} value={accs} onChange={setAccs} />
        </Section>
      )}
      <Section label={t("filter.amountRange")}>
        <FilterAmountBody value={amounts} onChange={setAmounts} />
      </Section>
    </div>
  );

  if (mobile) {
    return (
      <BottomSheet
        open
        form
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <BottomSheetContent title={t("filter.title")}>
          <BottomSheetBody scrollFog>{sections}</BottomSheetBody>
          <BottomSheetFooter>
            <Button variant="neutralWeak" onClick={reset}>
              {t("filter.reset")}
            </Button>
            <Button disabled={badPeriod} onClick={apply}>
              {t("filter.apply")}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <ModalShell
      title={t("filter.title")}
      onClose={onClose}
      size="md"
      footer={
        <ModalFooter
          onCancel={reset}
          cancelLabel={t("filter.reset")}
          onSave={apply}
          saveLabel={t("filter.apply")}
          saveDisabled={badPeriod}
        />
      }
      mobile={false}
    >
      {sections}
    </ModalShell>
  );
}
