import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/shared/lib/cn";
import {
  BottomSheet,
  BottomSheetSurface,
  BottomSheetTrigger,
} from "@/shared/ds/bottom-sheet";
import { mergeRefs, useOpenState, type OpenChange } from "@/shared/ds/overlay";

import {
  MENU_SHEET_CLOSE,
  MENU_SHEET_DESCRIPTION,
  MENU_SHEET_GROUP,
  MENU_SHEET_HEADER,
  MENU_SHEET_ITEM,
  MENU_SHEET_ITEM_CONTENT,
  MENU_SHEET_ITEM_CONTENT_PRESS,
  MENU_SHEET_ITEM_ENABLED,
  MENU_SHEET_LIST,
  MENU_SHEET_SURFACE,
  MENU_SHEET_TITLE,
  MENU_SHEET_TONE,
  type MenuSheetLayout,
} from "./menu-sheet-variants";
import { isPressKey, measurePress } from "./press";
import { usePendingSelect } from "./use-pending-select";

/*
 * Groo Menu Sheet — 구조는 SEED Swipeable Menu Sheet(2026-10-02). 수치 원본은 groo-design specs/components/menu-sheet.yaml
 * (값은 src/shared/ds/spec/menu-sheet.json). groo-design recipes/shadcn/components/ui/menu-sheet.tsx 를 첫 판으로 가져왔다.
 * Bottom Sheet(src/shared/ds/bottom-sheet — vaul) 위에 짰다.
 *
 *   MenuSheet          화면 아래에서 올라오는 동작 목록 — open · defaultOpen · onOpenChange
 *   MenuSheetTrigger   여는 버튼 — aria-haspopup="dialog" · aria-expanded. 닫으면 초점이 여기로 돌아온다
 *   MenuSheetContent   시트 — title · description(둘 다 없어도 된다) · layout(textWithIcon 기본 | textOnly).
 *                      손잡이는 늘 있고 위 닫기 버튼은 없다. 목록 뒤에 보조 기술용 닫기(키보드 초점이 오면 보인다)
 *   MenuSheetGroup     묶음 — 옅은 회색 상자(모서리 16). 묶음 사이는 10 간격만
 *   MenuSheetItem      줄 — label · description · icon · tone(neutral | critical) · disabled · onSelect. <button type="button">
 *
 * 줄의 동작은 ResponsiveMenu(src/shared/ds/menu)로 짠다 — 1280 미만에서 이 시트를, 이상에서 Menu 를 그린다. 늘 시트인 자리
 * (폰 전용 화면의 머리 더보기)만 MenuSheet 를 바로 쓴다.
 *
 * 줄을 누르면 시트를 먼저 닫고, 다 닫혀 초점이 트리거로 돌아온 뒤 onSelect 를 부른다 — 확인이 필요한 동작(삭제)은 그 안에서
 * Alert Dialog 를 열면 된다. 닫히는 시트와 열리는 확인창이 겹치지 않고, 확인창을 닫으면 초점이 트리거로 돌아간다(Menu 와 같다).
 * 막힌 줄(disabled)은 눌러도 실행하지 않고 닫히지 않는다 — 전용 색이고 Tab 이 서지 않는다.
 *
 * 딤 · 끌어내리기(0.4px/ms 넘게 · 높이의 25%, 열린 뒤 0.5초는 끌리지 않음) · Esc · 뒤로 가기(1280 미만) · 초점 가두기 ·
 * 뒤 화면 숨김 · 스크롤 잠금 · 쌓임(딤 100 · 시트 101) · 모션(300ms enter-expressive · 200ms exit)은 Bottom Sheet 그대로다
 * (BottomSheet · BottomSheetSurface). 다른 것은 위 모서리 20(r5) · 손잡이가 늘 있음 · 위 닫기 버튼 없음 · 머리 가운데다.
 * 열면 처음 초점은 시트(첫 줄 위)에 가고, Tab · Shift+Tab 은 줄 → 보조 기술용 닫기 → 첫 줄로 돈다.
 *
 * 이름: 제목이 있으면 aria-labelledby(제목) · 설명 aria-describedby. 제목이 없으면 aria-label, 그것도 없으면 트리거의 이름
 * ("주간 회의 메모 더보기")을 숨은 제목으로 단다 — 셋 다 없으면 개발 중에 알린다.
 *
 * 모양: 시트 위 24(손잡이 자리) · 좌우 화면 여백 24 · 아래 16 + 안전 영역. 머리는 가운데 — 제목 t6 18 / 24 · 700 ·
 * 설명 t4 fg-neutral-muted, 사이 4 · 아래 16. 묶음은 bg-neutral-weak · 모서리 16, 사이 10. 줄은 최소 52 · 위아래 14 · 좌우 16 ·
 * 아이콘 22 ↔ 이름 14, 이름 t5 400 · 설명 t3 500 fg-neutral-subtle(사이 2). 줄 사이 선은 안쪽 아래 1px stroke-neutral-weak —
 * 묶음의 마지막 줄에는 없다. 호버 · 누름은 bg-neutral-weak-pressed + 아이콘 · 글만 2px 거리 축소(기준 max(높이, 폭 ÷ 4, 24) 를
 * 누르는 순간 잰다 · 모션 줄이기면 축소하지 않는다). 그 바탕 위에서는 설명을 fg-neutral-muted 로, 위험한 줄의 이름 · 아이콘을
 * fg-critical-contrast 로 바꾼다(누름 바탕 위 4.5:1). 키보드 포커스는 줄 안쪽 2px 링.
 * textOnly 는 이름을 가운데에 두고 아이콘 · 설명을 그리지 않는다(넘겨도 개발 중에 알리고 버린다).
 * 보조 기술용 닫기는 평소 보이지 않다가(읽기 프로그램은 읽는다) 키보드 초점이 오면 위 10 · 최소 52 · 좌우 20 · 모서리 12 ·
 * bg-neutral-weak · t5 500 의 폭 전체 버튼으로 보인다.
 *
 * 이 레포에서 더한 것(레시피에 없다) — MenuSheet 의 container · modal. 다크가 문서가 아니라 하위 요소에 걸린 곳(카탈로그의 다크 판)에서는
 * body 의 시트가 라이트 색을 받는다 — Bottom Sheet 와 같은 까닭이다.
 */

