import * as React from "react";

import { cn } from "@/shared/lib/cn";

import {
  CARD_ACTION,
  CARD_CONTENT,
  CARD_HERO_AMOUNT,
  CARD_HERO_DETAIL,
  CARD_HERO_GLOW,
  CARD_HERO_LABEL,
  CARD_LINK,
  CARD_PRESS_PEERS,
  CARD_PRESS_WHOLE,
  CARD_PRESS_WHOLE_SURFACE,
  CARD_STAT_LABEL,
  CARD_STAT_SIZE,
  CARD_STAT_VALUE,
  CARD_TITLE,
  DELTA_BOX,
  DELTA_TONE,
  cardHeaderVariants,
  cardVariants,
} from "./card-variants";
import { dsText, useDsText, withCommaBreaks } from "@/shared/ds/i18n";

/*
 * Groo Card — 면은 SEED Elevation · stroke.neutral-weak · Feedback(2026-10-08). 수치 원본은 groo-design
 * specs/components/card.yaml(값은 src/shared/ds/spec/card.json). groo-design recipes/shadcn/components/ui/card.tsx 를 첫 판으로
 * 가져왔다 — 모양(cva · 클래스 상수)은 card-variants.ts 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 * SEED 에는 카드 컴포넌트가 없다 — 바닥 위 흰 면 + 1px 테두리 · 그림자 없음 · 누름은 SEED 를, 머리 · 여백 · 지표 · 순자산 · 증감은
 * groo 가 정했다. 옛 변형 넷(shadow · bordered · muted · brand) · 모서리 12 · 여백 16 / 24 · 그림자 상승은 걷었다.
 *
 *   Card            카드 면. variant "default"(바닥 위 흰 면 + 1px 테두리) · "hero"(순자산 — 브랜드 채움 · 흰 글자, 한 화면에 하나).
 *                   body "content"(기본 — 여백 24) · "list"(List 를 담는다 — 좌우 여백 0, 머리 위 · 좌우 24 · 아래 4, 카드 아래 12) ·
 *                   "accordion"(Accordion inline 을 담는다 — 좌우 여백 0, 머리는 목록 카드와 같다, 카드 아래 8).
 *                   press "none"(기본) · "whole"(카드 전체가 한 곳 — <a href> 또는 <button>, 누름 색 + 2px 축소) · "peers"(카드를 누르면
 *                   열리고 안에 대등한 동작이 더 있다 — 카드 위에 깐 CardLink 가 누르는 자리, 색만 바뀐다). href · onClick 을 주면 "whole"
 *   CardHeader      머리 — 제목과 오른쪽 동작 한 줄, 아래 8(목록 · 아코디언 카드 4)
 *   CardTitle       제목 16 / 22 · 700 · fg-neutral — as(기본 h2)
 *   CardAction      머리 동작("전체 보기") — href · onClick. SEED Text Button(D2): 14 · 700 · fg-neutral-muted, 꺾쇠 · 아이콘 없음, 보이는 상자 36 ·
 *                   좌우 14 · 모서리 8, 누르는 영역 44. 이름은 "{제목} {글}"(카드 제목 id 로 이은 aria-labelledby)
 *   CardContent     본문 — 여백 안, 요소 사이 12. 목록 카드는 CardContent 없이 List 를 바로 넣는다
 *   CardLink        peers 카드의 누르는 자리 — 카드 전체를 덮는 링크(href) · 버튼(onClick), 글은 제목 모양(이름은 카드 제목)
 *   CardStat        지표 — label(13 · 500) · value(700 · 고정폭 숫자 — large 24 / 32 · small 20 / 27) · delta
 *   Delta           증감 줄 — direction "up"(▲ fg-critical) · "down"(▼ fg-informative) · "flat"(화살표 없이 "변화 없음") ·
 *                   value("12%") · text("지난달보다") · srText(보조 기술 문장). 표 · 차트의 증감 칸도 이것을 쓴다.
 *                   순자산 카드 안에서는 모두 흰 글자(채움 위 빨강 · 파랑은 1.66 · 1.65 — 하나뿐인 예외)
 *   CardHeroLabel · CardHeroAmount · CardHeroDetail   순자산 카드의 흰 글자 셋. 장식 빛은 카드가 그린다
 *
 * 레시피와 다른 자리 — useMemo · useState 로 제목 id 를 올리지 않는다(React Compiler · 효과 안 setState 금지). 카드가 제목 id 를 하나
 * 만들어 CardTitle 이 기본으로 쓰고 CardAction 이 이름에 잇는다(제목이 없으면 그 id 는 비어 이름은 글만 남는다).
 * press="whole" 인데 href · onClick 이 없으면 경고 대신 보기만 하는 카드로 그린다.
 *
 * 누름(SEED Feedback): whole — 마우스를 올리면 면이 bg-layer-default-pressed, 누르는 동안 같은 면 + 카드 전체 2px 거리 축소
 *   (기준 max(높이, 폭 ÷ 4, 24) 를 누르는 순간 잰다 · 모션 줄이기면 축소하지 않는다). peers — 면 색만(축소 없음). 테두리 · 글자색은
 *   그대로, 그림자 · 위로 뜨기는 없다. 키보드 포커스에만 카드 바깥 2px 링(띄움 2). 보기만 하는 카드(none)는 역할이 없고 바뀌지 않는다.
 */

