import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ds/tooltip";

import {
  ContentContext,
  isModifiedClick,
  isPressKey,
  measurePress,
  mergeRefs,
  RootContext,
  type RootContextValue,
  SubPlacementContext,
  type SubPlacement,
} from "./side-navigation-context";
import {
  CHEVRON,
  FLYOUT,
  FLYOUT_CLOSE_DELAY,
  FLYOUT_ITEM,
  FLYOUT_ITEM_CONTENT,
  FLYOUT_ITEM_CONTENT_PRESS,
  FLYOUT_LABEL,
  FLYOUT_OPEN_DELAY,
  FLYOUT_PILL,
  FLYOUT_PILL_CURRENT,
  FLYOUT_PILL_OTHER,
  ITEM,
  ITEM_COLLAPSED,
  ITEM_CONTENT,
  ITEM_CONTENT_PRESS,
  ITEM_CURRENT,
  ITEM_DISABLED,
  ITEM_HOVER,
  ITEM_ICON,
  ITEM_LABEL,
  SUB_ITEM,
  SUB_LIST,
  SUB_LIST_CLOSED,
  SUB_LIST_OPEN,
  tone,
} from "./side-navigation-variants";

/*
 * Side Navigation 의 항목 · 하위 항목 · 접힌 부모의 펼침 메뉴 — 규칙은 side-navigation.tsx 머리 주석(Side Navigation 한 벌).
 *
 *   SideNavigationItem     하위가 없으면 링크(LeafItem — 접히면 이름 말풍선), 자식으로 SideNavigationSubItem 이 있으면 부모(ParentItem —
 *                          펼치기만 · 접히면 FlyoutParent 의 펼침 메뉴)
 *   SideNavigationSubItem  하위 항목 — 부모 아래 목록(이름만, 40 에서 시작) 또는 펼침 메뉴의 줄(44 · 알약)
 *
 * 하위 항목은 SideNavigationItem 의 직접 자식으로 둔다 — 부모가 자식의 current 를 읽어 저절로 펼치고(접히면 지금 항목이 된다),
 * 컴포넌트로 감싸면 그 prop 을 읽을 수 없다(배열을 돌려주는 함수는 된다).
 */

type SubItemElement = React.ReactElement<SideNavigationSubItemProps>;
// 부모 버튼에 넘길 속성 — title · data-* · aria-* 만(링크의 속성 · 이벤트 처리기는 넘기지 않는다. id 는 하위 목록 · 펼침 메뉴가 이름으로 쓴다)
function buttonAttributes(props: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "title" || key.startsWith("aria-") || key.startsWith("data-"))
      out[key] = value;
  }
  return out as React.HTMLAttributes<HTMLButtonElement>;
}
const subItemsOf = (children: React.ReactNode) =>
  React.Children.toArray(children).filter((c): c is SubItemElement =>
    React.isValidElement(c),
  );

// ── 항목 ─────────────────────────────────────────────────────
export interface SideNavigationItemProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "children"
> {
  /** 그 화면 주소 — 하위가 없는 항목 */
  href?: string;
  /** lucide 선 아이콘 — 20 */
  icon: React.ReactNode;
  /** 이름 — 화면 이름과 같게, 짧게 */
  label: string;
  /** 지금 화면 — aria-current="page" */
  current?: boolean;
  /** 막힌 항목 — 누르지 못한다 */
  disabled?: boolean;
  /** 부모 — 처음부터 펼친다(하위가 지금이면 주지 않아도 펼친다) */
  defaultOpen?: boolean;
  /** 하위 항목(SideNavigationSubItem) — 주면 부모가 된다(펼치기만, 이동하지 않는다) */
  children?: React.ReactNode;
}

const SideNavigationItem = React.forwardRef<
  HTMLElement,
  SideNavigationItemProps
>((props, ref) => {
  const subs = subItemsOf(props.children);
  if (subs.length > 0) return <ParentItem ref={ref} {...props} subs={subs} />;
  return <LeafItem ref={ref as React.Ref<HTMLAnchorElement>} {...props} />;
});
SideNavigationItem.displayName = "SideNavigationItem";

