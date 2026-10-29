import type * as React from "react";

/** 툴팁 줄 "■ 라벨 값" — 색 네모 8(모서리 2) ↔ 라벨 6 · 라벨 13 fg-neutral-muted ↔ 값(12 이상) · 값 13 · 700 · fg-neutral · 고정폭 숫자(오른쪽) */
export function ChartTooltipRow({
  swatch,
  name,
  value,
}: {
  swatch: string | undefined;
  name: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div
      data-slot="chart-tooltip-row"
      className="flex items-center gap-x1_5 text-t3"
    >
      <span
        aria-hidden
        data-slot="chart-tooltip-swatch"
        className="size-[8px] shrink-0 rounded-[2px]"
        style={{ background: swatch }}
      />
      <span data-slot="chart-tooltip-label" className="text-fg-neutral-subtle">
        {name}
      </span>
      <span
        data-slot="chart-tooltip-value"
        className="ml-auto pl-x3 font-bold tabular-nums text-fg-neutral"
      >
        {value}
      </span>
    </div>
  );
}
