import type { ReactNode } from "react";
import { Delta } from "@/shared/ds/card";
import { withCommaBreaks } from "@/shared/ds/i18n";
import { List, ListButtonItem, ListItem } from "@/shared/ds/list";
import { Skeleton } from "@/shared/ds/skeleton";
import { cn } from "@/shared/lib/cn";
import { formatChangeRate } from "@/shared/lib/groo/format";

/*
 * 폰 증권 화면의 공용 조각(I-13 10 ~ 12) — 목록 줄 · 증감 · 기다림 줄. 증권사와 무관하다.
 * 줄은 ds List 누르는 줄(위아래 12 · 좌우 24, 맞춤 가운데), 앞에는 아무것도 두지 않는다(1T-다).
 */

/**
 * 등락률 — ▲/▼ + "12.23%"(R14 t3 · 500). 부호 +/− 와 화살표를 함께 쓰지 않는다.
 * 0.00% 는 화살표 없이 fg-neutral-subtle 로 "0.00%".
 */
export function PctDelta({
  pct,
  className,
}: {
  pct: number | null;
  className?: string;
}) {
  if (pct == null || !Number.isFinite(pct))
    return (
      <span className={cn("text-t3 text-fg-neutral-subtle", className)}>—</span>
    );
  const body = formatChangeRate(pct, { sign: "none" });
  const zero = Number(body.replace(/[%,]/g, "")) === 0;
  if (zero)
    return (
      <span
        className={cn(
          "text-t3 font-medium tabular-nums text-fg-neutral-subtle",
          className,
        )}
      >
        {body}
      </span>
    );
  return (
    <Delta
      direction={pct > 0 ? "up" : "down"}
      value={body}
      className={className}
    />
  );
}

/**
 * 증감 글 — ▲/▼ + "금액 · 퍼센트" 를 방향 색으로(▲ fg-critical · ▼ fg-informative, 0 이면 화살표 없이 fg-neutral-subtle).
 * 키-값 줄 값(t5 · 700)이면 `strong`, 줄 아래 보조(t3 · 500)면 기본.
 */
export function DeltaText({
  dir,
  text,
  strong,
}: {
  dir: "up" | "down" | "flat";
  text: string;
  strong?: boolean;
}) {
  const arrow = dir === "up" ? "▲ " : dir === "down" ? "▼ " : "";
  const tone =
    dir === "up"
      ? "text-fg-critical"
      : dir === "down"
        ? "text-fg-informative"
        : "text-fg-neutral-subtle";
  return (
    <span
      className={cn(
        "tabular-nums",
        strong ? "text-t5 font-bold" : "text-t3 font-medium",
        tone,
      )}
    >
      {arrow}
      {text}
    </span>
  );
}

/** 줄 뒤 두 줄 — 위 금액 R13(t5 · 700 · 고정폭 · 쉼표 뒤 줄바꿈), 아래 2 에 증감 */
export function LineValue({
  amount,
  delta,
}: {
  amount: ReactNode;
  delta?: ReactNode;
}) {
  return (
    <span className="flex max-w-[60cqw] flex-col items-end">
      <span className="text-end text-t5 font-bold tabular-nums text-fg-neutral">
        {typeof amount === "string" ? withCommaBreaks(amount) : amount}
      </span>
      {delta != null && <span className="mt-x0_5">{delta}</span>}
    </span>
  );
}

/**
 * 종목 줄 — 제목 종목 이름(줄바꿈), 설명 한 줄 말줄임, 뒤 금액 + 증감. 누르면 `onClick`.
 * 값이 없으면 "—". 순위 줄은 `rank` 를 준다(앞 숫자 폭 20 · 셋째까지 fg-brand).
 */
export function StockLine({
  name,
  detail,
  amount,
  pct,
  rank,
  onClick,
}: {
  name: string;
  detail?: string;
  /** 이미 만든 금액 글(가리기 · 통화 반영) — 없으면 "—" */
  amount: ReactNode | null;
  pct: number | null;
  rank?: number;
  onClick: () => void;
}) {
  return (
    <ListButtonItem
      title={name}
      detail={detail ? <span className="truncate">{detail}</span> : undefined}
      prefix={
        rank != null ? (
          <span
            className={cn(
              "w-5 text-start text-t4 font-bold tabular-nums",
              rank <= 3 ? "text-fg-brand" : "text-fg-neutral-subtle",
            )}
          >
            {rank}
          </span>
        ) : undefined
      }
      suffix={
        <LineValue amount={amount ?? "—"} delta={<PctDelta pct={pct} />} />
      }
      onClick={onClick}
    />
  );
}

/** 목록 줄 기다림 — 제목 · 설명 · 오른쪽 두 줄(줄 높이 그대로) */
export function LineSkeletons({
  rows = 5,
  label,
}: {
  rows?: number;
  label: string;
}) {
  return (
    <List aria-busy aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <ListItem
          key={i}
          title={<Skeleton text="t5" className="w-2/5" />}
          detail={<Skeleton text="t3" className="mt-x0_5 w-1/4" />}
          suffix={
            <span className="flex flex-col items-end">
              <Skeleton text="t5" className="w-20" />
              <Skeleton text="t3" className="mt-x0_5 w-12" />
            </span>
          }
        />
      ))}
    </List>
  );
}

/** 구역 제목 — 띠 제목 h2(R4 t5 · 700 · 위 24 · 좌우 24 · 아래 4) */
export function BandTitle({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="m-0 px-x6 pb-x1 pt-x6 text-t5 font-bold text-fg-neutral"
    >
      {children}
    </h2>
  );
}

/** 목록 맨 끝 출처 한 줄 — R10 t3 · fg-neutral-subtle · 위 8 · 좌우 24 · 띠 끝 24 */
export function SourceLine({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 px-x6 pb-x6 pt-x2 text-t3 text-fg-neutral-subtle">
      {children}
    </p>
  );
}
