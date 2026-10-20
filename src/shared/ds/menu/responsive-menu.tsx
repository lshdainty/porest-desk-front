import * as React from "react";

import { useInputButtonSurface } from "@/shared/ds/input-button";
import {
  MenuSheet,
  MenuSheetContent,
  MenuSheetGroup,
  MenuSheetItem,
  MenuSheetTrigger,
  type MenuSheetLayout,
} from "@/shared/ds/menu-sheet";
import { useOpenState } from "@/shared/ds/overlay";

import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuTrigger,
  type MenuContentProps,
  type MenuItemProps,
  type MenuProps,
  type MenuTriggerProps,
} from "./menu";

/*
 * Responsive Menu — 줄의 동작은 이것으로 짠다. 1280 이상 Menu, 미만 Menu Sheet(같은 줄 · 같은 순서 · 같은 막힘).
 * 경계는 Dialog · Input Button 과 같은 useInputButtonSurface 다. 열림은 ResponsiveMenu 가 들고 있어 열린 채 폭이 바뀌어도
 * 새 표면으로 이어진다. title · description · layout 은 Menu Sheet 에만 쓰인다(메뉴에는 머리가 없다), suffixIcon 은 메뉴에만.
 * groo-design recipes/shadcn/components/ui/menu.tsx 의 ResponsiveMenu * 를 파일로 나눴다(menu.tsx 는 컴포넌트가 많다).
 */

const ResponsiveContext = React.createContext<{ wide: boolean } | null>(null);

function useResponsive(name: string) {
  const ctx = React.useContext(ResponsiveContext);
  if (!ctx) throw new Error(`${name} 는 ResponsiveMenu 안에 둔다.`);
  return ctx;
}

// 1280 이상 Menu · 미만 Menu Sheet. 열림은 여기서 든다 — 열린 채 폭이 바뀌어도 새 표면으로 이어진다
function ResponsiveMenu({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
}: MenuProps) {
  const wide = useInputButtonSurface() === "popover";
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  return (
    <ResponsiveContext.Provider value={{ wide }}>
      {wide ? (
        <Menu open={open} onOpenChange={setOpen}>
          {children}
        </Menu>
      ) : (
        <MenuSheet open={open} onOpenChange={setOpen}>
          {children}
        </MenuSheet>
      )}
    </ResponsiveContext.Provider>
  );
}
ResponsiveMenu.displayName = "ResponsiveMenu";

const ResponsiveMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  MenuTriggerProps
>((props, ref) => {
  const { wide } = useResponsive("ResponsiveMenuTrigger");
  return wide ? (
    <MenuTrigger ref={ref} {...props} />
  ) : (
    <MenuSheetTrigger ref={ref} {...props} />
  );
});
ResponsiveMenuTrigger.displayName = "ResponsiveMenuTrigger";

export interface ResponsiveMenuContentProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Menu Sheet 의 제목 — 무엇의 동작인지("주간 회의 메모"). 1280 이상 메뉴에는 머리가 없다 */
  title?: React.ReactNode;
  /** Menu Sheet 의 설명 */
  description?: React.ReactNode;
  /** Menu Sheet 의 정렬 — textWithIcon(기본, 아이콘이 없어도 글은 왼쪽 · 설명을 그린다) | textOnly */
  layout?: MenuSheetLayout;
  /** 메뉴의 자리(1280 이상) — 기본 아래 · 트리거 오른쪽 끝(end). 왼쪽에 놓인 트리거는 start */
  side?: MenuContentProps["side"];
  align?: MenuContentProps["align"];
}

const ResponsiveMenuContent = React.forwardRef<
  HTMLDivElement,
  ResponsiveMenuContentProps
>(({ title, description, layout, side, align, ...props }, ref) => {
  const { wide } = useResponsive("ResponsiveMenuContent");
  return wide ? (
    <MenuContent ref={ref} side={side} align={align} {...props} />
  ) : (
    <MenuSheetContent
      ref={ref}
      title={title}
      description={description}
      layout={layout}
      {...props}
    />
  );
});
ResponsiveMenuContent.displayName = "ResponsiveMenuContent";

const ResponsiveMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { wide } = useResponsive("ResponsiveMenuGroup");
  return wide ? (
    <MenuGroup ref={ref} {...props} />
  ) : (
    <MenuSheetGroup ref={ref} {...props} />
  );
});
ResponsiveMenuGroup.displayName = "ResponsiveMenuGroup";

// 시트의 줄(<button>)에 넘길 속성 — 이름 · 모양 · aria-* · data-* 만(이벤트 처리기는 메뉴 줄(div)의 것이라 넘기지 않는다)
function sheetItemAttributes(
  props: Omit<
    MenuItemProps,
    | "label"
    | "description"
    | "icon"
    | "suffixIcon"
    | "tone"
    | "disabled"
    | "onSelect"
  >,
) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      key === "id" ||
      key === "className" ||
      key === "style" ||
      key === "title" ||
      key.startsWith("aria-") ||
      key.startsWith("data-")
    )
      out[key] = value;
  }
  return out as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect">;
}

// 줄 — 두 표면에 같은 이름 · 같은 순서 · 같은 막힘. suffixIcon 은 메뉴에만(시트의 줄에는 뒤 아이콘이 없다)
const ResponsiveMenuItem = React.forwardRef<HTMLElement, MenuItemProps>(
  ({ suffixIcon, ...props }, ref) => {
    const { wide } = useResponsive("ResponsiveMenuItem");
    if (wide)
      return (
        <MenuItem
          ref={ref as React.Ref<HTMLDivElement>}
          suffixIcon={suffixIcon}
          {...props}
        />
      );
    const { label, description, icon, tone, disabled, onSelect, ...rest } =
      props;
    return (
      <MenuSheetItem
        ref={ref as React.Ref<HTMLButtonElement>}
        label={label}
        description={description}
        icon={icon}
        tone={tone}
        disabled={disabled}
        onSelect={onSelect}
        {...sheetItemAttributes(rest)}
      />
    );
  },
);
ResponsiveMenuItem.displayName = "ResponsiveMenuItem";

export {
  ResponsiveMenu,
  ResponsiveMenuTrigger,
  ResponsiveMenuContent,
  ResponsiveMenuGroup,
  ResponsiveMenuItem,
};
