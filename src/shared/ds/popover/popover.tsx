import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useScrollFog } from "@/shared/ds/scroll-fog";

import {
  POPOVER,
  POPOVER_BODY,
  POPOVER_BODY_FOG,
  POPOVER_BODY_PLAIN,
  POPOVER_CLOSE,
  POPOVER_DESCRIPTION,
  POPOVER_FOOTER,
  POPOVER_HEADER,
  POPOVER_POSITION,
  POPOVER_TITLE,
} from "./popover-variants";

/*
 * Groo Popover — 구조는 SEED Popover(2026-10-02). 수치 원본은 groo-design specs/components/popover.yaml
 * (값은 src/shared/ds/spec/popover.json). groo-design recipes/shadcn/components/ui/popover.tsx 를 첫 판으로 가져왔다.
 * Radix Popover(비모달) 위에 짰다.
 *
 *   Popover           트리거에 붙어 떠 있는 비모달 표면 — open · defaultOpen · onOpenChange
 *   PopoverTrigger    여는 버튼 — aria-haspopup="dialog" · aria-expanded, 열린 동안 aria-controls
 *   PopoverAnchor     트리거와 다른 요소에 붙일 때의 기준(Radix 그대로)
 *   PopoverContent    표면 — title(있으면 머리 + 오른쪽 위 닫기) · description · container(띄울 자리). 머리 없는 고르는 패널은
 *                     aria-label 로 이름을 단다. 안은 자유롭게 받는다(달력 · 시각 · 목록 · 안내 글)
 *   PopoverBody       본문 — 이 안에서만 스크롤, 위로 스크롤되면 머리 아래 1px 선. scrollFog 면 끝 흐림(Scroll Fog overlayBody —
 *                     늘 켜진 위 20 · 아래 80 + 본문 안 여백 위 20 · 아래 80) — 넘칠 수 있는 본문에만 준다
 *   PopoverFooter     바닥 — 오른쪽 정렬, 사이 8. Button small 36 을 크기를 주지 않은 바로 아래 자식에 넣는다
 *
 * 1280 이상에서 쓴다 — 같은 내용을 1280 미만에서는 Bottom Sheet 로 띄운다(Input Button 이 폭으로 고른다).
 *
 * 띄울 자리(container)는 이 레포에서 더했다(레시피에 없다 — Help Bubble 의 container 와 같다) — 표면은 문서 끝(body)에 뜨는데,
 * 다크가 문서가 아니라 하위 요소에 걸린 곳(카탈로그의 다크 판)에서는 body 의 표면이 라이트 색을 받는다.
 * 그런 곳은 그 안의 요소로 띄운다. 기본(body)은 같다.
 *
 * 비모달 — 딤 · 스크롤 잠금이 없고 뒤 화면을 숨기지 않으며 초점을 가두지 않는다.
 *   - 열면 초점이 안으로 간다 — 머리 닫기 버튼이 아니라 내용의 첫 칸, 칸이 없으면 표면. autoFocus 를 단 칸이 있으면 그 칸.
 *   - Tab 은 트리거 → 표면 안 → 트리거 다음 칸 순서다. 마지막 칸에서 Tab 을 누르면 초점을 트리거에 두어 브라우저가 트리거 다음 칸으로
 *     보내고, 표면은 바깥으로 나간 초점에 닫힌다(초점은 나간 자리에 남는다). 첫 칸에서 Shift+Tab 은 트리거로, 열린 동안 트리거에서
 *     Tab 은 표면 안으로 — 표면은 문서 끝(portal)에 있어 브라우저에 맡기면 순서가 끊긴다.
 *   - 바깥 누르기 · Esc · 닫기 버튼으로 닫으면 초점은 트리거로 돌아간다 — 바깥을 눌러 다른 칸에 초점이 갔으면 그 자리에 둔다.
 *   - 대화상자 · 시트 안에서 열면 그 위에 뜨고(z-floating 200), 그 표면이 닫히면 함께 닫힌다.
 *
 * 모양은 popover-variants.ts. 모션: 150ms enter 로 트리거 쪽 변에서 0.95 → 1 커지며 나타나고, 100ms exit 로 0.95 로 줄며
 * 사라진다(모션 줄이기면 투명도만). 휠 스크롤은 표면 안에서 멈춘다 — 대화상자 안에서 열었을 때 대화상자의 스크롤 잠금(문서에 건다)이
 * 팝오버의 휠을 막지 않게.
 */

type OpenChange = (open: boolean) => void;

// ── 작은 도구 ─────────────────────────────────────────────────
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

