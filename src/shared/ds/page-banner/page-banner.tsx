import * as React from "react";
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";

import { pageBannerVariants } from "./page-banner-variants";

/*
 * Porest Page Banner — 구조는 SEED Page Banner(2026-10-02). 수치 원본은 porest-design
 * specs/components/page-banner.yaml(값은 src/shared/ds/spec/page-banner.json).
 * porest-design recipes/shadcn/components/ui/page-banner.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 띠 변형(cva)은
 * page-banner-variants.ts 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 페이지 맨 위(머리 바로 아래, 위에 사진이 있으면 그 아래)에 화면 폭 전체로 놓는 띠 — 그 페이지 전체의 상태를 알린다
 * (증권 연결 끊김 · Pro 만료 예정 · 새 버전). 한 화면에 하나. 그 기능 가까이의 안내는 Callout, 잠깐 알릴 결과는 Snackbar 다.
 *
 *   tone         neutral(기본) · informative · positive · warning · critical
 *   variant      weak(기본, 옅은 바탕 — bg-*-weak + fg-*-contrast, Callout 과 같은 짝) · solid(짙은 바탕 — bg-*-solid + 흰 글
 *                static-white, neutral 은 bg-neutral-inverted + fg-neutral-inverted. 연결 끊김 · 거절 · 편집 불가처럼 무거운 상태에만)
 *   interaction  display(기본, 보이기만 — 버튼 하나를 둘 수 있다) · actionable(띠 전체가 <button type="button"> + 뒤 화살표) ·
 *                dismissible(닫기 — 한 번 보면 되는 안내에만, 경고 · 오류는 닫지 못한다)
 *   title        상태를 나타내는 짧은 말(연결 끊김 · 곧 만료) — 꼭 필요할 때만
 *   children     본문 — 제목을 되풀이하지 않는다
 *   button       { label, onClick } — 동작 이름 하나("다시 연결" · "업데이트"). display 에만
 *   icon         앞 아이콘 — 주지 않으면 톤마다 lucide 선 아이콘(Callout 과 같다), null 이면 두지 않는다
 *   role         나중에 나타나는 경고 · 위험(연결이 끊김)은 role="alert"
 *
 * 띠 — 화면 폭 · 모서리 0 · 좌우 화면 여백 24(spacing-global-gutter — 띠 안 글이 페이지 글과 같은 선) · 위아래 10 · 최소 40.
 *   아이콘 16 은 위 2 를 두어 첫 줄 가운데에 붙고(여러 줄이어도 첫 줄), 아이콘 ↔ 글 8. 제목(700) · 본문(500)은 t4 한 문단
 *   (사이 띄어쓰기 두 칸). 본문과 버튼은 한 줄에 양 끝 — 안 들어가면 버튼이 다음 줄 본문 시작선으로 간다(줄 사이 6).
 *   버튼은 t3 · 700 글 버튼 — 사방 11 을 두고 바깥 −11 로 되돌려 누르는 높이 40 에 띠 높이는 그대로. 뒤 화살표 16 · 닫기는
 *   띠 가운데에 서고 글과 8. 닫기는 투명 상자 40 · 모서리 8, 바깥 −12(아이콘은 오른쪽 끝에서 24).
 * Actionable — 호버 · 누름은 그 바탕의 누름 색, 누르면 바탕은 그대로 안의 내용만 2px 거리로 준다(기준 max(높이, 폭 ÷ 4, 24)
 *   를 띠에서 누르는 순간 잰다 — SEED scaleScope: content). 버튼 · 닫기는 바탕 없이 각자 축소. 모션 줄이기면 축소하지 않는다.
 * 닫기 — 바로 걷고(모션 없음) 초점은 다음 요소로 간다(뒤에 없으면 앞 요소). open · onDismiss 로 닫음을 기억한다.
 * 포커스 링은 키보드 포커스에만 2px, 안쪽 −2 — 화면 끝까지 차는 띠라 바깥 링이 잘린다(버튼 · 닫기도 같다). 링은 띠 위에
 *   그려지므로 옅은 바탕은 stroke-focus-ring, 짙은 바탕은 띠 글자색(흰 글 · neutral 은 반전 짝)이다 — 브랜드 링은 짙은 바탕
 *   위에서 1.0 ~ 3.2:1 이라 보이지 않는다(HR 라이트는 1.0). 스낵바가 띠 글자색 링을 쓰는 것과 같은 까닭.
 */

export type PageBannerTone =
  "neutral" | "informative" | "positive" | "warning" | "critical";

export type PageBannerVariant = "weak" | "solid";