// 하위가 없는 항목 — 링크. 접히면 이름 말풍선(오른쪽)
const LeafItem = React.forwardRef<HTMLAnchorElement, SideNavigationItemProps>(
  (
    {
      href,
      icon,
      label,
      current = false,
      disabled = false,
      defaultOpen: _defaultOpen,
      className,
      onClick,
      onPointerDown,
      onKeyDown,
      children: _children,
      ...props
    },
    ref,
  ) => {
    const root = React.useContext(RootContext);
    const content = React.useContext(ContentContext);
    const collapsed = root?.collapsed ?? false;
    const hidden = root?.labelsHidden ?? false;
    const colors = tone(current, disabled);
    const link = (
      <a
        ref={ref}
        href={disabled ? undefined : href}
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        aria-current={current ? "page" : undefined}
        data-slot="side-navigation-item"
        data-current={current || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          ITEM,
          collapsed && ITEM_COLLAPSED,
          disabled ? ITEM_DISABLED : current ? ITEM_CURRENT : ITEM_HOVER,
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
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
          if (!isModifiedClick(e)) content.onNavigate?.();
        }}
        {...props}
      >
        <span
          data-slot="side-navigation-item-content"
          className={cn(ITEM_CONTENT, !disabled && ITEM_CONTENT_PRESS)}
        >
          <span
            aria-hidden
            data-slot="side-navigation-item-icon"
            className={cn(ITEM_ICON, colors.icon)}
          >
            {icon}
          </span>
          <span
            data-slot="side-navigation-item-label"
            className={hidden ? "sr-only" : cn(ITEM_LABEL, colors.label)}
          >
            {label}
          </span>
        </span>
      </a>
    );
    return (
      <li className="flex">
        {root ? (
          // 접혔을 때만 이름 말풍선 — 이름과 같은 글이라 aria-describedby 로 잇지 않는다
          <Tooltip disabled={!collapsed}>
            <TooltipTrigger asChild aria-describedby={undefined}>
              {link}
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        )}
      </li>
    );
  },
);
LeafItem.displayName = "SideNavigationLeafItem";

// 하위가 있는 항목 — 펼치기만 한다. 접히면 펼침 메뉴
const ParentItem = React.forwardRef<
  HTMLElement,
  SideNavigationItemProps & { subs: SubItemElement[] }
>(
  (
    {
      icon,
      label,
      disabled = false,
      defaultOpen = false,
      subs,
      className,
      href: _href,
      current: _current,
      children: _children,
      ...rest
    },
    ref,
  ) => {
    // 부모는 버튼 — 링크 전용 속성(href · target · 이벤트)은 넘기지 않고 title · data-* · aria-* 만
    const attributes = buttonAttributes(rest);
    const root = React.useContext(RootContext);
    const collapsed = root?.collapsed ?? false;
    const hidden = root?.labelsHidden ?? false;
    const hasCurrentChild = subs.some((s) => s.props.current);
    const [open, setOpen] = React.useState(defaultOpen || hasCurrentChild);
    // 하위가 지금 화면이 되면 저절로 펼친다
    const [prevCurrent, setPrevCurrent] = React.useState(hasCurrentChild);
    if (prevCurrent !== hasCurrentChild) {
      setPrevCurrent(hasCurrentChild);
      if (hasCurrentChild) setOpen(true);
    }
    const baseId = React.useId();
    const buttonId = `${baseId}button`;
    const listId = `${baseId}list`;
    // 접혔을 때는 하위가 지금인 부모가 지금 항목이다
    const current = collapsed && hasCurrentChild;
    const colors = tone(current, disabled);
    const press = {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) =>
        measurePress(e.currentTarget),
      onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isPressKey(e)) measurePress(e.currentTarget);
      },
    };
    const inner = (
      <span
        data-slot="side-navigation-item-content"
        className={cn(ITEM_CONTENT, !disabled && ITEM_CONTENT_PRESS)}
      >
        <span
          aria-hidden
          data-slot="side-navigation-item-icon"
          className={cn(ITEM_ICON, colors.icon)}
        >
          {icon}
        </span>
        <span
          data-slot="side-navigation-item-label"
          className={hidden ? "sr-only" : cn(ITEM_LABEL, colors.label)}
        >
          {label}
        </span>
        {!collapsed && (
          <ChevronDown
            aria-hidden
            data-slot="side-navigation-chevron"
            className={cn(CHEVRON, open && "rotate-180")}
          />
        )}
      </span>
    );
    const itemClass = cn(
      ITEM,
      collapsed && ITEM_COLLAPSED,
      disabled ? ITEM_DISABLED : current ? ITEM_CURRENT : ITEM_HOVER,
      className,
    );

    if (collapsed && root) {
      return (
        <FlyoutParent
          ref={ref as React.Ref<HTMLButtonElement>}
          root={root}
          buttonId={buttonId}
          label={label}
          disabled={disabled}
          className={itemClass}
          press={press}
          subs={subs}
          attributes={attributes}
          current={current}
        >
          {inner}
        </FlyoutParent>
      );
    }
    return (
      <li className="flex flex-col">
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          id={buttonId}
          disabled={disabled}
          aria-expanded={open}
          aria-controls={listId}
          data-slot="side-navigation-item"
          data-parent=""
          data-state={open ? "open" : "closed"}
          {...attributes}
          className={itemClass}
          onClick={() => setOpen((o) => !o)}
          {...press}
        >
          {inner}
        </button>
        <div
          data-slot="side-navigation-sub-list"
          data-state={open ? "open" : "closed"}
          className={cn(SUB_LIST, open ? SUB_LIST_OPEN : SUB_LIST_CLOSED)}
        >
          <ul
            id={listId}
            aria-labelledby={buttonId}
            className="m-0 flex min-h-0 list-none flex-col overflow-hidden p-0"
          >
            {subs}
          </ul>
        </div>
      </li>
    );
  },
);
ParentItem.displayName = "SideNavigationParentItem";

