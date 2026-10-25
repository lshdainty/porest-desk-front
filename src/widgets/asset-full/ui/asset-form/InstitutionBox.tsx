import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { BANK_ENTRIES } from "@/shared/lib/groo/bank-colors";
import {
  INVEST_CATEGORY_SET,
  CATEGORY_LABEL_KEY,
  INVEST_BRANDS,
} from "./form-lib";
import type { AssetForm } from "./use-asset-form";

export function InstitutionBox({ f }: { f: AssetForm }) {
  const {
    t,
    editingGroup,
    brand,
    setBrand,
    query,
    setQuery,
    bankFilteredByCategory,
    investFilteredByCategory,
    investFilteredCount,
  } = f;
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[13px] font-medium">
            {editingGroup === "invest"
              ? t("editDialog.brokerExchange")
              : t("editDialog.institutionBrand")}
          </Label>
          <span className="text-[11px] text-[var(--fg-tertiary)]">
            {t("editDialog.totalCount", {
              count:
                editingGroup === "invest"
                  ? INVEST_BRANDS.length
                  : BANK_ENTRIES.filter(
                      (e) => !INVEST_CATEGORY_SET.has(e.category),
                    ).length,
            })}
          </span>
        </div>
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
          />
          <Input
            search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              editingGroup === "invest"
                ? t("editDialog.investSearchPlaceholder")
                : t("editDialog.bankSearchPlaceholder")
            }
            className="pl-9"
          />
        </div>
        <div
          className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          style={{ maxHeight: 260, overflowY: "auto" }}
        >
          {editingGroup === "invest" ? (
            investFilteredCount === 0 ? (
              <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
                {t("editDialog.noSearchResults")}
              </div>
            ) : (
              <ToggleGroup
                type="single"
                value={brand}
                onValueChange={(v) => v && setBrand(v)}
                className="block w-full"
              >
                {investFilteredByCategory.map(([cat, list]) => (
                  <div key={cat}>
                    <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                      {t(CATEGORY_LABEL_KEY[cat])}
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {list.map((e) => {
                        const active = e.name === brand;
                        return (
                          <ToggleGroupItem
                            key={e.name}
                            value={e.name}
                            className="rounded-full border text-[12.5px] font-medium h-7 min-w-0 px-3"
                            style={
                              active
                                ? {
                                    background: e.color.bg,
                                    color: e.color.fg ?? "#fff",
                                    borderColor: "transparent",
                                  }
                                : {
                                    background: "var(--bg-muted)",
                                    color: "var(--fg-secondary)",
                                    borderColor: "transparent",
                                  }
                            }
                          >
                            {e.name}
                          </ToggleGroupItem>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </ToggleGroup>
            )
          ) : bankFilteredByCategory.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-[var(--fg-tertiary)]">
              {t("editDialog.noSearchResults")}
            </div>
          ) : (
            <ToggleGroup
              type="single"
              value={brand}
              onValueChange={(v) => v && setBrand(v)}
              className="block w-full"
            >
              {bankFilteredByCategory.map(([cat, list]) => (
                <div key={cat}>
                  <div className="sticky top-0 z-[1] px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-surface)]">
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {list.map((e) => {
                      const active = e.name === brand;
                      return (
                        <ToggleGroupItem
                          key={e.name}
                          value={e.name}
                          className="rounded-full border text-[12.5px] font-medium h-7 min-w-0 px-3"
                          style={
                            active
                              ? {
                                  background: e.color.bg,
                                  color: e.color.fg ?? "#fff",
                                  borderColor: "transparent",
                                }
                              : {
                                  background: "var(--bg-muted)",
                                  color: "var(--fg-secondary)",
                                  borderColor: "transparent",
                                }
                          }
                        >
                          {e.name}
                        </ToggleGroupItem>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ToggleGroup>
          )}
        </div>
      </div>
    </>
  );
}
