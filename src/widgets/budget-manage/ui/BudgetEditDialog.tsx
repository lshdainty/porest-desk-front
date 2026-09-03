import { useState } from "react";
import {
  MAX_AMOUNT,
  blockNonDigitKey,
  parseAmount,
  sanitizeAmountInput,
} from "@/shared/lib/porest/amount";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/porest/primitives";
import { ModalFooter } from "@/shared/ui/porest/modal-footer";
import { CategoryGrid, CategoryTile } from "@/shared/ui/category-tile";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel } from "@/shared/ui/field";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { money, isEn } from "@/shared/lib/porest/format";
import { tileRadius } from "@/shared/lib";
import type { ExpenseBudget, ExpenseCategory } from "@/entities/expense";
import { getPaletteByColor } from "@/shared/lib/porest/chart-palette";

export interface BudgetDraft {
  categoryRowId: number;
  budgetAmount: number;
}

/**
 * 카테고리 예산 프리셋 칩.
 *
 * 칩 라벨은 축약이 아니라 **우리가 고른 값의 이름**이다 — 전부 만으로 나누어
 * 떨어지므로(`p % 10_000 === 0`) `10만원`·`100만원` 은 반올림 없이 값 그대로다.
 * 공용 `formatChartAxis` 를 태워도 숫자는 한 글자도 안 바뀌고(`10만`·`100만`)
 * 문장이 아닌 칩이라 단위 `원` 을 붙여 두는 편이 읽힌다. 그래서 손계산을 남긴다.
 *
 * **값을 추가할 때는 만으로 나누어떨어지는지 먼저 본다.** 15,000 같은 값을 끼우면
 * `(p / 10_000).toFixed(0)` 이 `2만원` 으로 33% 를 깎아 버린다 — 그때는 이 자리도
 * `formatChartAxis` 로 옮겨야 한다(임의 값을 줄이는 자리는 공용 함수 하나만 쓴다).
 */
const PRESETS = [100_000, 200_000, 300_000, 500_000, 800_000, 1_000_000];