// 트리거의 이름 — aria-label, 없으면 보이는 글
function accessibleNameOf(el: HTMLElement | null) {
  if (!el) return "";
  return (el.getAttribute("aria-label") ?? el.textContent ?? "").trim();
}

// ── 시트 문맥 ─────────────────────────────────────────────────
type MenuSheetContextValue = {
  open: boolean;
  setOpen: OpenChange;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** 줄을 골랐다 — 시트를 닫고, 다 닫히면 run 을 부른다 */
  select: (run?: () => void) => void;
  /** 닫힘이 끝났다(초점이 트리거로 돌아온 뒤) — 기다리던 동작을 부른다 */
  flushSelect: () => void;
};
const MenuSheetContext = React.createContext<MenuSheetContextValue | null>(
  null,
);

function useMenuSheet(name: string) {
  const ctx = React.useContext(MenuSheetContext);
  if (!ctx) throw new Error(`${name} 는 MenuSheet 안에 둔다.`);
  return ctx;
}

const LayoutContext = React.createContext<MenuSheetLayout>("textWithIcon");

export interface MenuSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: OpenChange;
  /** 띄울 자리 — 기본 document.body. 다크가 하위 요소에 걸린 곳(카탈로그의 다크 판)에서 그 안의 요소로 */
  container?: HTMLElement | null;
  /** false 면 모달 부작용(초점 가둠 · 뒤 화면 숨김 · 스크롤 잠금)을 끈다 — 카탈로그 · 문서 전용 */
  modal?: boolean;
  children?: React.ReactNode;
}

function MenuSheet({
  open: openProp,
  defaultOpen,
  onOpenChange,
  container,
  modal,
  children,
}: MenuSheetProps) {
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const pending = usePendingSelect();
  const select = (run?: () => void) => {
    pending.queue(run);
    setOpen(false);
  };
  const value: MenuSheetContextValue = {
    open,
    setOpen,
    triggerRef,
    select,
    flushSelect: () => pending.flush(),
  };
  return (
    <MenuSheetContext.Provider value={value}>
      {/* 입력 폼이 아니라서 바깥(딤) 누르기 · 끌어내리기로 닫힌다 — 끌기는 시트 어디서나(손잡이만이 아니다) */}
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        container={container}
        modal={modal}
      >
        {children}
      </BottomSheet>
    </MenuSheetContext.Provider>
  );
}
MenuSheet.displayName = "MenuSheet";

const MenuSheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BottomSheetTrigger>
>((props, ref) => {
  const ctx = useMenuSheet("MenuSheetTrigger");
  // aria-haspopup="dialog" · aria-expanded · aria-controls 는 Bottom Sheet 의 트리거(Radix Dialog)가 단다
  return (
    <BottomSheetTrigger
      ref={mergeRefs(ref, ctx.triggerRef)}
      data-slot="menu-sheet-trigger"
      {...props}
    />
  );
});
MenuSheetTrigger.displayName = "MenuSheetTrigger";

