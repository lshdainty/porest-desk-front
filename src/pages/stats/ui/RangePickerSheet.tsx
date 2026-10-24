import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ModalShell } from "@/shared/ui/groo/dialogs";
import { ModalFooter } from "@/shared/ui/groo/modal-footer";
import { InputDatePicker } from "@/shared/ui/input-date-picker";
import {
  monthRangeOf,
  quarterRangeOf,
  yearRangeOf,
  type RangeState,
  type SegMode,
} from "./stats-range";

// ───────────────────────────────────────────────────────────
// RangePickerSheet — 직접 기간 선택 모달.
// - quick chip: 최근 7일/30일/3개월/6개월/1년 (클릭 시 from/to 자동 set)
// - 시작 / 종료 InputDatePicker (수동 조정 가능)
// - 적용 버튼: 확정 후 confirm
// ───────────────────────────────────────────────────────────
const QUICK_RANGES: { labelKey: string; days: number }[] = [
  { labelKey: "picker.last7d", days: 7 },
  { labelKey: "picker.last30d", days: 30 },
  { labelKey: "picker.last3m", days: 90 },
  { labelKey: "picker.last6m", days: 180 },
  { labelKey: "picker.last1y", days: 365 },
];

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISODate = (s: string | undefined): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

export function RangePickerSheet({
  mobile,
  initial,
  onCancel,
  onConfirm,
}: {
  mobile: boolean;
  initial: RangeState;
  onCancel: () => void;
  onConfirm: (range: RangeState) => void;
}) {
  const { t } = useTranslation("stats");
  const [segMode, setSegMode] = useState<SegMode>(initial.segMode);
  const [from, setFrom] = useState<Date>(initial.from);
  const [to, setTo] = useState<Date>(initial.to);
  const canApply = from.getTime() <= to.getTime();
  // segMode 변경 시 — 월/분기/년 의 from/to 자동 계산 (이번 month/quarter/year)
  // custom 은 기존 from/to 유지.
  const setSeg = (v: SegMode) => {
    setSegMode(v);
    const now = new Date();
    if (v === "m") {
      const r = monthRangeOf(now);
      setFrom(r.from);
      setTo(r.to);
    } else if (v === "q") {
      const r = quarterRangeOf(now);
      setFrom(r.from);
      setTo(r.to);
    } else if (v === "y") {
      const r = yearRangeOf(now);
      setFrom(r.from);
      setTo(r.to);
    }
  };

  const applyQuick = (days: number) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days + 1);
    setFrom(start);
    setTo(today);
    setSegMode("custom");
  };

  // 가계부 FilterDialog 패턴 정합 — 상단 ToggleGroup (월/분기/년/직접) + 항상 date range
  // + custom 시만 quick chips (최근 N일/N개월) 표시.
  const formBody = (
    <>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <Tabs
          value={segMode}
          onValueChange={(v) => {
            if (v) setSeg(v as SegMode);
          }}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="m" className="flex-1">
              {t("picker.segMonth")}
            </TabsTrigger>
            <TabsTrigger value="q" className="flex-1">
              {t("picker.segQuarter")}
            </TabsTrigger>
            <TabsTrigger value="y" className="flex-1">
              {t("picker.segYear")}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              {t("picker.segCustom")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          alignItems: "center",
          marginBottom: segMode === "custom" ? "var(--spacing-lg)" : 0,
        }}
      >
        <div style={{ flex: 1 }}>
          {/* 다 친 날짜만 받는다 — 미완성 값을 버리던 탓에 키보드로는 한 글자도 안 쳐졌다. */}
          <InputDatePicker
            commitOnComplete
            value={toISODate(from)}
            onValueChange={(v) => {
              const d = fromISODate(v);
              if (d) {
                setFrom(d);
                setSegMode("custom");
              }
            }}
          />
        </div>
        <span style={{ color: "var(--fg-tertiary)" }}>~</span>
        <div style={{ flex: 1 }}>
          <InputDatePicker
            commitOnComplete
            value={toISODate(to)}
            onValueChange={(v) => {
              const d = fromISODate(v);
              if (d) {
                setTo(d);
                setSegMode("custom");
              }
            }}
          />
        </div>
      </div>
      {segMode === "custom" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-sm)",
          }}
        >
          {QUICK_RANGES.map((q) => (
            <button
              key={q.days}
              type="button"
              onClick={() => applyQuick(q.days)}
              style={{
                padding: "var(--spacing-xs) var(--spacing-md)",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                fontSize: "var(--text-caption)",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "var(--fg-secondary)",
              }}
            >
              {t(q.labelKey)}
            </button>
          ))}
        </div>
      )}
    </>
  );

  // 껍데기는 ModalShell 하나가 맡는다 — 모바일 Drawer / 데스크탑·태블릿 Dialog 분기,
  // 우상단 X, 뒤로가기 닫기(QA #129)가 전부 거기 있다. footer 버튼도 표준 위젯을 쓴다 —
  // 손으로 놓으면 size 를 빠뜨려 36 이 나온다(spec dialog.md footer).
  return (
    <ModalShell
      title={t("picker.title")}
      onClose={onCancel}
      mobile={mobile}
      size="sm"
      footer={
        <ModalFooter
          onCancel={onCancel}
          onSave={() => canApply && onConfirm({ from, to, segMode })}
          saveLabel={t("picker.apply")}
          saveDisabled={!canApply}
        />
      }
    >
      {formBody}
    </ModalShell>
  );
}
