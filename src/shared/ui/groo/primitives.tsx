import {
  CATEGORIES,
  type CategoryKey,
  type Tx,
  type Account,
} from "@/shared/lib/groo/data";
import { KRW, money, isEn, formatChangeRate } from "@/shared/lib/groo/format";
import { HideUnit, MaskAmount } from "@/shared/lib/groo/hide-amounts";
import * as LucideIcons from "lucide-react";
import {
  LedgerRow,
  LedgerRowAmt,
  LedgerRowMain,
  LedgerRowSep,
  LedgerRowSub,
  LedgerRowTitle,
} from "./ledger";

type LucideIconName = keyof typeof LucideIcons;

const iconNameToPascal = (name: string): string =>
  name
    .split("-")
    .map((s) => (s[0] ?? "").toUpperCase() + s.slice(1))
    .join("");

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className = "",
  style = {},
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pascal = iconNameToPascal(name) as LucideIconName;
  const Comp = LucideIcons[pascal] as
    | React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        className?: string;
        style?: React.CSSProperties;
      }>
    | undefined;
  if (!Comp) {
    return (
      <span
        className={className}
        style={{ width: size, height: size, display: "inline-block", ...style }}
      />
    );
  }
  return (
    <Comp
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0, ...style }}
    />
  );
}

// CatIcon: data-cat 매트릭스를 컴포넌트 안 룩업으로 이전.
// 기존 .cat-ico[data-cat="..."] CSS 색상 spec 그대로 보존.
const CAT_ICO_PALETTE: Record<string, { bg: string; color: string }> = {
  food: { bg: "oklch(0.96 0.03 70)", color: "oklch(0.48 0.12 55)" },
  transport: { bg: "oklch(0.96 0.02 230)", color: "oklch(0.48 0.1 230)" },
  shopping: { bg: "oklch(0.96 0.035 340)", color: "oklch(0.48 0.12 340)" },
  cafe: { bg: "oklch(0.96 0.03 60)", color: "oklch(0.44 0.08 50)" },
  income: { bg: "var(--bg-brand-subtle)", color: "var(--fg-brand-strong)" },
  living: { bg: "oklch(0.96 0.025 135)", color: "oklch(0.48 0.1 140)" },
  medical: { bg: "oklch(0.96 0.03 25)", color: "oklch(0.52 0.13 25)" },
  leisure: { bg: "oklch(0.96 0.035 290)", color: "oklch(0.48 0.12 290)" },
  bill: {
    bg: "var(--color-chart-gray-weak)",
    color: "var(--color-chart-gray)",
  },
  edu: { bg: "oklch(0.96 0.03 210)", color: "oklch(0.5 0.1 215)" },
  saving: { bg: "var(--bg-warm-tint)", color: "var(--color-chart-brown)" },
};

const CAT_ICO_DIMS = {
  sm: { w: 32, r: 10, icon: 16 },
  md: { w: 40, r: 12, icon: 18 },
  lg: { w: 48, r: 14, icon: 22 },
} as const;

export function CatIcon({
  cat,
  size = "md",
}: {
  cat: CategoryKey;
  size?: "sm" | "md" | "lg";
}) {
  const def = CATEGORIES[cat];
  if (!def) return null;
  const dim = CAT_ICO_DIMS[size];
  const palette = CAT_ICO_PALETTE[cat] ?? {
    bg: "var(--bg-surface)",
    color: "var(--fg-secondary)",
  };
  return (
    <span
      data-cat={cat}
      style={{
        width: dim.w,
        height: dim.w,
        borderRadius: dim.r,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: palette.bg,
        color: palette.color,
      }}
    >
      <Icon name={def.icon} size={dim.icon} strokeWidth={1.9} />
    </span>
  );
}

// tx-row spec — shared/ui/groo/ledger.tsx 의 LedgerRow 계열 공용화.
export function TxRow({ tx, onClick }: { tx: Tx; onClick?: (tx: Tx) => void }) {
  const c = CATEGORIES[tx.cat];
  const isIncome = tx.amt > 0;
  return (
    <LedgerRow onClick={onClick ? () => onClick(tx) : undefined}>
      <CatIcon cat={tx.cat} />
      <LedgerRowMain as={onClick ? "button" : "div"}>
        <LedgerRowTitle>{tx.title}</LedgerRowTitle>
        <LedgerRowSub>
          <span>{c?.label}</span>
          <LedgerRowSep />
          <span>{tx.account}</span>
          {tx.time && (
            <>
              <LedgerRowSep />
              <span>{tx.time}</span>
            </>
          )}
        </LedgerRowSub>
      </LedgerRowMain>
      <div>
        <LedgerRowAmt>
          <MaskAmount
            card="ledger.txList"
            kind={isIncome ? "income" : "expense"}
          >
            {isIncome ? "+" : "-"}
            {isEn() ? "₩" : ""}
            {KRW(tx.amt, { abs: true })}
          </MaskAmount>
          <HideUnit>{isEn() ? "" : "원"}</HideUnit>
        </LedgerRowAmt>
      </div>
    </LedgerRow>
  );
}

export function Delta({
  pct,
  amt,
  small,
}: {
  pct: number;
  amt?: number;
  small?: boolean;
}) {
  const up = pct > 0;
  const color = up ? "var(--color-fg-critical)" : "var(--color-fg-informative)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color,
        fontWeight: "600",
        fontVariantNumeric: "tabular-nums",
        fontSize: small ? 11.5 : 12.5,
        letterSpacing: "-0.012em",
      }}
    >
      {up ? "▲" : "▼"} {formatChangeRate(pct, { sign: "none" })}
      {amt != null && (
        <span
          style={{
            color: "var(--fg-tertiary)",
            marginLeft: 4,
            fontWeight: "500",
          }}
        >
          ({money(amt, { abs: true })})
        </span>
      )}
    </span>
  );
}

export function BankLogo({ acc, size = 40 }: { acc: Account; size?: number }) {
  const letter = acc.bank[0];
  return (
    <span
      style={{
        background: acc.color,
        width: size,
        height: size,
        fontSize: size * 0.35,
        borderRadius: "var(--radius-tile)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        letterSpacing: "-0.022em",
        color: "var(--fg-on-brand)",
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  );
}
