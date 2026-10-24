import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DynamicIcon } from "lucide-react/dynamic";
import { Target } from "lucide-react";
import { Button } from "@/shared/ds/button";
import { ColorSwatchGroup, colorName } from "@/shared/ds/color-swatch";
import type { ColorSwatchValue } from "@/shared/ds/color-swatch";
import { DatePicker, dayKey, parseDayKey } from "@/shared/ds/date-picker";
import { useDsText } from "@/shared/ds/i18n";
import {
  CATEGORY_ICON_GLYPHS,
  DEFAULT_CATEGORY_ICON,
  IconPickerPanel,
  findCategoryIcon,
} from "@/shared/ds/icon-picker";
import {
  cellsOf,
  centerInScroller,
} from "@/shared/ds/icon-picker/icon-picker-variants";
import { useInputButtonSurface } from "@/shared/ds/input-button";
import { PickerRow } from "@/shared/ui/groo/picker-row";
import { isIconName } from "@/shared/lib";
import { CHART_PAIRS, chartColorOf } from "@/shared/lib/groo/chart-palette";
import { i18n } from "@/shared/i18n/config";

/**
 * 저축 목표 폼의 고르는 값 셋 — 목표일 · 아이콘 · 색을 줄로 보이고(I-19 16 ~ 18), 누르면 시트(1280 미만) · 팝오버(이상)로 고른다.
 * 저장 값은 그대로다 — 목표일 "YYYY-MM-DD" 문자열(비면 "") · 아이콘 lucide 이름 · 색 라이트 hex.
 */

// ── 목표일 ───────────────────────────────────────────
export function GoalDeadlineRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation("asset");
  const date = value ? parseDayKey(value) : undefined;
  const [draft, setDraft] = useState<Date | undefined>(date);
  const text = date
    ? new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    : t("savingGoal.none");
  return (
    <PickerRow
      title={t("savingGoal.deadline")}
      value={text}
      surfaceTitle={t("savingGoal.deadline")}
      onClear={date ? () => onChange("") : undefined}
      clearLabel={t("savingGoal.deadlineClear")}
      onOpen={() => setDraft(date)}
      popoverClassName="w-[336px]"
      footer={({ close }) => (
        <Button
          disabled={!draft}
          onClick={() => {
            if (draft) onChange(dayKey(draft));
            close();
          }}
        >
          {t("savingGoal.done")}
        </Button>
      )}
    >
      <DatePicker
        selection="single"
        aria-label={t("savingGoal.deadline")}
        value={draft}
        onValueChange={setDraft}
        autoFocus
      />
    </PickerRow>
  );
}

// ── 아이콘 ───────────────────────────────────────────
function Glyph({ id }: { id: string }) {
  const entry = findCategoryIcon(id);
  const Known = entry ? CATEGORY_ICON_GLYPHS[entry.id] : undefined;
  if (Known) return <Known aria-hidden />;
  if (isIconName(id)) return <DynamicIcon aria-hidden name={id} />;
  return <Target aria-hidden />;
}

export function GoalIconRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation("asset");
  const dsT = useDsText();
  const surface = useInputButtonSurface();
  const [query, setQuery] = useState("");
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const stored = value.trim();
  const entry = findCategoryIcon(stored);
  const shownId = entry ? entry.id : stored || DEFAULT_CATEGORY_ICON;
  const name = entry ? entry.name : dsT("iconPicker.current");
  const selectedId = entry ? entry.id : null;

  const onOpenAutoFocus = (e: Event) => {
    e.preventDefault();
    const cells = cellsOf(listboxRef.current);
    const cell =
      cells.find((c) => c.getAttribute("data-icon") === selectedId) ?? cells[0];
    if (!cell) return;
    centerInScroller(cell);
    cell.focus({ preventScroll: true });
  };

  return (
    <PickerRow
      title={t("form.icon")}
      value={name}
      glyph={<Glyph id={shownId} />}
      surfaceTitle={dsT("iconPicker.label")}
      bodyless
      popoverClassName="w-[408px]"
      onOpenAutoFocus={onOpenAutoFocus}
      onOpen={() => setQuery("")}
    >
      {({ close }) => (
        <IconPickerPanel
          surface={surface}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={(id) => {
            onChange(id);
            close();
          }}
          listboxRef={listboxRef}
          searchRef={searchRef}
        />
      )}
    </PickerRow>
  );
}

// ── 색 ───────────────────────────────────────────────
const BASE_OF = Object.fromEntries(CHART_PAIRS.map((p) => [p.key, p.base]));

export function GoalColorRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation("asset");
  const dsT = useDsText();
  const key = chartColorOf(value);
  const inPalette = key != null;
  const selected: ColorSwatchValue = key ?? "current";
  const name = key ? colorName(key) : dsT("colorSwatch.currentCustom");
  const dot = key ? `var(--color-chart-${key})` : value;
  return (
    <PickerRow
      title={t("form.color")}
      value={name}
      dot={dot}
      surfaceTitle={t("form.color")}
      popoverClassName="w-fit"
    >
      {({ close }) => (
        <div className="pt-x1">
          <ColorSwatchGroup
            aria-label={t("form.color")}
            value={selected}
            currentColor={inPalette ? undefined : value}
            onValueChange={(v) => {
              // "지금 색" 칸을 고르면 저장 값을 그대로 둔다 — 몰래 바꾸지 않는다
              if (v !== "current") onChange(BASE_OF[v]!);
              close();
            }}
          />
        </div>
      )}
    </PickerRow>
  );
}
