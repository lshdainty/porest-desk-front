import type { ReactNode } from "react";
import { Skeleton } from "@/shared/ds/skeleton";
import { cn } from "@/shared/lib/cn";

/** 작은 달력 아래 한 줄 — 라벨(t4 · subtle) ↔ 값(700 · 고정폭 · 오른쪽 맞춤). 값이 길면 라벨 아래 줄로 내려간다 */
export function MonthKv({
  label,
  value,
  unit,
  tone,
  loading,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  tone?: "income";
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-x4 gap-y-x1 py-x2 text-t4">
      <span className="text-fg-neutral-subtle">{label}</span>
      {loading ? (
        <Skeleton text="t4" className="w-x16" />
      ) : (
        <span
          data-kv=""
          className={cn(
            "num ml-auto font-bold",
            tone === "income" ? "text-fg-brand" : "text-fg-neutral",
          )}
        >
          {value}
          {unit}
        </span>
      )}
    </div>
  );
}