export interface PageBannerButton {
  /** 동작 이름 — "다시 연결" · "업데이트" · "구독 보기" */
  label: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

type PageBannerCommon = {
  tone?: PageBannerTone;
  /** weak(기본) · solid(무거운 상태에만) */
  variant?: PageBannerVariant;
  /** 제목 — 상태를 나타내는 짧은 말. 본문과 한 문단으로 이어진다 */
  title?: React.ReactNode;
  /** 앞 아이콘 — 주지 않으면 톤의 기본 아이콘, null 이면 두지 않는다 */
  icon?: React.ReactNode;
  /** 본문 */
  children: React.ReactNode;
};

type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title" | "children"
>;

export type PageBannerDisplayProps = PageBannerCommon &
  DivProps & {
    interaction?: "display";
    /** 글 버튼 하나 */
    button?: PageBannerButton;
    /** 닫기는 dismissible 에만 */
    open?: never;
    onDismiss?: never;
  };

export type PageBannerActionableProps = PageBannerCommon &
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "title" | "children" | "type"
  > & {
    interaction: "actionable";
    /** 띠를 누르면 하는 일 */
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    /** 띠 전체를 누르므로 버튼은 두지 않는다 */
    button?: never;
    open?: never;
    onDismiss?: never;
  };

export type PageBannerDismissibleProps = PageBannerCommon &
  DivProps & {
    interaction: "dismissible";
    /** 닫기와 버튼은 함께 두지 않는다(SEED) */
    button?: never;
    /** 보이는지 — 주면 부르는 쪽이 정한다(닫은 것을 기억해 다시 띄우지 않는다). 주지 않으면 스스로 닫는다 */
    open?: boolean;
    /** 닫기를 누르면 */
    onDismiss?: () => void;
  };

export type PageBannerProps =
  | PageBannerDisplayProps
  | PageBannerActionableProps
  | PageBannerDismissibleProps;

// 톤의 기본 앞 아이콘 — lucide 선 아이콘(v106), Callout 과 같다
const TONE_ICON: Record<PageBannerTone, typeof Info> = {
  neutral: Info,
  informative: Info,
  positive: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
};

// 안의 내용 — 아이콘 · 글 · 화살표 · 닫기. Actionable 을 누르는 동안 이 층만 준다(바탕은 그대로)
const SCALE =
  "relative flex min-w-0 flex-1 items-start gap-x2 [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
const SCALE_PRESS =
  "group-active/page-banner:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/page-banner:[scale:1]";
const ICON = "mt-x0_5 flex shrink-0 [&>svg]:size-4";
// 글과 버튼 — 한 줄에 양 끝, 안 들어가면 버튼이 다음 줄 시작선으로(줄 사이 6)
const CONTENT =
  "flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x1_5";
const BODY =
  "min-w-0 text-t4 font-medium break-keep [overflow-wrap:break-word]";
const TITLE = "font-bold";
const SPACE = "whitespace-pre-wrap";
// 글 버튼 — 사방 11 · 바깥 −11(누르는 높이 40), 바탕 없이 2px 거리 축소. 링 색은 RING
const BUTTON = [
  "relative -m-[11px] shrink-0 cursor-pointer whitespace-nowrap rounded-r1 p-[11px] text-t3 font-bold",
  "[--press-basis:40] [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)] active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2",
].join(" ");
const CHEVRON = "size-4 shrink-0 self-center";
// 닫기 — 투명 상자 40 · 모서리 8 · 바깥 −12, 바탕 없이 2px 거리 축소(기준 40). 링 색은 RING
const CLOSE = [
  "relative -m-x3 flex size-10 shrink-0 cursor-pointer items-center justify-center self-center rounded-r2 [&>svg]:size-4",
  "[--press-basis:40] [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)] active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2",
].join(" ");
// 버튼 · 닫기의 링 색 — 링은 띠 위에 그려진다: 옅은 바탕은 브랜드 링, 짙은 바탕은 띠 글자색
const RING: Record<PageBannerVariant, string> = {
  weak: "focus-visible:outline-stroke-focus-ring",
  solid: "focus-visible:outline-current",
};

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로(Button · Chip 과 같은 식). Space · Enter 에서도 잰다
function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}

const isPressKey = (e: React.KeyboardEvent) =>
  e.key === " " || e.key === "Enter";

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

// 닫은 뒤 초점이 갈 자리 — 띠 뒤의 첫 키보드 요소, 없으면 앞의 마지막 요소
const TABBABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';