// 열림 — 제어 · 비제어 둘 다. 같은 값을 거듭 청하면(우리 Tab · Radix 의 바깥 초점) 한 번만 알린다
function useOpenState(
  prop: boolean | undefined,
  defaultOpen: boolean | undefined,
  onChange: OpenChange | undefined,
) {
  const [inner, setInner] = React.useState(defaultOpen ?? false);
  const controlled = prop !== undefined;
  const value = controlled ? prop : inner;
  const onChangeRef = React.useRef(onChange);
  const lastRef = React.useRef(value);
  React.useLayoutEffect(() => {
    onChangeRef.current = onChange;
    lastRef.current = value;
  });
  const setOpen = (next: boolean) => {
    if (next === lastRef.current) return;
    lastRef.current = next;
    if (!controlled) setInner(next);
    onChangeRef.current?.(next);
  };
  return [value, setOpen] as const;
}

// 바닥 버튼의 크기 — 크기를 주지 않은 바로 아래 자식(컴포넌트)에만 넣는다. Fragment 는 펼친다
function withButtonSize(
  children: React.ReactNode,
  size: "small",
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (
      !React.isValidElement<{ size?: unknown; children?: React.ReactNode }>(
        child,
      )
    )
      return child;
    if (child.type === React.Fragment)
      return withButtonSize(child.props.children, size);
    if (typeof child.type === "string" || child.props.size !== undefined)
      return child;
    return React.cloneElement(child, { size });
  });
}

// 표면 안에서 Tab 이 서는 칸 — 문서 순서대로, 막히거나 숨은 칸은 뺀다
function tabbablesOf(root: HTMLElement) {
  const out: HTMLElement[] = [];
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const el = node as HTMLElement & { disabled?: boolean; type?: string };
        if (
          el.disabled ||
          el.hidden ||
          (el.tagName === "INPUT" && el.type === "hidden")
        )
          return NodeFilter.FILTER_SKIP;
        return el.tabIndex >= 0 && el.getClientRects().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    },
  );
  while (walker.nextNode()) out.push(walker.currentNode as HTMLElement);
  return out;
}

// 내용의 첫 칸 — 머리 닫기 버튼은 건너뛴다. 칸이 없으면 표면
function focusContent(content: HTMLElement | null) {
  if (!content) return;
  const first = tabbablesOf(content).find(
    (el) => !el.closest('[data-slot="popover-close"]'),
  );
  (first ?? content).focus({ preventScroll: true });
}

// 본문의 스크롤 상태 — 위로 스크롤됨(머리 아래 선) · 넘치면 Tab 이 선다(키보드로 스크롤). DOM 에 바로 쓴다
function useBodyScroll(ref: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const overflow = el.scrollHeight > el.clientHeight + 1;
      el.toggleAttribute("data-scrolled", el.scrollTop > 0);
      if (overflow) el.tabIndex = 0;
      else el.removeAttribute("tabindex");
    };
    const resize = new ResizeObserver(measure);
    const observeChildren = () => {
      resize.observe(el);
      for (const child of Array.from(el.children)) resize.observe(child);
    };
    const mutation = new MutationObserver(() => {
      observeChildren();
      measure();
    });
    observeChildren();
    mutation.observe(el, { childList: true });
    el.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [ref]);
}

// ── 팝오버 ───────────────────────────────────────────────────
type PopoverContextValue = {
  open: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};
const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: OpenChange;
  children?: React.ReactNode;
}

function Popover({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
}: PopoverProps) {
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  return (
    <PopoverContext.Provider value={{ open, triggerRef, contentRef }}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverContext.Provider>
  );
}
Popover.displayName = "Popover";

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ onKeyDown, ...props }, ref) => {
  const ctx = React.useContext(PopoverContext);
  return (
    <PopoverPrimitive.Trigger
      ref={mergeRefs(ref, ctx?.triggerRef)}
      data-slot="popover-trigger"
      // aria-controls 는 열린 동안만 — 닫혀 있으면 가리킬 표면이 문서에 없다
      {...(ctx && !ctx.open ? { "aria-controls": undefined } : null)}
      {...props}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        // 열린 동안 트리거에서 Tab — 표면 안으로(표면은 트리거 바로 다음 순서다)
        if (
          e.defaultPrevented ||
          !ctx?.open ||
          e.key !== "Tab" ||
          e.shiftKey ||
          e.altKey ||
          e.ctrlKey ||
          e.metaKey
        )
          return;
        const content = ctx.contentRef.current;
        if (!content) return;
        e.preventDefault();
        focusContent(content);
      }}
    />
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverAnchor = PopoverPrimitive.Anchor;

