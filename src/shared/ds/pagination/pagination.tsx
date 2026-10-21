import * as React from "react";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import {
  PAGINATION_CELL,
  PAGINATION_CELL_CURRENT,
  PAGINATION_CELL_DISABLED,
  PAGINATION_CELL_DISABLED_CURRENT,
  PAGINATION_CELL_ENABLED,
  PAGINATION_CELL_OTHER,
  PAGINATION_ELLIPSIS,
  PAGINATION_EMPTY,
  PAGINATION_LABEL,
  PAGINATION_ROOT,
  PAGINATION_ROW,
  formatNumber,
  paginationItems,
  type PaginationChangeReason,
  type PaginationItem,
} from "./pagination-variants";
import { usePaginationSlots } from "./use-pagination-slots";
import { useDsText } from "@/shared/ds/i18n";

/*
 * Groo Pagination — 구조는 SEED Pagination(2026-10-04). 수치 원본은 groo-design specs/components/pagination.yaml(값은
 * src/shared/ds/spec/pagination.json). groo-design recipes/shadcn/components/ui/pagination.tsx 를 첫 판으로 가져왔다 — 모양 · 칸 배열
 * 규칙은 pagination-variants.ts, 칸 수 훅은 use-pagination-slots.ts 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 * 옛 Pagination(shadcn — 지금 쪽 테두리 · 칸 사이 4 · 이전 · 다음 글자)을 대신한다. 폰의 끝없이 불러오기(InfiniteListEnd —
 * infinite-list.yaml)는 이 컴포넌트가 아니라 그 스펙의 몫이라 여기에 두지 않았다.
 *
 *   Pagination        데스크톱(768 이상) 목록 아래 가운데의 넘김 줄 — <nav aria-label="페이지 탐색">
 *     totalPages      전체 쪽 수 — 1 이하면 그리지 않는다
 *     page · defaultPage(1) · onPageChange(page, { reason })   reason "page-item" · "previous" · "next"
 *     getHref(page)   주면 칸이 링크(<a>) — 쪽이 주소(?page=3)에 있을 때. 없으면 <button type="button">
 *     scrollTarget    목록 상자 — 쪽이 바뀌면 그 위 끝이 보이게 스크롤한다
 *     disabled        목록을 다시 받는 동안 — 넘기지 않는다(두 번 넘기지 않게)
 *     aria-label      기본 "페이지 탐색" — 목록이 둘 이상이면 "카드 혜택 페이지 탐색" 처럼
 *   paginationItems(page, totalPages, slots)   칸 배열을 돌려주는 규칙 함수(앱도 같은 규칙) — pagination-variants.ts
 *
 * 칸 수 — 화면 폭으로 고정이다(sm 480): 480 이상 9칸 · 미만 7칸(화살표 둘 포함). 쪽이 바뀌어도 줄의 폭과 칸 자리는
 *   그대로이고 생략(…)만 옮겨 간다. 전체 쪽이 칸 수보다 적으면 모든 번호를 보인다(SEED usePagination 과 같은 식).
 *     9칸  앞쪽(지금 ≤ 4)   ‹ 1 2 3 4 5 … N ›   가운데   ‹ 1 … p−1 p p+1 … N ›   뒤쪽(지금 ≥ N−3)   ‹ 1 … N−4 N−3 N−2 N−1 N ›
 *     7칸  앞쪽(지금 ≤ 3)   ‹ 1 2 3 4 … ›       가운데   ‹ … p−1 p p+1 … ›       뒤쪽(지금 ≥ N−2)   ‹ … N−3 N−2 N−1 N ›
 *   7칸의 가운데 구간에는 첫 · 마지막 번호가 없다(SEED). 첫 쪽의 이전 · 마지막 쪽의 다음 자리는 40 빈 칸(보조 기술에 숨긴다).
 *
 * 쪽을 넘기면 — 목록(scrollTarget)의 위 끝이 보이게 스크롤하고, 숨은 상태 글(role="status")로 "N페이지, 전체 M페이지" 를 한 번 알린다.
 *   초점은 누른 칸에 남는다 — 번호를 눌렀으면 그 쪽 번호(칸 자리가 바뀌어도 따라간다), 화살표를 눌렀으면 그 화살표.
 *   끝 쪽에 닿아 누르던 화살표가 빈 칸이 되면 초점을 지금 쪽 번호로 옮긴다(초점이 화면 맨 앞으로 떨어지지 않게 — SEED 는 body 로 떨어진다).
 *   누를 때 초점이 이 줄 밖에 있었으면(초점을 주지 않는 브라우저의 마우스 누르기) 옮기지 않는다.
 * 링크(getHref) — 새 탭 · 수정 키 누르기는 브라우저에 맡긴다. 그냥 누르기는 onPageChange 를 주었으면 그쪽으로 넘기고(라우터가 주소를
 *   바꾸는 자리 — 링크의 기본 이동은 막는다), 주지 않았으면 브라우저가 그 주소로 간다. 지금 쪽 · 막힌 줄은 눌러도 아무것도 하지 않는다.
 * 막힘(disabled) — 칸은 aria-disabled 로 남긴다(초점이 그 자리를 잃지 않게). 번호 · 화살표 fg-disabled, 지금 쪽은 bg-disabled.
 *
 * 레시피와 다른 자리 — 효과 안 setState 를 걷었다: 알림 글은 쪽이 바뀐 렌더에서 바꾼다(저장해 둔 이전 쪽과 견주는 렌더 중 갱신).
 * 스크롤 · 초점 옮기기는 효과에 남겼다(DOM 만 만진다). 칸 수 훅은 matchMedia 가 없으면 7칸.
 *
 * 모양: 칸 40 × 40 을 사이 없이 잇는다(9칸 360 · 7칸 280), 목록 끝 → 줄 24, 가운데. 번호 t4 14 / 19 · 700 · fg-neutral · 숫자 폭 고정 ·
 *   세 자리마다 쉼표, 칸을 넘으면 말줄임(숫자는 칸 이름에 있다). 화살표는 아이콘만 16(chevron). 생략은 40 상자 + 점 셋 16. 모서리 r2 8.
 *   지금 쪽은 짙은 채움 bg-neutral-inverted + fg-neutral-inverted(다크는 밝은 반전) — 브랜드 색이 아니다. aria-current="page".
 *   누르는 영역은 위아래만 44(보이지 않는 여백 2 씩), 옆은 칸 폭 40 — v106 "누르는 영역 44" 의 예외(사용자 결정 2026-10-04).
 * 상태: 호버(웹) · 누름 bg-layer-default-pressed(지금 쪽은 bg-neutral-inverted-pressed), 누르면 2px 거리 축소(40 → 0.95 — 모션 줄이기면
 *   하지 않는다), 키보드 포커스에만 칸 바깥 2px 링(띄움 2 — 붙은 이웃 칸 위에 그린다).
 * 이름: 줄 "페이지 탐색", 칸 "N페이지", 화살표 "이전 페이지" · "다음 페이지"(SEED 문구) — 생략 · 빈 칸은 aria-hidden.
 */