function focusTargetAround(root: HTMLElement): HTMLElement | null {
  const all = Array.from(
    root.ownerDocument.querySelectorAll<HTMLElement>(TABBABLE),
  ).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !root.contains(el) &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== "hidden",
  );
  const after = all.find(
    (el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  if (after) return after;
  return (
    all
      .reverse()
      .find(
        (el) =>
          root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING,
      ) ?? null
  );
}

// 닫기를 누르기 전에 자리를 잡아 두고, 다음 프레임에 띠가 정말 걷혔고 초점이 갈 곳을 잃었으면 그리로 옮긴다
// (부르는 쪽이 닫지 않았으면 — open 을 그대로 두면 — 그 자리에 둔다). 레시피의 useDismissFocus(useCallback 하나)를
// 함수로 풀었다 — 손 메모이제이션을 두지 않는다
function focusAfterDismiss(root: HTMLElement | null) {
  if (!root) return;
  const hadFocus = root.contains(document.activeElement);
  const target = hadFocus ? focusTargetAround(root) : null;
  requestAnimationFrame(() => {
    if (!target || root.isConnected) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    target.focus();
  });
}

type PageBannerInternalProps = PageBannerCommon & {
  interaction?: "display" | "actionable" | "dismissible";
  button?: PageBannerButton;
  open?: boolean;
  onDismiss?: () => void;
  className?: string;
} & Record<string, unknown>;

const PageBanner = React.forwardRef<HTMLElement, PageBannerProps>(
  (props, ref) => {
    const {
      tone = "neutral",
      variant = "weak",
      interaction = "display",
      title,
      icon,
      button,
      open,
      onDismiss,
      className,
      children,
      ...rest
    } = props as PageBannerInternalProps;
    const own = React.useRef<HTMLElement>(null);
    const [selfOpen, setSelfOpen] = React.useState(true);

    const DefaultIcon = TONE_ICON[tone];
    const shownIcon = icon === undefined ? <DefaultIcon /> : icon;
    const actionable = interaction === "actionable";
    // 버튼 안에는 구문 요소만 — Actionable 은 <span>, 아니면 <div> · 문단 <p>
    const Box = actionable ? "span" : "div";
    const Text = actionable ? "span" : "p";

    const inner = (
      <Box
        data-slot="page-banner-inner"
        className={cn(SCALE, actionable && SCALE_PRESS)}
      >
        {shownIcon != null && shownIcon !== false && (
          <span aria-hidden data-slot="page-banner-icon" className={ICON}>
            {shownIcon}
          </span>
        )}
        <Box data-slot="page-banner-content" className={CONTENT}>
          <Text data-slot="page-banner-body" className={BODY}>
            {title != null && title !== false && (
              <>
                <span data-slot="page-banner-title" className={TITLE}>
                  {title}
                </span>
                <span className={SPACE}>{"  "}</span>
              </>
            )}
            <span data-slot="page-banner-description">{children}</span>
          </Text>
          {interaction === "display" && button && (
            <button
              type="button"
              data-slot="page-banner-button"
              className={cn(BUTTON, RING[variant])}
              onPointerDown={(e) => measurePress(e.currentTarget)}
              onKeyDown={(e) => {
                if (isPressKey(e)) measurePress(e.currentTarget);
              }}
              onClick={button.onClick}
            >
              {button.label}
            </button>
          )}
        </Box>
        {actionable && (
          <ChevronRight
            aria-hidden
            data-slot="page-banner-chevron"
            className={CHEVRON}
          />
        )}
        {interaction === "dismissible" && (
          <button
            type="button"
            data-slot="page-banner-close"
            aria-label="닫기"
            className={cn(CLOSE, RING[variant])}
            onClick={() => {
              focusAfterDismiss(own.current);
              onDismiss?.();
              if (open === undefined) setSelfOpen(false);
            }}
          >
            <X aria-hidden />
          </button>
        )}
      </Box>
    );

    if (actionable) {
      const { onPointerDown, onKeyDown, ...buttonProps } =
        rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
      return (
        <button
          ref={mergeRefs(ref, own) as React.Ref<HTMLButtonElement>}
          type="button"
          data-slot="page-banner"
          data-tone={tone}
          data-variant={variant}
          data-interaction="actionable"
          className={cn(
            pageBannerVariants({ tone, variant, interaction }),
            className,
          )}
          onPointerDown={(e) => {
            measurePress(e.currentTarget);
            onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            if (isPressKey(e)) measurePress(e.currentTarget);
            onKeyDown?.(e);
          }}
          {...buttonProps}
        >
          {inner}
        </button>
      );
    }

    const shown = interaction === "dismissible" ? (open ?? selfOpen) : true;
    if (!shown) return null;

    return (
      <div
        ref={mergeRefs(ref, own) as React.Ref<HTMLDivElement>}
        data-slot="page-banner"
        data-tone={tone}
        data-variant={variant}
        data-interaction={interaction}
        className={cn(
          pageBannerVariants({ tone, variant, interaction }),
          className,
        )}
        {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      >
        {inner}
      </div>
    );
  },
);
PageBanner.displayName = "PageBanner";

export { PageBanner };