export type CardVariant = "default" | "hero";
export type CardBody = "content" | "list" | "accordion";
export type CardPress = "none" | "whole" | "peers";

type CardContextValue = {
  variant: CardVariant;
  body: CardBody;
  titleId: string;
};

const CardContext = React.createContext<CardContextValue | null>(null);

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로(Button · List 와 같은 식) — 넓은 카드도 세로 2px 만큼만 준다
function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}

type CardOwnProps = {
  /** "default"(기본 — 바닥 위 흰 면 + 테두리) · "hero"(순자산 — 브랜드 채움 · 흰 글자) */
  variant?: CardVariant;
  /** "content"(기본 — 여백 24) · "list"(List 를 담는다 — 줄이 가장자리까지) · "accordion"(Accordion inline 을 담는다) */
  body?: CardBody;
  /** "none"(기본) · "whole"(카드 전체가 한 곳) · "peers"(카드 링크 + 대등한 동작). href · onClick 을 주면 "whole" */
  press?: CardPress;
  /** 카드 전체가 링크(<a>) — press "whole" */
  href?: string;
  /** 카드 전체가 버튼(<button>) — press "whole" */
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export type CardProps = CardOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, "onClick"> &
  Pick<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "target" | "rel" | "download"
  >;

const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      variant = "default",
      body = "content",
      press: pressProp,
      href,
      onClick,
      target,
      rel,
      download,
      className,
      children,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const hero = variant === "hero";
    const bodyKind: CardBody = hero ? "content" : body;
    const press: CardPress =
      pressProp === "peers"
        ? "peers"
        : href != null || onClick != null
          ? "whole"
          : "none";
    const classes = cn(
      cardVariants({ variant, body }),
      press === "whole" && CARD_PRESS_WHOLE,
      press === "whole" && !hero && CARD_PRESS_WHOLE_SURFACE,
      press === "peers" && !hero && CARD_PRESS_PEERS,
      className,
    );
    const content = (
      <>
        {hero && (
          <span
            aria-hidden
            data-slot="card-hero-glow"
            className={CARD_HERO_GLOW}
          />
        )}
        {children}
      </>
    );
    const shared = {
      "data-slot": "card",
      "data-variant": variant,
      "data-body": bodyKind,
      "data-press": press,
      className: classes,
    };
    let node: React.ReactNode;
    if (press === "whole" && href != null) {
      node = (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          download={download}
          onClick={onClick}
          onPointerDown={(e) => {
            measurePress(e.currentTarget);
            onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") measurePress(e.currentTarget);
            onKeyDown?.(e);
          }}
          {...shared}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    } else if (press === "whole") {
      node = (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          onPointerDown={(e) => {
            measurePress(e.currentTarget);
            onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              measurePress(e.currentTarget);
            onKeyDown?.(e);
          }}
          {...shared}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {content}
        </button>
      );
    } else {
      node = (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          {...shared}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          {content}
        </div>
      );
    }
    return (
      <CardContext.Provider value={{ variant, body: bodyKind, titleId }}>
        {node}
      </CardContext.Provider>
    );
  },
);
Card.displayName = "Card";

