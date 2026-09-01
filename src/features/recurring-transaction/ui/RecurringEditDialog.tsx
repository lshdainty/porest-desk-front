import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Calendar, Zap } from "lucide-react";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter } from "@/shared/ui/porest/modal-footer";
import { Input } from "@/shared/ui/input";
import { InputTimePicker } from "@/shared/ui/input-time-picker";
import { InputDatePicker } from "@/shared/ui/input-date-picker";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Switch } from "@/shared/ui/switch";
import { money } from "@/shared/lib/porest/format";
import { parseLocalDate } from "@/shared/lib/date";
import {
  addYears,
  formatKoreanMonthDay,
  previewNextDates,
} from "@/features/recurring-transaction/lib/recurring-date";
import { renderIcon, tileRadius } from "@/shared/lib";
import { useUpdateRecurringTransaction } from "@/features/recurring-transaction";
import { useExpenseCategories } from "@/features/expense";
import type {
  RecurringFrequency,
  RecurringTransaction,
  RecurringTransactionFormValues,
} from "@/entities/recurring-transaction";
import { getPaletteByColor } from "@/shared/lib/porest/chart-palette";

const FREQS: { v: RecurringFrequency; lKey: string }[] = [
  { v: "DAILY", lKey: "freq.DAILY" },
  { v: "WEEKLY", lKey: "freq.WEEKLY" },
  { v: "MONTHLY", lKey: "freq.MONTHLY" },
  { v: "YEARLY", lKey: "freq.YEARLY" },
];

const DOW_LABEL = [
  "dow.sun",
  "dow.mon",
  "dow.tue",
  "dow.wed",
  "dow.thu",
  "dow.fri",
  "dow.sat",
];

type EndMode = "NONE" | "COUNT" | "DATE";

type Props = {
  recurring: RecurringTransaction;
  onClose: () => void;
  onSaved?: () => void;
  mobile: boolean;
};