type FlyoutMode = "hover" | "pinned";

// 접힌 부모 — 아이콘 옆 펼침 메뉴(Radix Popover 비모달 · 사이드바 안에 그린다)
const FlyoutParent = React.forwardRef<
  HTMLButtonElement,
  {
    root: RootContextValue;
    buttonId: string;
    label: string;
    current: boolean;
    disabled: boolean;
    className: string;
    press: {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
      onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
    };
    subs: SubItemElement[];
    attributes: React.HTMLAttributes<HTMLButtonElement>;
    children: React.ReactNode;
  }
>(
  (
    {
      root,
      buttonId,
      label,
      current,
      disabled,
      className,
      press,
      subs,
      attributes,
      children,
    },
    ref,
  ) => {
    const flyoutId = `${buttonId}flyout`;
    const open = root.activeFlyout === flyoutId;
    const { setActiveFlyout } = root;
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const modeRef = React.useRef<FlyoutMode>("hover");
    const focusFirstRef = React.useRef(false);
    const escapedRef = React.useRef(false);
    const hoverRef = React.useRef({ trigger: false, content: false });
    const openTimer = React.useRef<number | undefined>(undefined);
    const closeTimer = React.useRef<number | undefined>(undefined);
    const activeRef = React.useRef(root.activeFlyout);
    React.useLayoutEffect(() => {
      activeRef.current = root.activeFlyout;
    });

    const clearTimers = () => {
      window.clearTimeout(openTimer.current);
      window.clearTimeout(closeTimer.current);
    };
    // 사라질 때(펴졌다 · 화면을 떠났다) — 기다림을 거두고 열려 있었으면 닫는다
    React.useEffect(
      () => () => {
        window.clearTimeout(openTimer.current);
        window.clearTimeout(closeTimer.current);
        if (activeRef.current === flyoutId) setActiveFlyout(null);
      },
      [flyoutId, setActiveFlyout],
    );

    const show = (mode: FlyoutMode, focusFirst = false) => {
      clearTimers();
      modeRef.current = mode;
      focusFirstRef.current = focusFirst;
      setActiveFlyout(flyoutId);
    };
    const hide = () => {
      clearTimers();
      if (activeRef.current === flyoutId) setActiveFlyout(null);
    };
    // 트리거 · 메뉴를 모두 떠나면 100ms 뒤 — 마우스로 연 것만(누르거나 키보드로 연 것은 붙들어 둔다)
    const scheduleClose = () => {
      window.clearTimeout(closeTimer.current);
      if (modeRef.current !== "hover") return;
      closeTimer.current = window.setTimeout(() => {
        if (!hoverRef.current.trigger && !hoverRef.current.content) hide();
      }, FLYOUT_CLOSE_DELAY);
    };
    const hover = (
      part: "trigger" | "content",
      inside: boolean,
      e: React.PointerEvent,
    ) => {
      if (e.pointerType === "touch") return;
      hoverRef.current[part] = inside;
      if (inside) {
        window.clearTimeout(closeTimer.current);
        if (part === "trigger" && !open && !disabled) {
          window.clearTimeout(openTimer.current);
          // 다른 펼침 메뉴가 열려 있으면 바로
          if (activeRef.current !== null) show("hover");
          else
            openTimer.current = window.setTimeout(
              () => hoverRef.current.trigger && show("hover"),
              FLYOUT_OPEN_DELAY,
            );
        }
        return;
      }
      if (part === "trigger") window.clearTimeout(openTimer.current);
      scheduleClose();
    };

    const rows = () =>
      Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>(
          '[data-slot="side-navigation-flyout-item"]:not([aria-disabled])',
        ) ?? [],
      );
    const placement: SubPlacement = { kind: "flyout", close: hide };

    return (
      <li className="flex">
        <PopoverPrimitive.Root
          open={open}
          onOpenChange={(next) => (next ? show("pinned") : hide())}
        >
          <PopoverPrimitive.Anchor asChild>
            <button
              ref={mergeRefs(ref, buttonRef)}
              type="button"
              id={buttonId}
              disabled={disabled}
              aria-expanded={open}
              aria-controls={open ? flyoutId : undefined}
              data-slot="side-navigation-item"
              data-parent=""
              data-current={current || undefined}
              data-state={open ? "open" : "closed"}
              {...attributes}
              className={className}
              onPointerEnter={(e) => hover("trigger", true, e)}
              onPointerLeave={(e) => hover("trigger", false, e)}
              onClick={(e) => {
                // 키보드(Enter · Space — detail 0)로 열면 첫 줄로 초점. 마우스로 열린 메뉴는 붙들어 두고, 붙든 메뉴는 닫는다
                if (!open) show("pinned", e.detail === 0);
                else if (modeRef.current === "hover")
                  modeRef.current = "pinned";
                else hide();
              }}
              onKeyDown={(e) => {
                press.onKeyDown(e);
                // 열린 동안 Tab 은 메뉴의 첫 줄로(메뉴는 사이드바 끝에 그려진다 — 디스클로저의 차례를 지킨다)
                if (e.key === "Tab" && !e.shiftKey && open) {
                  const first = rows()[0];
                  if (!first) return;
                  e.preventDefault();
                  modeRef.current = "pinned";
                  first.focus();
                }
              }}
              onPointerDown={press.onPointerDown}
            >
              {children}
            </button>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal container={root.portal}>
            <PopoverPrimitive.Content
              ref={contentRef}
              id={flyoutId}
              role="group"
              aria-labelledby={buttonId}
              data-slot="side-navigation-flyout"
              side="right"
              align="start"
              sideOffset={8}
              collisionPadding={8}
              className={FLYOUT}
              onOpenAutoFocus={(e) => {
                // 키보드로 열었으면 첫 줄로, 마우스 · 터치로 열었으면 초점을 옮기지 않는다
                e.preventDefault();
                if (focusFirstRef.current) rows()[0]?.focus();
                focusFirstRef.current = false;
              }}
              onCloseAutoFocus={(e) => {
                // Esc 로 닫았으면 부모로. 그 밖에는(마우스가 떠남 · 바깥 · Tab) 초점을 옮기지 않는다
                e.preventDefault();
                if (escapedRef.current && buttonRef.current?.isConnected)
                  buttonRef.current.focus({ preventScroll: true });
                escapedRef.current = false;
              }}
              onEscapeKeyDown={() => {
                escapedRef.current = true;
              }}
              // 부모를 누르면 바깥 누르기가 아니다 — 부모의 누르기가 열고 닫는다
              onInteractOutside={(e) => {
                if (
                  e.target instanceof Node &&
                  buttonRef.current?.contains(e.target)
                )
                  e.preventDefault();
              }}
              onPointerEnter={(e) => hover("content", true, e)}
              onPointerLeave={(e) => hover("content", false, e)}
              onKeyDown={(e) => {
                if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey)
                  return;
                const list = rows();
                const at = list.indexOf(e.target as HTMLElement);
                const button = buttonRef.current;
                if (!button) return;
                if (e.shiftKey && at === 0) {
                  // 첫 줄에서 Shift+Tab — 부모로
                  e.preventDefault();
                  button.focus({ preventScroll: true });
                  hide();
                } else if (!e.shiftKey && at === list.length - 1) {
                  // 마지막 줄에서 Tab — 부모에 초점을 두면 브라우저의 Tab 이 부모 다음 칸으로 간다
                  button.focus({ preventScroll: true });
                  hide();
                }
              }}
            >
              <div
                aria-hidden
                data-slot="side-navigation-flyout-label"
                className={FLYOUT_LABEL}
              >
                {label}
              </div>
              <SubPlacementContext.Provider value={placement}>
                <ul className="m-0 flex list-none flex-col p-0">{subs}</ul>
              </SubPlacementContext.Provider>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </li>
    );
  },
);
FlyoutParent.displayName = "SideNavigationFlyoutParent";