export interface MenuSheetContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof BottomSheetSurface>,
  "title" | "handle"
> {
  /** 제목 — 무엇의 동작인지("주간 회의 메모"). 없으면 aria-label, 그것도 없으면 트리거의 이름을 숨은 제목으로 단다 */
  title?: React.ReactNode;
  /** 설명 — 제목만으로 모자랄 때만 */
  description?: React.ReactNode;
  /** textWithIcon(기본) — 아이콘 + 글, 글은 왼쪽. textOnly — 글만 가운데(줄 설명 · 아이콘을 두지 않는다). 한 시트에서 섞지 않는다 */
  layout?: MenuSheetLayout;
}

const MenuSheetContent = React.forwardRef<
  React.ElementRef<typeof BottomSheetSurface>,
  MenuSheetContentProps
>(
  (
    {
      title,
      description,
      layout = "textWithIcon",
      className,
      children,
      onCloseAutoFocus,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const ctx = useMenuSheet("MenuSheetContent");
    const { open, triggerRef, flushSelect } = ctx;
    const hasTitle = title != null;
    const hasHeader = hasTitle || description != null;
    // 제목이 없을 때의 이름 — aria-label, 없으면 트리거의 이름(열 때마다 다시 읽는다 — 줄 이름이 바뀔 수 있다)
    const [triggerName, setTriggerName] = React.useState("");
    React.useLayoutEffect(() => {
      if (open) setTriggerName(accessibleNameOf(triggerRef.current));
    }, [open, triggerRef]);
    const hiddenName = hasTitle ? "" : ariaLabel?.trim() || triggerName;
    React.useEffect(() => {
      if (
        import.meta.env.DEV &&
        open &&
        !hasTitle &&
        !ariaLabel?.trim() &&
        !accessibleNameOf(triggerRef.current)
      ) {
        console.warn(
          '[MenuSheet] 제목이 없으면 aria-label 로 이름을 단다(예: "주간 회의 메모") — 트리거에도 이름이 없다.',
          triggerRef.current,
        );
      }
    }, [open, triggerRef, hasTitle, ariaLabel]);
    return (
      <LayoutContext.Provider value={layout}>
        <BottomSheetSurface
          ref={ref}
          handle="always"
          data-slot="menu-sheet-content"
          data-layout={layout}
          // 설명이 없으면 aria-describedby 를 걷는다(가리킬 곳이 없다)
          {...(description == null ? { "aria-describedby": undefined } : null)}
          className={cn(MENU_SHEET_SURFACE, className)}
          // 다 닫혔다 — 바탕이 초점을 트리거로 돌린 뒤(같은 처리 안에서 이어진다) 고른 줄의 동작을 부른다
          onCloseAutoFocus={(e) => {
            onCloseAutoFocus?.(e);
            queueMicrotask(flushSelect);
          }}
          {...props}
        >
          {hasHeader && (
            <div data-slot="menu-sheet-header" className={MENU_SHEET_HEADER}>
              {hasTitle && (
                <DrawerPrimitive.Title
                  data-slot="menu-sheet-title"
                  className={MENU_SHEET_TITLE}
                >
                  {title}
                </DrawerPrimitive.Title>
              )}
              {description != null && (
                <DrawerPrimitive.Description
                  data-slot="menu-sheet-description"
                  className={MENU_SHEET_DESCRIPTION}
                >
                  {description}
                </DrawerPrimitive.Description>
              )}
            </div>
          )}
          {/* 보이는 제목이 없을 때 — aria-label 이나 트리거의 이름을 숨은 제목으로(Radix Dialog 는 제목을 찾는다) */}
          {!hasTitle && (
            <DrawerPrimitive.Title className="sr-only">
              {hiddenName}
            </DrawerPrimitive.Title>
          )}
          <div data-slot="menu-sheet-list" className={MENU_SHEET_LIST}>
            {children}
          </div>
          <button
            type="button"
            data-slot="menu-sheet-close"
            className={MENU_SHEET_CLOSE}
            onClick={() => ctx.setOpen(false)}
          >
            닫기
          </button>
        </BottomSheetSurface>
      </LayoutContext.Provider>
    );
  },
);
MenuSheetContent.displayName = "MenuSheetContent";

const MenuSheetGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="menu-sheet-group"
    className={cn(MENU_SHEET_GROUP, className)}
    {...props}
  />
));
MenuSheetGroup.displayName = "MenuSheetGroup";

