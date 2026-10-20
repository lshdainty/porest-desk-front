import * as React from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

import {
  ACCORDION_BACKGROUND,
  ACCORDION_BODY,
  ACCORDION_DIVIDER,
  ACCORDION_EXPAND_ALL,
  ACCORDION_HEADER,
  ACCORDION_HEADER_TITLE,
  ACCORDION_PANEL_TEXT,
  accordionChevronVariants,
  accordionDescriptionVariants,
  accordionItemVariants,
  accordionPlainContentVariants,
  accordionPrefixVariants,
  accordionTitleVariants,
  accordionTriggerContentVariants,
  accordionTriggerVariants,
  accordionVariants,
  measurePress,
} from "./accordion-variants";
import { useControllable } from "./use-controllable";
import { useExpandMotion } from "./use-expand-motion";

/*
 * Groo Accordion — 구조는 SEED Accordion(rootage accordion.json · accordion-item.json, 2026-10-10). 수치 원본은 groo-design
 * specs/components/accordion.yaml(값은 src/shared/ds/spec/accordion.json). groo-design recipes/shadcn/components/ui/accordion.tsx 를
 * 첫 판으로 가져왔다 — 모양(cva · 클래스 상수)은 accordion-variants.ts 다.
 * 관련 상세를 세로로 묶고 항목마다 머리(트리거)를 눌러 펼친다 — 카드 혜택 · 유의사항. 하나만 접고 펴는 자리는 Collapsible, 하위 줄을
 * 접는 목록은 List 의 하위 줄이다(Tree View 는 HR 전용). 옛 Radix 베이스 · 아래 선만 · 꺾쇠 16 · 하나만 여는 모드는 걷었다.
 *
 *   Accordion            아코디언 — variant "inline"(기본 — 연속 목록 + 들인 사이 선 24) · "separated"(항목마다 Card 면 16 · 1px · 사이 8).
 *                        values · defaultValues · onValuesChange(values) — 펼친 항목의 value 목록. 늘 여럿을 함께 연다(하나만 여는 모드는 없다).
 *                        disabled(전체) · id(모두 펼치기가 aria-controls 로 가리킨다), 나머지는 div 속성. 처음에는 모두 접힘
 *   AccordionItem        항목 — value(필수) · disabled
 *   AccordionTrigger     트리거 — title(필수) · description · prefixIcon · headingLevel(2 ~ 6, 기본 3). 머리말 안의 단추(aria-expanded ·
 *                        aria-controls)와 꺾쇠 20 을 그린다. 이름은 제목 + 설명
 *   AccordionContent     펼친 내용 — 0 / 24 / 16 · text-article-note · fg-neutral-muted · 줄바꿈 문자를 지킨다. 접혀 있으면 그리지 않는다(hidden)
 *   AccordionPlainItem   상세가 없는 항목 — title · description · prefixIcon. 단추 · 머리말 · 꺾쇠가 없고 높이 · 글 시작은 트리거와 같다
 *   AccordionHeader      시트 · 대화상자의 목록 머리 — title(건수를 붙인다) + 오른쪽 자식(모두 펼치기). 카드 안이면 CardHeader 가 이 자리다
 *   AccordionExpandAll   모두 펼치기 — controls(아코디언 id) · values · expandable(상세가 있는 항목의 value) · onValuesChange.
 *                        모두 펼쳐져 있으면 "모두 접기" — 글 · 아이콘은 단추가 정한다. 이름은 보이는 글, aria-controls 만(aria-expanded 없음)
 *
 *   useExpandMotion      펼침 · 접힘 모션 — Collapsible · List 의 하위 줄(ListParentItem)도 이것을 쓴다(use-expand-motion.ts, 모두 "Accordion 과 같다")
 *
 * 레시피와 다른 자리 — useMemo · useCallback 을 손으로 달지 않는다(React Compiler). 문맥 값은 그대로 만들어 넘기고, 모두 펼치기의 글은
 * 기본값 "모두 펼치기" · "모두 접기" 를 props(expandLabel · collapseLabel)로 바꿀 수 있다(번역은 호출하는 쪽이 넘긴다).
 *
 * 펼친 내용은 좌우 24 · 아래 16(위 0 — 트리거 아래 16 에 바로 잇는다), 안에서 스크롤하지 않는다. 펼쳐도 초점은 트리거에 그대로고
 * 화면을 저절로 스크롤하지 않는다(SEED). 펼친 내용에 role="region" 을 두지 않는다 — 함께 열리는 항목이 많아 랜드마크가 늘어난다(APG).
 * 모션: 꺾쇠 · 높이 300ms motion-ease-easing(SEED d6). 모션 줄이기면 높이를 움직이지 않고 150ms 서서히 나타나고 사라지며, 꺾쇠는 바로 뒤집힌다.
 * 키보드(APG Accordion): Enter · Space 는 단추 그대로, ↓ ↑ 는 다음 · 앞 트리거(끝에서 처음으로 돈다), Home · End 는 첫 · 끝 트리거 —
 * 상세가 없는 줄 · 막힌 트리거는 건너뛴다.
 */

