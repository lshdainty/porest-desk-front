import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib";

export type HeroStatTone = "default" | "brand" | "positive" | "negative";

interface HeroStatCardProps {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  /** Percentage delta compared to previous period */
  delta?: number | null;
  /** Whether positive delta should be rendered as good (green) or bad (red). */
  isPositiveGood?: boolean;
  tone?: HeroStatTone;
  icon?: LucideIcon;
  /** Optional right-side slot for navigation (e.g. month picker) */
  headerRight?: ReactNode;
  /** Optional sub row below the value */
  footer?: ReactNode;
  className?: string;
}

// groo status 토큰 정합 — success/error 색이 light/dark 자동 swap.
const toneStyles: Record<HeroStatTone, string> = {
  default: "bg-surface-default",
  brand:
    "bg-[var(--color-surface-hero)] bg-gradient-to-br from-[var(--color-surface-hero)] to-surface-default",
  positive: "bg-bg-positive-weak",
  negative: "bg-bg-critical-weak",
};

const toneValueStyles: Record<HeroStatTone, string> = {
  default: "text-text-primary",
  brand: "text-text-primary",
  positive: "text-fg-positive",
  negative: "text-fg-critical",
};

const toneIconStyles: Record<HeroStatTone, string> = {
  default: "bg-surface-input text-text-secondary",
  brand: "bg-bg-brand-weak text-fg-brand",
  positive: "bg-bg-positive-weak text-fg-positive",
  negative: "bg-bg-critical-weak text-fg-critical",
};

export const HeroStatCard = ({
  label,
  value,
  prefix,
  suffix,
  delta,
  isPositiveGood = true,
  tone = "default",
  icon: Icon,
  headerRight,
  footer,
  className,
}: HeroStatCardProps) => {
  const hasDelta = delta !== undefined && delta !== null;
  const deltaIsGood = hasDelta
    ? isPositiveGood
      ? delta >= 0
      : delta <= 0
    : true;
  const DeltaIcon = hasDelta && delta >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5 transition-colors",
        toneStyles[tone],
        className,
      )}
    >
      {/* Header row: label + icon + optional headerRight */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div
              className={cn("rounded-lg p-1.5 shrink-0", toneIconStyles[tone])}
            >
              <Icon size={14} />
            </div>
          )}
          <span className="text-xs sm:text-sm font-medium text-text-secondary truncate">
            {label}
          </span>
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {/* Hero value */}
      <p
        className={cn(
          "mt-2 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight leading-tight",
          toneValueStyles[tone],
        )}
      >
        {prefix}
        {value}
        {suffix}
      </p>

      {/* Delta badge + optional footer */}
      {(hasDelta || footer) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium",
                deltaIsGood
                  ? "bg-bg-positive-weak text-fg-positive"
                  : "bg-bg-critical-weak text-fg-critical",
              )}
            >
              <DeltaIcon size={12} />
              <span>{Math.abs(delta)}%</span>
            </span>
          )}
          {footer && (
            <div className="text-[11px] sm:text-xs text-text-secondary">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