export function BudgetEditDialog({
  budget,
  categories,
  existing,
  onClose,
  onSave,
  mobile,
  submitting,
}: {
  budget: ExpenseBudget | null;
  categories: ExpenseCategory[];
  existing: ExpenseBudget[];
  onClose: () => void;
  onSave: (draft: BudgetDraft) => void;
  mobile: boolean;
  submitting?: boolean;
}) {
  const { t } = useTranslation("budget");
  const { t: tCommon } = useTranslation("common");
  const isNew = !budget;

  // 선택 가능한 카테고리 = EXPENSE 타입의 **부모 카테고리(top-level)** 만.
  // 자식 leaf 는 현재 허용 안 함 — 자식의 지출은 부모로 roll-up 되어 집계됨.
  // 향후 leaf 단위 예산 요청 들어오면 제한을 풀면 됨.
  const selectableCats = categories.filter(
    (c) => c.expenseType === "EXPENSE" && c.parentRowId == null,
  );

  const usedCatIds = new Set(
    existing
      .filter((b) => b.categoryRowId !== null)
      .map((b) => b.categoryRowId as number),
  );

  const initialCatId: number | null =
    budget?.categoryRowId ??
    selectableCats.find((c) => !usedCatIds.has(c.rowId))?.rowId ??
    selectableCats[0]?.rowId ??
    null;

  const [categoryRowId, setCategoryRowId] = useState<number | null>(
    initialCatId,
  );
  const [limit, setLimit] = useState(String(budget?.budgetAmount ?? 300_000));
  const [touched, setTouched] = useState(false);

  const selectedCat = categories.find((c) => c.rowId === categoryRowId) ?? null;
  const palette = getPaletteByColor(selectedCat?.color);

  const dupCat =
    isNew && categoryRowId != null && usedCatIds.has(categoryRowId);
  // parseInt 가 아니라 parseAmount — 콤마·소수점·상한을 금액 칸 전체와 같은 규칙으로 읽는다.
  // (parseInt("1,000") 은 1 이었다)
  const limitNum = parseAmount(limit);
  // 이미 999억으로 저장된 예산을 열면 여기서 걸린다(QA #48). 초기값을 몰래 100억으로
  // 고쳐 넣지 않는다 — 저장된 값을 그대로 보여 주고 왜 못 저장하는지 알려 준다.
  const tooLarge = limitNum > MAX_AMOUNT;
  const valid = categoryRowId != null && !dupCat && limitNum > 0 && !tooLarge;

  const save = () => {
    setTouched(true);
    if (!valid || categoryRowId == null) return;
    onSave({ categoryRowId, budgetAmount: limitNum });
  };

  const availableCats = isNew
    ? selectableCats.filter((c) => !usedCatIds.has(c.rowId))
    : selectableCats;

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={isNew ? t("add") : tCommon("save")}
      saving={submitting}
      saveDisabled={touched && !valid}
      // 모바일도 [취소][저장] 이다. 목록 행을 밀면 삭제가 나오므로(BudgetManager
      // SwipeActions) 이 시트가 유일한 삭제 경로가 아니게 됐다 — 수정하러 들어온
      // 시트에 파괴적 액션을 같이 두지 않는다(사용자 결정).
      onCancel={onClose}
    />
  );

  return (
    <ModalShell
      title={isNew ? t("edit.addTitle") : t("edit.editTitle")}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          background: "var(--bg-muted)",
          borderRadius: "var(--radius-tile)",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: tileRadius(44),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: palette.bg,
            color: palette.color,
          }}
        >
          <Icon name={selectedCat?.icon ?? "tag"} size={18} strokeWidth={1.9} />
        </span>
        <div>
          <div
            style={{
              font: "700 15px/1.3 var(--font-sans)",
              color: "var(--fg-primary)",
              letterSpacing: "-0.012em",
            }}
          >
            {selectedCat?.categoryName ?? t("edit.selectCategory")}
          </div>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-tertiary)",
              marginTop: 2,
            }}
          >
            {t("edit.monthlyLimitPreview")} {money(limitNum)}
          </div>
        </div>
      </div>

      {isNew && (
        <Field style={{ marginBottom: 14 }}>
          <FieldLabel>{t("edit.categoryLabel")}</FieldLabel>
          {availableCats.length === 0 ? (
            <div
              style={{
                padding: 12,
                background: "var(--bg-muted)",
                borderRadius: "var(--radius-tile)",
                fontSize: "var(--text-caption)",
                color: "var(--fg-secondary)",
              }}
            >
              {t("edit.allBudgeted")}
            </div>
          ) : (
            <CategoryGrid>
              {availableCats.map((c) => (
                <CategoryTile
                  key={c.rowId}
                  name={c.categoryName}
                  color={getPaletteByColor(c.color).color}
                  icon={c.icon}
                  active={categoryRowId === c.rowId}
                  onClick={() => setCategoryRowId(c.rowId)}
                />
              ))}
            </CategoryGrid>
          )}
        </Field>
      )}

      <Field style={{ marginBottom: 10 }}>
        <FieldLabel>{t("edit.monthlyLimitField")}</FieldLabel>
        <Input
          className="num"
          value={limit}
          onChange={(e) => {
            setLimit(sanitizeAmountInput(e.target.value));
            setTouched(true);
          }}
          onKeyDown={blockNonDigitKey}
          inputMode="numeric"
        />
        {tooLarge && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--text-caption)",
              color: "var(--fg-danger, var(--fg-secondary))",
            }}
          >
            {tCommon("amountTooLarge")}
          </p>
        )}
      </Field>
      <ToggleGroup
        type="single"
        size="sm"
        value={PRESETS.includes(limitNum) ? limit : ""}
        onValueChange={(v) => v && setLimit(v)}
        className="mb-2.5 flex-wrap justify-start"
      >
        {PRESETS.map((p) => (
          <ToggleGroupItem key={p} value={String(p)} className="rounded-full">
            {isEn() ? money(p) : `${(p / 10_000).toFixed(0)}만원`}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ModalShell>
  );
}

export function MonthlyBudgetDialog({
  value,
  onClose,
  onSave,
  mobile,
  submitting,
}: {
  value: number;
  onClose: () => void;
  onSave: (v: number) => void;
  mobile: boolean;
  submitting?: boolean;
}) {
  const { t } = useTranslation("budget");
  const { t: tCommon } = useTranslation("common");
  const [v, setV] = useState(String(value));
  // 위 PRESETS 주석과 같은 이유로 손계산을 남긴다 — 전부 만 단위로 떨어진다.
  const presets = [1_500_000, 2_000_000, 2_500_000, 3_000_000];
  const vNum = parseAmount(v);
  const tooLarge = vNum > MAX_AMOUNT;

  const Footer = (
    <ModalFooter
      onSave={() => onSave(vNum)}
      saveLabel={tCommon("save")}
      saving={submitting}
      saveDisabled={vNum <= 0 || tooLarge}
      onCancel={onClose}
    />
  );

  return (
    <ModalShell
      title={t("edit.monthlyTitle")}
      onClose={onClose}
      size="sm"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 10 }}>
        <FieldLabel>{t("edit.monthlyTotalField")}</FieldLabel>
        <Input
          className="num"
          style={{ fontSize: "var(--text-title-lg)", fontWeight: "700" }}
          value={v}
          onChange={(e) => setV(sanitizeAmountInput(e.target.value))}
          onKeyDown={blockNonDigitKey}
          inputMode="numeric"
          autoFocus
        />
        {tooLarge && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--text-caption)",
              color: "var(--fg-danger, var(--fg-secondary))",
            }}
          >
            {tCommon("amountTooLarge")}
          </p>
        )}
      </Field>
      <ToggleGroup
        type="single"
        size="sm"
        value={presets.includes(vNum) ? v : ""}
        onValueChange={(val) => val && setV(val)}
        className="flex-wrap justify-start"
      >
        {presets.map((p) => (
          <ToggleGroupItem key={p} value={String(p)} className="rounded-full">
            {isEn() ? money(p) : `${(p / 10_000).toFixed(0)}만원`}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ModalShell>
  );
}