export interface PopoverContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  "title"
> {
  /** 제목 — 무엇에 대한 안내인지("연차 사용 규정"). 있으면 머리와 닫기 버튼을 둔다. 고르는 패널은 두지 않고 aria-label 을 준다 */
  title?: React.ReactNode;
  /** 설명 — 머리의 제목 아래 */
  description?: React.ReactNode;
  /** 띄울 자리 — 기본 document.body. 다크가 문서가 아니라 하위 요소에 걸린 곳(카탈로그의 다크 판)에서 그 안의 요소로 */
  container?: React.ComponentPropsWithoutRef<
    typeof PopoverPrimitive.Portal
  >["container"];
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      title,
      description,
      container,
      className,
      children,
      side = POPOVER_POSITION.side,
      align = POPOVER_POSITION.align,
      sideOffset = POPOVER_POSITION.sideOffset,
      collisionPadding = POPOVER_POSITION.collisionPadding,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onKeyDown,
      onWheel,
      ...props
    },
    ref,
  ) => {
    const ctx = React.useContext(PopoverContext);
    const own = React.useRef<HTMLDivElement>(null);
    const titleId = React.useId();
    const descriptionId = React.useId();
    const hasHeader = title != null;
    return (
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          ref={mergeRefs(ref, own, ctx?.contentRef)}
          data-slot="popover-content"
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (hasHeader ? titleId : undefined)}
          aria-describedby={
            description != null && hasHeader ? descriptionId : undefined
          }
          className={cn(POPOVER, className)}
          // 열면 초점은 내용의 첫 칸(머리 닫기 버튼이 아니라), 칸이 없으면 표면
          onOpenAutoFocus={(e) => {
            // 이름이 없으면 개발 중에 알린다(열릴 때)
            if (
              import.meta.env.DEV &&
              !hasHeader &&
              !ariaLabel?.trim() &&
              !ariaLabelledBy
            ) {
              console.warn(
                '[Popover] 머리(title)가 없는 팝오버는 aria-label 로 이름을 단다(예: "날짜 고르기").',
                own.current,
              );
            }
            onOpenAutoFocus?.(e);
            if (e.defaultPrevented) return;
            e.preventDefault();
            focusContent(own.current);
          }}
          // 닫힌 뒤 — 초점이 갈 곳을 잃었으면(Esc · 닫기 버튼 · 빈 자리를 누름) 트리거로. Tab 으로 나갔거나 바깥의 다른 칸을
          // 눌렀으면 그 자리에 둔다
          onCloseAutoFocus={(e) => {
            onCloseAutoFocus?.(e);
            if (e.defaultPrevented) return;
            e.preventDefault();
            const active = document.activeElement;
            if (!active || active === document.body)
              ctx?.triggerRef.current?.focus({ preventScroll: true });
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            const content = own.current;
            const trigger = ctx?.triggerRef.current;
            if (
              e.defaultPrevented ||
              e.key !== "Tab" ||
              e.altKey ||
              e.ctrlKey ||
              e.metaKey ||
              !content ||
              !trigger
            )
              return;
            const items = tabbablesOf(content);
            const active = document.activeElement;
            if (e.shiftKey) {
              // 첫 칸(또는 표면)에서 Shift+Tab — 트리거로
              if (
                items.length === 0 ||
                active === items[0] ||
                active === content
              ) {
                e.preventDefault();
                trigger.focus({ preventScroll: true });
              }
              return;
            }
            // 마지막 칸에서 Tab — 초점을 트리거에 두면 브라우저가 트리거 다음 칸으로 보낸다(기본 동작은 막지 않는다)
            if (items.length === 0 || active === items[items.length - 1])
              trigger.focus({ preventScroll: true });
          }}
          onWheel={(e) => {
            onWheel?.(e);
            e.stopPropagation();
          }}
          {...props}
        >
          {hasHeader && (
            <div data-slot="popover-header" className={POPOVER_HEADER}>
              <h2
                id={titleId}
                data-slot="popover-title"
                className={POPOVER_TITLE}
              >
                {title}
              </h2>
              {description != null && (
                <p
                  id={descriptionId}
                  data-slot="popover-description"
                  className={POPOVER_DESCRIPTION}
                >
                  {description}
                </p>
              )}
            </div>
          )}
          {hasHeader && (
            <PopoverPrimitive.Close
              aria-label="닫기"
              data-slot="popover-close"
              className={POPOVER_CLOSE}
            >
              <X aria-hidden strokeWidth={2} />
            </PopoverPrimitive.Close>
          )}
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

export interface PopoverBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 끝 흐림(Scroll Fog overlayBody — 위 20 · 아래 80, 늘 켜짐) — 넘칠 수 있는 본문에만 */
  scrollFog?: boolean;
}

const PopoverBody = React.forwardRef<HTMLDivElement, PopoverBodyProps>(
  ({ scrollFog = false, className, ...props }, ref) => {
    const own = React.useRef<HTMLDivElement>(null);
    useBodyScroll(own);
    useScrollFog(own, scrollFog ? "overlayBody" : null);
    return (
      <div
        ref={mergeRefs(ref, own)}
        data-slot="popover-body"
        data-scroll-fog={scrollFog ? "overlayBody" : undefined}
        className={cn(
          POPOVER_BODY,
          scrollFog ? POPOVER_BODY_FOG : POPOVER_BODY_PLAIN,
          className,
        )}
        {...props}
      />
    );
  },
);
PopoverBody.displayName = "PopoverBody";

const PopoverFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="popover-footer"
    className={cn(POPOVER_FOOTER, className)}
    {...props}
  >
    {withButtonSize(children, "small")}
  </div>
));
PopoverFooter.displayName = "PopoverFooter";

export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
};