// ── 머리 ─────────────────────────────────────────────────────
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(CardContext);
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(cardHeaderVariants({ body: ctx?.body }), className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** 제목 태그 — 기본 h2(화면 제목 아래 단계) */
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Heading = "h2", id, className, ...props }, ref) => {
    const ctx = React.useContext(CardContext);
    return (
      <Heading
        ref={ref}
        id={id ?? ctx?.titleId}
        data-slot="card-title"
        className={cn(CARD_TITLE, className)}
        {...props}
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

export interface CardActionProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onClick"
> {
  /** 그 목록 · 화면으로 — 링크 */
  href?: string;
  /** 그 동작 — 버튼 */
  onClick?: React.MouseEventHandler<HTMLElement>;
}

const CardAction = React.forwardRef<HTMLElement, CardActionProps>(
  (
    {
      href,
      onClick,
      className,
      children,
      onPointerDown,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const ctx = React.useContext(CardContext);
    const textId = React.useId();
    // 이름 "{제목} {글}" — 무엇의 동작인지 넣는다. aria-label · aria-labelledby 를 주면 그것을 쓴다
    const labelledBy =
      ariaLabel != null
        ? undefined
        : (ariaLabelledBy ?? (ctx ? `${ctx.titleId} ${textId}` : undefined));
    const inner = (
      <>
        <span id={textId}>{children}</span>
      </>
    );
    const shared = {
      "data-slot": "card-action",
      "aria-label": ariaLabel,
      "aria-labelledby": labelledBy,
      className: cn(CARD_ACTION, className),
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        measurePress(e.currentTarget);
        onPointerDown?.(e);
      },
    };
    if (href != null) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          onClick={onClick}
          {...shared}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {inner}
        </a>
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        {...shared}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {inner}
      </button>
    );
  },
);
CardAction.displayName = "CardAction";

// ── 본문 ─────────────────────────────────────────────────────
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn(CARD_CONTENT, className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

export interface CardLinkProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onClick"
> {
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

const CardLink = React.forwardRef<HTMLElement, CardLinkProps>(
  ({ href, onClick, className, ...props }, ref) => {
    if (href != null) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          onClick={onClick}
          data-slot="card-link"
          className={cn(CARD_LINK, className)}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        data-slot="card-link"
        className={cn(CARD_LINK, className)}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  },
);
CardLink.displayName = "CardLink";

// ── 증감 ─────────────────────────────────────────────────────
export type DeltaDirection = "up" | "down" | "flat";

export interface DeltaProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** "up"(▲ fg-critical) · "down"(▼ fg-informative) · "flat"(화살표 없이 "변화 없음") — 좋고 나쁨이 아니라 방향 */
  direction: DeltaDirection;
  /** 변화량 — "12%" · "1,240원". 부호는 화살표가 말한다(앞의 + · − 는 떼어 낸다) */
  value?: React.ReactNode;
  /** 기준 — "지난달보다" */
  text?: React.ReactNode;
  /** 보조 기술이 읽는 문장 — 기본 "{text} {value} 늘었어요 · 줄었어요"(flat 은 "{text} 변화가 없어요"). 좋고 나쁨을 말하려면 준다("지난달보다 12% 더 썼어요") */
  srText?: string;
}

const ARROW: Record<DeltaDirection, string | null> = {
  up: "▲",
  down: "▼",
  flat: null,
};

const plain = (node: React.ReactNode) =>
  typeof node === "string" || typeof node === "number"
    ? String(node).trim()
    : "";
// 앞의 부호를 떼어 낸다 — "+12%" · "−12%" · "+-12.5%" 를 화살표와 겹쳐 쓰지 않는다
const unsigned = (node: React.ReactNode) =>
  typeof node === "string" ? node.replace(/^[\s+\-−]+/, "") : node;

function deltaSentence(
  direction: DeltaDirection,
  value: React.ReactNode,
  text: React.ReactNode,
) {
  const base = plain(text);
  if (direction === "flat")
    return [base, dsText("card.noChangeSentence")].filter(Boolean).join(" ");
  const amount = plain(unsigned(value));
  return [
    base,
    amount,
    direction === "up" ? dsText("card.increased") : dsText("card.decreased"),
  ]
    .filter(Boolean)
    .join(" ");
}

const Delta = React.forwardRef<HTMLSpanElement, DeltaProps>(
  ({ direction, value, text, srText, className, ...props }, ref) => {
    const dsT = useDsText();
    const hero = React.useContext(CardContext)?.variant === "hero";
    const arrow = ARROW[direction];
    return (
      <span
        ref={ref}
        data-slot="delta"
        data-direction={direction}
        className={cn(DELTA_BOX, className)}
        {...props}
      >
        <span
          aria-hidden
          data-slot="delta-value"
          className={cn(
            "font-medium tabular-nums",
            hero ? "text-static-white" : DELTA_TONE[direction],
          )}
        >
          {arrow != null ? (
            <>
              {arrow} {unsigned(value)}
            </>
          ) : (
            dsT("card.noChange")
          )}
        </span>
        {/* flat 은 "변화 없음" 만 — "변화 없음 지난달보다" 가 되지 않게 기준 글은 숨긴 문장에만 */}
        {direction !== "flat" && text != null && text !== "" && (
          <span
            aria-hidden
            data-slot="delta-text"
            className={cn(
              "font-normal",
              hero ? "text-static-white" : "text-fg-neutral-subtle",
            )}
          >
            {text}
          </span>
        )}
        <span className="sr-only">
          {srText ?? deltaSentence(direction, value, text)}
        </span>
      </span>
    );
  },
);
Delta.displayName = "Delta";

// ── 지표 ─────────────────────────────────────────────────────
export interface CardStatProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** 무엇의 숫자인지 — "이번 달 지출" */
  label: React.ReactNode;
  /** 숫자 — 쓰는 쪽이 원까지 만든다("1,240,000원" · 빼기는 U+2212) */
  value: React.ReactNode;
  /** "large"(기본 — 24 / 32, 카드 하나에 숫자 하나) · "small"(20 / 27 — 데스크톱 격자에 셋 · 넷씩) */
  size?: "large" | "small";
  /** 증감 줄 */
  delta?: DeltaProps;
}

const CardStat = React.forwardRef<HTMLDivElement, CardStatProps>(
  ({ label, value, size = "large", delta, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-stat"
      data-size={size}
      className={cn("flex flex-col items-start", className)}
      {...props}
    >
      <span data-slot="card-stat-label" className={CARD_STAT_LABEL}>
        {label}
      </span>
      <span
        data-slot="card-stat-value"
        className={cn(CARD_STAT_VALUE, CARD_STAT_SIZE[size])}
      >
        {withCommaBreaks(value)}
      </span>
      {delta != null && (
        <Delta {...delta} className={cn("mt-x1", delta.className)} />
      )}
    </div>
  ),
);
CardStat.displayName = "CardStat";

// ── 순자산 ───────────────────────────────────────────────────
const CardHeroLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-hero-label"
    className={cn(CARD_HERO_LABEL, className)}
    {...props}
  />
));
CardHeroLabel.displayName = "CardHeroLabel";

const CardHeroAmount = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-hero-amount"
    className={cn(CARD_HERO_AMOUNT, className)}
    {...props}
  >
    {withCommaBreaks(children)}
  </div>
));
CardHeroAmount.displayName = "CardHeroAmount";

const CardHeroDetail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-hero-detail"
    className={cn(CARD_HERO_DETAIL, className)}
    {...props}
  />
));
CardHeroDetail.displayName = "CardHeroDetail";

export {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardHeroAmount,
  CardHeroDetail,
  CardHeroLabel,
  CardLink,
  CardStat,
  CardTitle,
  Delta,
};