export function RecurringEditDialog({
  recurring,
  onClose,
  onSaved,
  mobile,
}: Props) {
  const { t } = useTranslation("recurring");
  const updateMut = useUpdateRecurringTransaction();
  const categoriesQ = useExpenseCategories();
  const category = (categoriesQ.data ?? []).find(
    (c) => c.rowId === recurring.categoryRowId,
  );
  const palette = getPaletteByColor(category?.color);

  const startDay = recurring.startDate.slice(0, 10);
  const baseDate = parseLocalDate(startDay);
  const baseDom = baseDate ? baseDate.getDate() : 1;
  // backend stores ISO 1=월~7=일; UI uses 0=일~6=토
  const initialDow =
    recurring.dayOfWeek != null
      ? recurring.dayOfWeek === 7
        ? 0
        : recurring.dayOfWeek
      : baseDate
        ? baseDate.getDay()
        : 1;

  const [frequency, setFrequency] = useState<RecurringFrequency>(
    recurring.frequency,
  );
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDow);
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    recurring.dayOfMonth ?? Math.min(31, baseDom),
  );

  const initialEndMode: EndMode = recurring.maxOccurrences
    ? "COUNT"
    : recurring.endDate
      ? "DATE"
      : "NONE";
  const [endMode, setEndMode] = useState<EndMode>(initialEndMode);
  const [endCount, setEndCount] = useState<string>(
    recurring.maxOccurrences ? String(recurring.maxOccurrences) : "12",
  );
  const [endDate, setEndDate] = useState<string>(
    recurring.endDate ?? addYears(startDay, 1),
  );

  // 실행 시각 'HH:mm' — 이 시각으로 실행분이 만들어진다. 서버 기본값은 09:00.
  const [executionTime, setExecutionTime] = useState<string>(
    (recurring.executionTime ?? "09:00:00").slice(0, 5),
  );

  // 편집 금액 — 여기서 바꾼 값은 **앞으로 생성될 실행분**부터 적용된다.
  // 이미 만들어진 거래는 별도 레코드라 소급되지 않는다.
  const [amount, setAmount] = useState<string>(
    String(Math.abs(recurring.amount)),
  );

  const [autoLog, setAutoLog] = useState<boolean>(recurring.autoLog);
  const [notifyDayBefore, setNotifyDayBefore] = useState<boolean>(
    recurring.notifyDayBefore,
  );

  const nextDates = useMemo(
    () => previewNextDates(startDay, frequency, dayOfWeek, dayOfMonth, 3),
    [startDay, frequency, dayOfWeek, dayOfMonth],
  );

  const submitting = updateMut.isPending;
  const ready =
    !!startDay &&
    // 0 을 저장하면 앞으로의 실행분이 전부 0원이 된다.
    Number(amount) > 0 &&
    (endMode !== "COUNT" || Number(endCount) > 0) &&
    (endMode !== "DATE" || !!endDate);

  const handleSave = () => {
    if (!ready) return;
    const data: RecurringTransactionFormValues = {
      categoryRowId: recurring.categoryRowId ?? undefined,
      assetRowId: recurring.assetRowId ?? undefined,
      sourceExpenseRowId: recurring.sourceExpenseRowId ?? undefined,
      expenseType: recurring.expenseType,
      amount: Number(amount),
      executionTime: `${executionTime}:00`,
      description: recurring.description ?? undefined,
      merchant: recurring.merchant ?? undefined,
      paymentMethod: recurring.paymentMethod ?? undefined,
      frequency,
      intervalValue: recurring.intervalValue ?? 1,
      dayOfWeek:
        frequency === "WEEKLY" ? (dayOfWeek === 0 ? 7 : dayOfWeek) : undefined,
      dayOfMonth:
        frequency === "MONTHLY" || frequency === "YEARLY"
          ? dayOfMonth
          : undefined,
      startDate: startDay,
      endDate: endMode === "DATE" ? endDate : undefined,
      maxOccurrences: endMode === "COUNT" ? Number(endCount) : undefined,
      autoLog,
      notifyDayBefore,
    };
    updateMut.mutate(
      { id: recurring.rowId, data },
      {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
      },
    );
  };

  const Footer = (
    <ModalFooter
      onSave={handleSave}
      saveLabel={t("saveLabel")}
      saving={submitting}
      saveDisabled={!ready}
      onCancel={onClose}
    />
  );

  const title =
    recurring.merchant ||
    recurring.description ||
    recurring.categoryName ||
    t("defaultTitle");
  const isExpense = recurring.expenseType === "EXPENSE";

  return (
    <ModalShell
      title={t("settingsTitle")}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <p
        style={{
          fontSize: "var(--text-label-sm)",
          color: "var(--fg-secondary)",
          margin: "0 0 14px",
          lineHeight: "1.5",
        }}
      >
        {t("intro")}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 14px",
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: tileRadius(38),
            background: palette.bg,
            color: palette.color,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderIcon(
            category?.icon ?? "tag",
            category?.categoryName?.charAt(0) ?? "·",
            18,
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--text-label-sm)",
              fontWeight: "700",
              color: "var(--fg-primary)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-tertiary)",
              marginTop: 2,
            }}
          >
            {t("startsOn", { date: startDay })}
          </div>
        </div>
        <div
          className="num"
          style={{ fontWeight: "800", color: "var(--fg-primary)" }}
        >
          {isExpense ? "−" : "+"}
          {money(Math.abs(recurring.amount))}
        </div>
      </div>

      {/* 금액 — 편집에서 고칠 수 있다. 구독료가 오르면 지우고 새로 만들 필요 없이
          여기서 바꾼다. 바뀐 값은 앞으로 생성될 실행분부터 적용된다(사용자 결정). */}
      <Section title={t("amountTitle")}>
        <Input
          className="num"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder="0"
          style={{
            fontWeight: 700,
            color: isExpense ? "var(--fg-expense)" : "var(--fg-income)",
          }}
        />
      </Section>

      <Section title={t("frequencyTitle")}>
        <Tabs
          value={frequency}
          onValueChange={(v) => v && setFrequency(v as RecurringFrequency)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            {FREQS.map((o) => (
              <TabsTrigger key={o.v} value={o.v} className="flex-1">
                {t(o.lKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Section>

      {frequency === "WEEKLY" && (
        <Section title={t("dowTitle")}>
          <ToggleGroup
            type="single"
            size="sm"
            value={String(dayOfWeek)}
            onValueChange={(v) => v && setDayOfWeek(Number(v))}
            className="grid w-full grid-cols-7 gap-1.5"
          >
            {DOW_LABEL.map((label, i) => (
              <ToggleGroupItem
                key={i}
                value={String(i)}
                className="rounded-full"
              >
                {t(label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>
      )}

      {frequency === "MONTHLY" && (
        <Section title={t("dayOfMonthTitle")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "var(--text-label-sm)",
                color: "var(--fg-secondary)",
              }}
            >
              {t("monthDayPrefix")}
            </span>
            <Input
              className="num"
              value={dayOfMonth}
              onChange={(e) => {
                const n = Math.min(
                  31,
                  Math.max(
                    1,
                    Number(e.target.value.replace(/[^0-9]/g, "")) || 1,
                  ),
                );
                setDayOfMonth(n);
              }}
              inputMode="numeric"
              style={{ width: 64, textAlign: "center" }}
            />
            <span
              style={{
                fontSize: "var(--text-label-sm)",
                color: "var(--fg-secondary)",
              }}
            >
              {t("monthDaySuffix")}
            </span>
            <span
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
                marginLeft: 8,
              }}
            >
              {t("monthDayHint")}
            </span>
          </div>
        </Section>
      )}

      {/* 실행 시각 — 이 시각으로 실행분이 만들어진다. 예전에는 09:00 고정이었고
          서버 컬럼 기본값도 09:00 이라 안 고르면 지금과 같다.
          자리는 앱 드로어와 맞춘다(주기 다음, 종료 앞). */}
      <Section title={t("executionTimeTitle")}>
        <InputTimePicker
          value={executionTime}
          onValueChange={setExecutionTime}
        />
      </Section>

      <Section title={t("endTitle")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <RadioCard
            selected={endMode === "NONE"}
            onSelect={() => setEndMode("NONE")}
            title={t("endNone")}
            sub={t("endNoneSub")}
          />
          <RadioCard
            selected={endMode === "COUNT"}
            onSelect={() => setEndMode("COUNT")}
            title={t("endCountTitle")}
            sub={
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {t("totalPrefix")}
                <Input
                  className="num"
                  value={endCount}
                  onChange={(e) =>
                    setEndCount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setEndMode("COUNT");
                  }}
                  inputMode="numeric"
                  style={{ width: 64, textAlign: "center", padding: "4px 8px" }}
                />
                {t("timesSuffix")}
              </span>
            }
          />
          <RadioCard
            selected={endMode === "DATE"}
            onSelect={() => setEndMode("DATE")}
            title={t("endDateTitle")}
            sub={
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setEndMode("DATE");
                }}
                style={{ marginTop: 6 }}
              >
                <InputDatePicker value={endDate} onValueChange={setEndDate} />
              </div>
            }
          />
        </div>
      </Section>

      <Section title={t("optionsTitle")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ToggleRow
            Icon={Zap}
            title={t("autoLog")}
            sub={t("autoLogSub")}
            value={autoLog}
            onChange={setAutoLog}
          />
          <ToggleRow
            Icon={Bell}
            title={t("notifyDayBefore")}
            sub={t("notifyDayBeforeSub")}
            value={notifyDayBefore}
            onChange={setNotifyDayBefore}
          />
        </div>
      </Section>

      {nextDates.length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Calendar size={13} />
            <span
              style={{ fontSize: "var(--text-caption)", fontWeight: "700" }}
            >
              {t("nextDatesTitle")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {nextDates.map((d, i) => (
              <span
                key={i}
                className="num"
                style={{
                  padding: "4px 10px",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "var(--text-caption)",
                  fontWeight: "600",
                }}
              >
                {formatKoreanMonthDay(d)}
              </span>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: "var(--text-caption)",
          fontWeight: "700",
          color: "var(--fg-secondary)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function RadioCard({
  selected,
  onSelect,
  title,
  sub,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  sub?: React.ReactNode;
}) {
  return (
    <div
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        background: selected ? "var(--bg-brand-subtle)" : "var(--bg-surface)",
        border: `1px solid ${selected ? "var(--fg-income)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <span
        aria-hidden
        style={{
          marginTop: 2,
          width: 16,
          height: 16,
          borderRadius: "var(--radius-pill)",
          border: `2px solid ${selected ? "var(--fg-income)" : "var(--border-default)"}`,
          background: selected ? "var(--fg-income)" : "transparent",
          boxShadow: selected ? "inset 0 0 0 3px var(--bg-surface)" : "none",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-body-sm)",
            fontWeight: "700",
            color: "var(--fg-primary)",
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontSize: "var(--text-caption)",
              color: "var(--fg-secondary)",
              marginTop: 4,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  Icon,
  title,
  sub,
  value,
  onChange,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  sub: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "12px 14px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-md)",
          background: "var(--bg-sunken)",
          color: "var(--fg-secondary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-body-sm)", fontWeight: "700" }}>
          {title}
        </div>
        <div
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--fg-tertiary)",
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

// addYears · formatKoreanMonthDay · previewNextDates 는 './recurring-date' 공용을 쓴다 —
// 예전에 여기 있던 복사본은 UTC 왕복 버그까지 함께 복제돼 한쪽만 고치면 갈라졌다.
