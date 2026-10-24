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
import { ListHeader } from "@/shared/ds/list";
import {
  DEFAULT_FILTER,
  activeConditionCount,
  resolvePeriod,
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
    <section aria-labelledby={id} className="flex flex-col">
      {/* 조건 이름 = List Header mediumWeak h3(시트 · 대화상자 안 — list.md "제목 태그"). 좌우 24 는 본문 여백이 쥔다 */}
      <ListHeader as="h3" id={id} className="px-0">
        {label}
      </ListHeader>
      {children}
    </section>
  );
}

/**
 * 거래 거르기 — 조건 본문 부품(`./filter/*`) 여섯을 한 번에 쌓는다(I-07 18). 폰만 쓴다 — Bottom Sheet(폼 — 바깥을 눌러도 닫히지 않고,
 * 머리 ✕ 는 고른 것을 버리고 닫는다). 데스크톱 · 태블릿은 조건마다 팝오버 · 시트로 나눠 담는다(`FilterBar`, I-07 28 ~ 30).
 * 값은 `FilterValue` 그대로 — 모델 · `matchesFilter` 는 바꾸지 않는다.
 *
 * 기간 칸은 처음 열 때 보던 달(`defaultPeriod`)로 채운다 — 폰은 "옮기기 = 기능 그대로"라 옛 동작을 지킨다. "고르지 않은 기간은
 * 조건이 아니다"(Q5-C)는 짝 2 가 데스크톱 · 태블릿(`FilterBar`)에서 적용했다 — 폰까지 걷을지는 디자인시스템 세션에 묻는다.
 */
export function FilterDialog({
  initial,
  defaultPeriod,
  categories,
  assets,
  onClose,
  onApply,
}: {
  initial?: FilterValue | null;
  /** 보고 있는 달의 기간 — 처음 열 때와 초기화에 쓴다(`monthPeriodOf`). 없으면 이번 달. */
  defaultPeriod?: FilterPeriodRange;
  categories: ExpenseCategory[];
  assets: Asset[];
  onClose: () => void;
  onApply: (v: FilterValue) => void;
}) {
  const { t } = useTranslation("expense");
  const start = initial ?? DEFAULT_FILTER;

  const [match, setMatch] = useState<MatchMode>(start.match);
  const [periods, setPeriods] = useState<FilterPeriodRange[]>(
    start.periods.length > 0
      ? start.periods
      : [defaultPeriod ?? resolvePeriod("month")],
  );
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
    setPeriods([defaultPeriod ?? resolvePeriod("month")]);
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