export interface PaginationChangeDetails {
  reason: PaginationChangeReason;
}

export interface PaginationProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onChange" | "children"
> {
  /** 전체 쪽 수 — 1 이하면 그리지 않는다 */
  totalPages: number;
  /** 지금 쪽(1부터) — 주면 제어한다 */
  page?: number;
  /** 처음 쪽 — 기본 1 */
  defaultPage?: number;
  /** 쪽이 바뀔 때 — reason "page-item" · "previous" · "next" */
  onPageChange?: (page: number, details: PaginationChangeDetails) => void;
  /** 주면 칸이 링크 — 쪽이 주소에 있을 때(`(p) => \`?page=${p}\``) */
  getHref?: (page: number) => string;
  /** 목록 상자 — 쪽이 바뀌면 그 위 끝이 보이게 스크롤한다 */
  scrollTarget?: React.RefObject<HTMLElement | null>;
  /** 목록을 다시 받는 동안 — 넘기지 않는다 */
  disabled?: boolean;
  /** 기본 "페이지 탐색" */
  "aria-label"?: string;
}

type FocusIntent = { kind: "page" } | { kind: "previous" | "next" };
type Pending = { page: number; focus: FocusIntent | null };

// 링크를 새 탭 · 새 창으로 여는 누르기 — 브라우저에 맡긴다
const isModifiedClick = (e: React.MouseEvent) =>
  e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      totalPages,
      page: pageProp,
      defaultPage = 1,
      onPageChange,
      getHref,
      scrollTarget,
      disabled = false,
      "aria-label": ariaLabelProp,
      className,
      ...props
    },
    ref,
  ) => {
    const dsT = useDsText();
    const ariaLabel = ariaLabelProp ?? dsT("pagination.label");
    const slots = usePaginationSlots();
    const [inner, setInner] = React.useState(defaultPage);
    const controlled = pageProp !== undefined;
    const total = Number.isFinite(totalPages)
      ? Math.max(Math.floor(totalPages), 0)
      : 0;
    const current = Math.min(
      Math.max(Math.floor((controlled ? pageProp : inner) ?? 1), 1),
      Math.max(total, 1),
    );
    const items = paginationItems(current, total, slots);

    const rowRef = React.useRef<HTMLDivElement>(null);
    const pendingRef = React.useRef<Pending | null>(null);

    const change = (
      next: number,
      reason: PaginationChangeReason,
      focus: FocusIntent,
    ) => {
      if (disabled || next === current || next < 1 || next > total) return;
      const active = rowRef.current?.ownerDocument.activeElement ?? null;
      pendingRef.current = {
        page: next,
        focus: active && rowRef.current?.contains(active) ? focus : null,
      };
      if (!controlled) setInner(next);
      onPageChange?.(next, { reason });
    };

    // 쪽이 바뀌었다 — 알린다. 저장해 둔 이전 쪽과 다르면 렌더 중에 글을 바꾼다(처음에는 빈 채로 둔다)
    const [seenPage, setSeenPage] = React.useState(current);
    const [message, setMessage] = React.useState("");
    if (seenPage !== current) {
      setSeenPage(current);
      setMessage(
        dsT("pagination.status", {
          current: formatNumber(current),
          total: formatNumber(total),
        }),
      );
    }

    // 이 줄에서 넘겼으면 목록 맨 위로 · 초점을 누른 칸에(빈 칸이 됐으면 지금 쪽 번호에)
    const lastPageRef = React.useRef(current);
    React.useLayoutEffect(() => {
      if (lastPageRef.current === current) return;
      lastPageRef.current = current;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (!pending || pending.page !== current) return;
      scrollTarget?.current?.scrollIntoView?.({ block: "start" });
      const row = rowRef.current;
      if (!pending.focus || !row) return;
      const currentCell = row.querySelector<HTMLElement>(
        `[data-slot="pagination-item"][data-page="${current}"]`,
      );
      const target =
        pending.focus.kind === "page"
          ? currentCell
          : (row.querySelector<HTMLElement>(
              `[data-slot="pagination-${pending.focus.kind}"]`,
            ) ?? currentCell);
      if (target && row.ownerDocument.activeElement !== target)
        target.focus({ preventScroll: true });
    }, [current, total, scrollTarget]);

    if (total <= 1) return null;

    const renderCell = (item: PaginationItem, index: number) => {
      if (item.type === "ellipsis") {
        return (
          <span
            key={index}
            aria-hidden
            data-slot="pagination-ellipsis"
            className={PAGINATION_ELLIPSIS}
          >
            <Ellipsis />
          </span>
        );
      }
      if (item.type === "empty") {
        return (
          <span
            key={index}
            aria-hidden
            data-slot="pagination-empty"
            className={PAGINATION_EMPTY}
          />
        );
      }
      const isArrow = item.type === "previous" || item.type === "next";
      const isCurrent = item.type === "page" && item.page === current;
      const label =
        item.type === "previous"
          ? dsT("pagination.previous")
          : item.type === "next"
            ? dsT("pagination.next")
            : dsT("pagination.page", { page: formatNumber(item.page) });
      const reason: PaginationChangeReason =
        item.type === "page" ? "page-item" : item.type;
      const focus: FocusIntent =
        item.type === "page" ? { kind: "page" } : { kind: item.type };
      const cellClass = cn(
        PAGINATION_CELL,
        disabled
          ? cn(
              PAGINATION_CELL_DISABLED,
              isCurrent && PAGINATION_CELL_DISABLED_CURRENT,
            )
          : cn(
              PAGINATION_CELL_ENABLED,
              isCurrent ? PAGINATION_CELL_CURRENT : PAGINATION_CELL_OTHER,
            ),
      );
      const common = {
        "aria-label": label,
        "aria-current": isCurrent ? ("page" as const) : undefined,
        "aria-disabled": disabled || undefined,
        "data-slot": isArrow ? `pagination-${item.type}` : "pagination-item",
        "data-page": item.page,
        "data-current": isCurrent || undefined,
        className: cellClass,
      };
      const content = isArrow ? (
        item.type === "previous" ? (
          <ChevronLeft aria-hidden className="size-4" />
        ) : (
          <ChevronRight aria-hidden className="size-4" />
        )
      ) : (
        <span data-slot="pagination-label" className={PAGINATION_LABEL}>
          {formatNumber(item.page)}
        </span>
      );
      if (getHref) {
        return (
          <a
            key={index}
            href={getHref(item.page)}
            {...common}
            onClick={(e) => {
              if (disabled || isCurrent) {
                e.preventDefault();
                return;
              }
              if (isModifiedClick(e)) return;
              // onPageChange 가 있으면 라우터가 옮긴다 — 링크의 기본 이동은 막는다. 없으면 브라우저가 그 주소로 간다
              if (onPageChange || !controlled) {
                if (onPageChange) e.preventDefault();
                change(item.page, reason, focus);
              }
            }}
          >
            {content}
          </a>
        );
      }
      return (
        <button
          key={index}
          type="button"
          {...common}
          onClick={() => !isCurrent && change(item.page, reason, focus)}
        >
          {content}
        </button>
      );
    };

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        data-slot="pagination"
        data-slots={slots}
        className={cn(PAGINATION_ROOT, className)}
        {...props}
      >
        <div ref={rowRef} data-slot="pagination-row" className={PAGINATION_ROW}>
          {items.map(renderCell)}
        </div>
        {/* 쪽이 바뀌면 한 번 알린다 — 처음부터 빈 채로 있어야 읽힌다 */}
        <span role="status" data-slot="pagination-status" className="sr-only">
          {message}
        </span>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";

export { Pagination };