// ── 하위 항목 ────────────────────────────────────────────────
export interface SideNavigationSubItemProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "children"
> {
  href: string;
  label: string;
  current?: boolean;
  disabled?: boolean;
}

const SideNavigationSubItem = React.forwardRef<
  HTMLAnchorElement,
  SideNavigationSubItemProps
>(
  (
    {
      href,
      label,
      current = false,
      disabled = false,
      className,
      onClick,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const placement = React.useContext(SubPlacementContext);
    const content = React.useContext(ContentContext);
    const flyout = placement.kind === "flyout";
    const common = {
      ref,
      href: disabled ? undefined : href,
      role: disabled ? "link" : undefined,
      "aria-disabled": disabled || undefined,
      "aria-current": current ? ("page" as const) : undefined,
      "data-current": current || undefined,
      "data-disabled": disabled || undefined,
      onPointerDown: (e: React.PointerEvent<HTMLAnchorElement>) => {
        measurePress(e.currentTarget);
        onPointerDown?.(e);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (isPressKey(e)) measurePress(e.currentTarget);
        onKeyDown?.(e);
      },
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
        if (isModifiedClick(e)) return;
        content.onNavigate?.();
        if (placement.kind === "flyout") placement.close();
      },
    };
    if (flyout) {
      return (
        <li className="flex flex-col">
          <a
            {...common}
            data-slot="side-navigation-flyout-item"
            className={cn(
              FLYOUT_ITEM,
              disabled
                ? "cursor-not-allowed text-fg-disabled"
                : "cursor-pointer text-fg-neutral",
              className,
            )}
            {...props}
          >
            {!disabled && (
              <span
                aria-hidden
                className={cn(
                  FLYOUT_PILL,
                  current ? FLYOUT_PILL_CURRENT : FLYOUT_PILL_OTHER,
                )}
              />
            )}
            <span
              className={cn(
                FLYOUT_ITEM_CONTENT,
                !disabled && FLYOUT_ITEM_CONTENT_PRESS,
              )}
            >
              {label}
            </span>
          </a>
        </li>
      );
    }
    const colors = tone(current, disabled);
    return (
      <li className="flex">
        <a
          {...common}
          data-slot="side-navigation-sub-item"
          className={cn(
            ITEM,
            SUB_ITEM,
            disabled ? ITEM_DISABLED : current ? ITEM_CURRENT : ITEM_HOVER,
            className,
          )}
          {...props}
        >
          <span className={cn(ITEM_CONTENT, !disabled && ITEM_CONTENT_PRESS)}>
            <span className={cn(ITEM_LABEL, colors.label)}>{label}</span>
          </span>
        </a>
      </li>
    );
  },
);
SideNavigationSubItem.displayName = "SideNavigationSubItem";

export { SideNavigationItem, SideNavigationSubItem };
