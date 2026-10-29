import { useState } from "react";
import {
  SearchableList,
  SearchableListEmpty,
  SearchableListGroup,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  matchesSearch,
} from "@/shared/ds/searchable-list";
import { LogoTile } from "@/shared/ds/logo-tile";
import {
  BANK_CATEGORY_ORDER,
  BANK_ENTRIES_BY_CATEGORY,
  INVEST_CATEGORIES,
  type BankCategory,
} from "@/shared/lib/groo/bank-colors";
import { CATEGORY_LABEL_KEY, INVEST_CATEGORY_SET } from "./form-lib";
import { PICK_LIST, PickResults, PickerField } from "./PickerField";
import type { AssetForm } from "./use-asset-form";

/**
 * 기관 · 증권사 칸(I-17 18) — Input Button → 고르기 시트(1280 이상 팝오버). 분류 머리 아래 기관 줄(Logo Tile 40 + 오른쪽 라디오),
 * 검색은 이름 · 별칭(NFC · 대소문자 · 공백 무시). 기관이 보유 유형을 정하는 규칙과 처음 값은 훅이 그대로 쥔다.
 */
export function InstitutionField({ f }: { f: AssetForm }) {
  const { t, editingGroup, brand, setBrand } = f;
  const invest = editingGroup === "invest";
  const categories: BankCategory[] = invest
    ? INVEST_CATEGORIES
    : BANK_CATEGORY_ORDER.filter((c) => !INVEST_CATEGORY_SET.has(c));
  return (
    <PickerField
      label={
        invest
          ? t("editDialog.brokerExchange")
          : t("editDialog.institutionBrand")
      }
      value={brand}
      placeholder={t("editDialog.institutionPlaceholder")}
      surfaceTitle={
        invest
          ? t("editDialog.pickBrokerTitle")
          : t("editDialog.pickInstitutionTitle")
      }
    >
      {({ close }) => (
        <InstitutionList
          t={t}
          invest={invest}
          categories={categories}
          brand={brand}
          onPick={(name) => {
            setBrand(name);
            close();
          }}
        />
      )}
    </PickerField>
  );
}

function InstitutionList({
  t,
  invest,
  categories,
  brand,
  onPick,
}: {
  t: AssetForm["t"];
  invest: boolean;
  categories: BankCategory[];
  brand: string;
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const groups = categories
    .map((cat) => ({
      cat,
      list: (BANK_ENTRIES_BY_CATEGORY[cat] ?? []).filter((e) =>
        matchesSearch(query, e.name, ...(e.aliases ?? [])),
      ),
    }))
    .filter((g) => g.list.length > 0);
  return (
    <SearchableList
      value={brand}
      onValueChange={onPick}
      query={query}
      onQueryChange={setQuery}
      className={PICK_LIST}
    >
      <SearchableListInput
        placeholder={
          invest
            ? t("editDialog.investSearchPlaceholder")
            : t("editDialog.bankSearchPlaceholder")
        }
      />
      <PickResults>
        {groups.length === 0 ? (
          <SearchableListEmpty />
        ) : (
          <SearchableListResults
            aria-label={
              invest
                ? t("editDialog.brokerExchange")
                : t("editDialog.institutionBrand")
            }
          >
            {groups.map(({ cat, list }) => (
              <SearchableListGroup key={cat} label={t(CATEGORY_LABEL_KEY[cat])}>
                {list.map((e) => (
                  <SearchableListItem
                    key={e.name}
                    value={e.name}
                    title={e.name}
                    prefix={<LogoTile name={e.name} size={40} />}
                  />
                ))}
              </SearchableListGroup>
            ))}
          </SearchableListResults>
        )}
      </PickResults>
    </SearchableList>
  );
}