export interface MenuSheetItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect" | "children"
> {
  /** 이름 — 동사로 짧게(Menu 와 같다) */
  label: React.ReactNode;
  /** 설명 — 이름이 추상적이라 잘못 누를 수 있을 때만. textOnly 에서는 두지 않는다 */
  description?: React.ReactNode;
  /** 앞 아이콘(lucide) — 모든 줄에 두거나 모두 뺀다. textOnly 에서는 두지 않는다 */
  icon?: React.ReactNode;
  /** critical — 되돌릴 수 없는 동작(삭제 · 나가기). 이름 · 아이콘만 빨갛다 */
  tone?: "neutral" | "critical";
  /** 시트가 다 닫히고 초점이 트리거로 돌아온 뒤 부른다 */
  onSelect?: () => void;
}

const MenuSheetItem = React.forwardRef<HTMLButtonElement, MenuSheetItemProps>(
  (
    {
      label,
      description,
      icon,
      tone = "neutral",
      disabled = false,
      onSelect,
      className,
      onClick,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const ctx = useMenuSheet("MenuSheetItem");
    const layout = React.useContext(LayoutContext);
    const textOnly = layout === "textOnly";
    React.useEffect(() => {
      if (
        import.meta.env.DEV &&
        textOnly &&
        (icon != null || description != null)
      ) {
        console.warn(
          "[MenuSheet] textOnly 시트의 줄에는 아이콘 · 설명을 두지 않는다 — 그리지 않는다.",
          label,
        );
      }
    }, [textOnly, icon, description, label]);
    // 누른 자리 — 끌거나 줄 밖에서 떼면 실행하지 않는다(아래 onClick)
    const downRef = React.useRef<{ x: number; y: number } | null>(null);
    const colors = MENU_SHEET_TONE[tone];
    const fg = disabled ? "text-fg-disabled" : colors.fg;
    const descriptionColor = disabled ? "text-fg-disabled" : colors.description;
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        data-slot="menu-sheet-item"
        data-tone={tone}
        className={cn(
          MENU_SHEET_ITEM,
          !disabled && MENU_SHEET_ITEM_ENABLED,
          className,
        )}
        onPointerDown={(e) => {
          measurePress(e.currentTarget);
          downRef.current = { x: e.clientX, y: e.clientY };
          onPointerDown?.(e);
        }}
        onKeyDown={(e) => {
          if (isPressKey(e)) measurePress(e.currentTarget);
          onKeyDown?.(e);
        }}
        onClick={(e) => {
          onClick?.(e);
          const down = downRef.current;
          downRef.current = null;
          if (e.defaultPrevented || disabled) return;
          // 포인터로 누른 채 끌었거나(시트를 끌어내리다 놓음) 줄 밖에서 뗐다 — 실행하지 않는다. vaul 이 누른 줄에 포인터를 붙잡아
          // 두어 어디서 떼든 이 줄에 click 이 온다(버튼이 원래 하는 "밖에서 떼면 취소"가 사라진다)
          if (e.detail > 0) {
            const r = e.currentTarget.getBoundingClientRect();
            const outside =
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom;
            const dragged =
              down !== null &&
              Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10;
            if (outside || dragged) return;
          }
          ctx.select(onSelect);
        }}
        {...props}
      >
        <span
          data-slot="menu-sheet-item-content"
          className={cn(
            MENU_SHEET_ITEM_CONTENT,
            textOnly && "justify-center",
            !disabled && MENU_SHEET_ITEM_CONTENT_PRESS,
          )}
        >
          {!textOnly && icon != null && (
            <span
              aria-hidden
              data-slot="menu-sheet-item-icon"
              className={cn("flex shrink-0 [&>svg]:size-[22px]", fg)}
            >
              {icon}
            </span>
          )}
          <span
            className={cn(
              "flex min-w-0 flex-col gap-x0_5 break-keep [overflow-wrap:break-word]",
              textOnly
                ? "items-center text-center"
                : "flex-1 items-start text-left",
            )}
          >
            <span
              data-slot="menu-sheet-item-label"
              className={cn("text-t5 font-normal", fg)}
            >
              {label}
            </span>
            {!textOnly && description != null && (
              <span
                data-slot="menu-sheet-item-description"
                className={cn("text-t3 font-medium", descriptionColor)}
              >
                {description}
              </span>
            )}
          </span>
        </span>
      </button>
    );
  },
);
MenuSheetItem.displayName = "MenuSheetItem";

export {
  MenuSheet,
  MenuSheetTrigger,
  MenuSheetContent,
  MenuSheetGroup,
  MenuSheetItem,
};