export type AccordionVariant = NonNullable<
  VariantProps<typeof accordionVariants>["variant"]
>;
export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

type AccordionContextValue = {
  variant: AccordionVariant;
  values: string[];
  toggle: (value: string) => void;
  disabled: boolean;
};
const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

type ItemContextValue = {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
};
const ItemContext = React.createContext<ItemContextValue | null>(null);

function useAccordion(part: string) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error(`[Accordion] ${part} 는 Accordion 안에 둔다.`);
  return ctx;
}
function useItem(part: string) {
  const ctx = React.useContext(ItemContext);
  if (!ctx) throw new Error(`[Accordion] ${part} 는 AccordionItem 안에 둔다.`);
  return ctx;
}

export interface AccordionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> {
  /** "inline"(기본 — 연속 목록 + 들인 사이 선) · "separated"(항목마다 Card 면) */
  variant?: AccordionVariant;
  /** 펼친 항목의 value 목록 — 쥐고 다룰 때 */
  values?: string[];
  /** 처음 펼친 항목 — 없으면 모두 접힘 */
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  /** 전체 막힘 */
  disabled?: boolean;
}

const KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);
const TRIGGER = '[data-slot="accordion-trigger"]';
const ROOT = '[data-slot="accordion"]';

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      variant = "inline",
      values: valuesProp,
      defaultValues,
      onValuesChange,
      disabled = false,
      className,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [values, setValues] = useControllable(
      valuesProp,
      defaultValues ?? [],
      onValuesChange,
    );
    const toggle = (value: string) =>
      setValues(
        values.includes(value)
          ? values.filter((v) => v !== value)
          : [...values, value],
      );
    return (
      <AccordionContext.Provider value={{ variant, values, toggle, disabled }}>
        <div
          ref={ref}
          data-slot="accordion"
          data-variant={variant}
          className={cn(accordionVariants({ variant }), className)}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (
              e.defaultPrevented ||
              !KEYS.has(e.key) ||
              e.altKey ||
              e.ctrlKey ||
              e.metaKey
            )
              return;
            const root = e.currentTarget;
            const target = e.target as HTMLElement;
            if (
              target.getAttribute("data-slot") !== "accordion-trigger" ||
              target.closest(ROOT) !== root
            )
              return;
            // 이 아코디언의 트리거만(안에 둔 다른 아코디언은 빼고) — 막힌 트리거는 건너뛴다
            const triggers = Array.from(
              root.querySelectorAll<HTMLButtonElement>(TRIGGER),
            ).filter((t) => !t.disabled && t.closest(ROOT) === root);
            const i = triggers.indexOf(target as HTMLButtonElement);
            if (i < 0) return;
            e.preventDefault();
            const n = triggers.length;
            const next =
              e.key === "ArrowDown"
                ? triggers[(i + 1) % n]
                : e.key === "ArrowUp"
                  ? triggers[(i - 1 + n) % n]
                  : e.key === "Home"
                    ? triggers[0]
                    : triggers[n - 1];
            next?.focus();
          }}
          {...props}
        />
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 항목의 값 — Accordion 의 values 에 든다 */
  value: string;
  disabled?: boolean;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  (
    { value, disabled: disabledProp = false, className, children, ...props },
    ref,
  ) => {
    const acc = useAccordion("AccordionItem");
    const open = acc.values.includes(value);
    const disabled = acc.disabled || disabledProp;
    const base = React.useId();
    return (
      <ItemContext.Provider
        value={{
          value,
          open,
          disabled,
          triggerId: `${base}trigger`,
          contentId: `${base}content`,
        }}
      >
        <div
          ref={ref}
          data-slot="accordion-item"
          data-accordion-row=""
          data-state={open ? "open" : "closed"}
          data-disabled={disabled ? "" : undefined}
          className={cn(
            accordionItemVariants({ variant: acc.variant }),
            className,
          )}
          {...props}
        >
          <span
            aria-hidden
            data-slot="accordion-divider"
            className={ACCORDION_DIVIDER}
          />
          {children}
        </div>
      </ItemContext.Provider>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "title" | "children" | "disabled"
> {
  /** 제목 — 무엇의 상세인지(늘 줄을 바꾼다) */
  title: React.ReactNode;
  /** 설명 — 제목 아래 한 줄 요약(있을 때만, 높이 74) */
  description?: React.ReactNode;
  /** 앞 아이콘 — lucide 22(있을 때만) */
  prefixIcon?: React.ReactNode;
  /** 머리말 단계 — 놓인 자리를 따른다(기본 3 — 대화상자 · 시트 · 카드 제목(h2) 아래) */
  headingLevel?: HeadingLevel;
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(
  (
    {
      title,
      description,
      prefixIcon,
      headingLevel = 3,
      className,
      onClick,
      onPointerDown,
      onKeyDown,
      id,
      ...props
    },
    ref,
  ) => {
    const acc = useAccordion("AccordionTrigger");
    const item = useItem("AccordionTrigger");
    const Heading = `h${headingLevel}` as "h3";
    return (
      <Heading data-slot="accordion-heading" className="m-0 flex">
        <button
          {...props}
          ref={ref}
          type="button"
          id={id ?? item.triggerId}
          aria-expanded={item.open}
          aria-controls={item.contentId}
          disabled={item.disabled}
          data-slot="accordion-trigger"
          data-state={item.open ? "open" : "closed"}
          className={cn(
            accordionTriggerVariants({
              ring: acc.variant === "separated" ? "r3_5" : "square",
              tall: description != null,
            }),
            className,
          )}
          onPointerDown={(e) => {
            measurePress(e.currentTarget);
            onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter")
              measurePress(e.currentTarget);
            onKeyDown?.(e);
          }}
          onClick={(e) => {
            onClick?.(e);
            if (!e.defaultPrevented) acc.toggle(item.value);
          }}
        >
          <span
            aria-hidden
            data-slot="accordion-background"
            className={ACCORDION_BACKGROUND}
          />
          <span
            data-slot="accordion-trigger-content"
            className={accordionTriggerContentVariants({
              press: !item.disabled,
            })}
          >
            {prefixIcon != null && (
              <span
                aria-hidden
                data-slot="accordion-prefix-icon"
                className={accordionPrefixVariants(item.disabled)}
              >
                {prefixIcon}
              </span>
            )}
            <span data-slot="accordion-trigger-body" className={ACCORDION_BODY}>
              <span
                data-slot="accordion-title"
                className={accordionTitleVariants(item.disabled)}
              >
                {title}
              </span>
              {description != null && (
                <span
                  data-slot="accordion-description"
                  className={accordionDescriptionVariants(item.disabled)}
                >
                  {description}
                </span>
              )}
            </span>
            <ChevronDown
              aria-hidden
              data-slot="accordion-chevron"
              strokeWidth={2}
              className={accordionChevronVariants({
                open: item.open,
                disabled: item.disabled,
              })}
            />
          </span>
        </button>
      </Heading>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const item = useItem("AccordionContent");
  const { ref: motionRef, hidden } = useExpandMotion<HTMLDivElement>(item.open);
  return (
    <div
      ref={motionRef}
      id={item.contentId}
      data-slot="accordion-content"
      data-state={item.open ? "open" : "closed"}
      hidden={hidden}
    >
      <div
        ref={ref}
        data-slot="accordion-content-text"
        className={cn(ACCORDION_PANEL_TEXT, className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export interface AccordionPlainItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: React.ReactNode;
  description?: React.ReactNode;
  prefixIcon?: React.ReactNode;
}

// 상세가 없는 항목 — 트리거가 아닌 그냥 줄(사용자 결정 5A). 같은 위아래 16 · 좌우 24 · 글이라 높이 · 글 시작이 같다. 누르거나 올려도 바탕이 없다
const AccordionPlainItem = React.forwardRef<
  HTMLDivElement,
  AccordionPlainItemProps
>(({ title, description, prefixIcon, className, ...props }, ref) => {
  const acc = useAccordion("AccordionPlainItem");
  return (
    <div
      ref={ref}
      data-slot="accordion-plain-item"
      data-accordion-row=""
      className={cn(accordionItemVariants({ variant: acc.variant }), className)}
      {...props}
    >
      <span
        aria-hidden
        data-slot="accordion-divider"
        className={ACCORDION_DIVIDER}
      />
      <div
        data-slot="accordion-plain-item-content"
        className={cn(
          accordionTriggerContentVariants(),
          accordionPlainContentVariants({ tall: description != null }),
        )}
      >
        {prefixIcon != null && (
          <span
            aria-hidden
            data-slot="accordion-prefix-icon"
            className={accordionPrefixVariants()}
          >
            {prefixIcon}
          </span>
        )}
        <span data-slot="accordion-trigger-body" className={ACCORDION_BODY}>
          <span
            data-slot="accordion-title"
            className={accordionTitleVariants()}
          >
            {title}
          </span>
          {description != null && (
            <span
              data-slot="accordion-description"
              className={accordionDescriptionVariants()}
            >
              {description}
            </span>
          )}
        </span>
      </div>
    </div>
  );
});
AccordionPlainItem.displayName = "AccordionPlainItem";

export interface AccordionHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** 목록 머리 제목 — 건수를 붙인다("혜택 상세 · 12건") */
  title: React.ReactNode;
}

const AccordionHeader = React.forwardRef<HTMLDivElement, AccordionHeaderProps>(
  ({ title, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="accordion-header"
      className={cn(ACCORDION_HEADER, className)}
      {...props}
    >
      <div
        data-slot="accordion-header-title"
        className={ACCORDION_HEADER_TITLE}
      >
        {title}
      </div>
      {children}
    </div>
  ),
);
AccordionHeader.displayName = "AccordionHeader";

export interface AccordionExpandAllProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "value"
> {
  /** 아코디언의 id — aria-controls */
  controls: string;
  /** 아코디언과 같은 펼친 항목 목록 */
  values: string[];
  /** 상세가 있는 항목의 value 목록 — 모두 펼치면 이것을 다 연다 */
  expandable: string[];
  onValuesChange: (values: string[]) => void;
  /** 접혀 있는 항목이 있을 때의 글 — 기본 "모두 펼치기" */
  expandLabel?: string;
  /** 모두 펼쳐져 있을 때의 글 — 기본 "모두 접기" */
  collapseLabel?: string;
}

const AccordionExpandAll = React.forwardRef<
  HTMLButtonElement,
  AccordionExpandAllProps
>(
  (
    {
      controls,
      values,
      expandable,
      onValuesChange,
      expandLabel = "모두 펼치기",
      collapseLabel = "모두 접기",
      className,
      onClick,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    // 상세가 있는 항목이 모두 펼쳐져 있으면 "모두 접기" — 하나라도 접혀 있으면 "모두 펼치기"
    const allOpen =
      expandable.length > 0 && expandable.every((v) => values.includes(v));
    return (
      <button
        ref={ref}
        type="button"
        aria-controls={controls}
        data-slot="accordion-expand-all"
        data-state={allOpen ? "expanded" : "collapsed"}
        className={cn(ACCORDION_EXPAND_ALL, className)}
        onPointerDown={(e) => {
          measurePress(e.currentTarget);
          onPointerDown?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") measurePress(e.currentTarget);
          onKeyDown?.(e);
        }}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          onValuesChange(
            allOpen
              ? values.filter((v) => !expandable.includes(v))
              : [...values, ...expandable.filter((v) => !values.includes(v))],
          );
        }}
        {...props}
      >
        <span>{allOpen ? collapseLabel : expandLabel}</span>
        {allOpen ? (
          <ChevronsDownUp aria-hidden strokeWidth={2} />
        ) : (
          <ChevronsUpDown aria-hidden strokeWidth={2} />
        )}
      </button>
    );
  },
);
AccordionExpandAll.displayName = "AccordionExpandAll";

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionPlainItem,
  AccordionHeader,
  AccordionExpandAll,
};
