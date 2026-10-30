import type { ReactNode } from "react";
import { PageHead } from "@/shared/ui/groo/page-head";
import { ParentLink } from "@/shared/ui/groo/parent-link";
import { cn } from "@/shared/lib/cn";

/*
 * 증권 데스크톱 · 태블릿 틀(I-13 26 · 27 · 33 · 34) — 본문 위 20 · 좌우 32 · 아래 56, 최대 폭 768 ~ 1279 720 · 1280 이상 1040 가운데.
 * 제목 줄(PageHead h1) 아래 24 에 카드. 1280 이상은 2 : 1 두 열(칸 사이 24), 미만은 한 칸 — 쌓은 카드는 늘 8.
 * 카드 순서는 한 칸일 때의 순서(`order`)가 정하고, 1280 이상에서는 칸(`left` · `right`)이 정한다. 칸 안의 순서도 `order` 를 따른다.
 */

export function DeskFrame({
  slot,
  title,
  parent,
  children,
  source,
}: {
  slot: string;
  title: string;
  /** 하위 화면의 "‹ {부모}" — 제목 줄 위(단추 ↔ 제목 줄 4). 목록 화면에는 없다 */
  parent?: { to: string; label: string };
  children: ReactNode;
  /** 마지막 카드 아래 출처 한 줄(위 16 · 좌우 0) */
  source?: ReactNode;
}) {
  return (
    <div
      data-slot={slot}
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto w-full max-w-[var(--layout-max-low)] lg:max-w-[var(--layout-max-medium)]">
        {parent && (
          <div className="mb-x1">
            <ParentLink to={parent.to} label={parent.label} />
          </div>
        )}
        <PageHead title={title} style={{ marginBottom: "var(--spacing-x6)" }} />
        {children}
        {source != null && (
          <p
            data-slot="stocks-source"
            className="m-0 mt-x4 text-t3 text-fg-neutral-subtle"
          >
            {source}
          </p>
        )}
      </div>
    </div>
  );
}

/** 2 : 1 격자 — 한 칸(768 ~ 1279)에서는 카드가 `order` 순서로 쌓인다(8). 칸 상자는 한 칸일 때 사라진다(`contents`) */
export function DeskColumns({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div
      data-slot="stocks-columns"
      className="flex flex-col gap-x2 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-[var(--layout-gutter)]"
    >
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-x2">
        {left}
      </div>
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-x2">
        {right}
      </div>
    </div>
  );
}

const ORDER = [
  "order-1",
  "order-2",
  "order-3",
  "order-4",
  "order-5",
  "order-6",
  "order-7",
  "order-8",
] as const;

/** 카드 자리 — `order` 는 한 칸일 때 순서(1부터) 이고, 같은 값이 칸 안 순서도 정한다 */
export function DeskSlot({
  order,
  slot,
  className,
  children,
}: {
  order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  slot: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-slot={slot}
      className={cn("min-w-0", ORDER[order - 1], className)}
    >
      {children}
    </div>
  );
}
