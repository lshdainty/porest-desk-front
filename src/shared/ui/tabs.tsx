import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib"

/*
 * Porest Tabs — porest-design specs/components/tabs.md SoT 기반.
 * Phase 2 마이그레이션: porest 토큰 + desk-front variants(pill/underline) 보존.
 *
 * 2 variants:
 *   pill (default): bg-surface-input 컨테이너 + active bg-surface-default + shadow-sm.
 *                   = tabs.md container variant. 설정/form section·보조 컨트롤.
 *   underline: bottom border + active 2px primary 색. 절제 톤 페이지 네비게이션.
 *
 * size (pill 전용 — tabs.md Container size variant):
 *   default: list h-10(40) / trigger min-h-8(32) · 4×12 · label-md(14)
 *   sm:      list h-8(32)  / trigger min-h-7(28) · 4×8  · label-sm(13)  ← 데스크 보조 컨트롤
 *   size 는 TabsList 에서 받아 context 로 TabsTrigger 에 전파.
 *
 * - Radix Tabs 베이스. 키보드 네비/ARIA 자동.
 */

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva("", {
  variants: {
    variant: {
      pill: "inline-flex items-center justify-center rounded-sm bg-surface-input gap-1 text-text-secondary",
      underline:
        "flex gap-0 border-b border-border-default bg-transparent p-0 h-auto rounded-none",
      // tabs.md pills variant — 트랙 없는 평면 배치(카테고리 필터·거래 종류 등 모바일 nav)
      pills: "inline-flex items-center gap-[var(--spacing-xs)] bg-transparent",
    },
    size: { default: "", sm: "" },
  },
  compoundVariants: [
    { variant: "pill", size: "default", class: "h-10 p-[var(--spacing-xs)]" },
    { variant: "pill", size: "sm", class: "h-8 p-0.5" },
  ],
  defaultVariants: { variant: "pill", size: "default" },
})

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-sans font-medium ring-offset-bg-page transition-all duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        pill: "rounded-xs data-[state=active]:bg-surface-default data-[state=active]:text-text-primary data-[state=active]:shadow-sm",
        underline:
          "rounded-none px-3.5 py-2.5 text-[13px] text-text-secondary border-b-2 border-transparent -mb-px hover:text-text-primary data-[state=active]:text-[var(--fg-brand)] data-[state=active]:border-[var(--border-brand)] data-[state=active]:font-semibold",
        // tabs.md pills — soft rectangle radius-md + active primary fill + on-accent 흰색.
        // active fill = fg-brand(다크에서 primary-light swap, 앱 t.bgBrand 정합). 완전 둥근 chip 대신 토스 톤.
        // 크기는 size(default/sm) compoundVariant 로 — sm 은 모바일용 얇은 pill.
        pills:
          "leading-none rounded-md text-text-secondary hover:text-text-primary data-[state=active]:bg-[var(--fg-brand)] data-[state=active]:text-[var(--fg-on-brand)] data-[state=active]:font-semibold data-[state=active]:hover:text-[var(--fg-on-brand)]",
      },
      size: { default: "", sm: "" },
    },
    compoundVariants: [
      {
        variant: "pill",
        size: "default",
        class:
          "min-h-8 px-[var(--spacing-md)] py-[var(--spacing-xs)] text-label-md",
      },
      {
        variant: "pill",
        size: "sm",
        class:
          "min-h-7 px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-label-sm",
      },
      // pills default — px-md py-sm label-md (페이지 nav). sm — 얇은 pill(모바일 카테고리 필터).
      {
        variant: "pills",
        size: "default",
        class: "px-[var(--spacing-md)] py-[var(--spacing-sm)] text-label-md",
      },
      {
        variant: "pills",
        size: "sm",
        class:
          "min-h-7 px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-label-sm",
      },
    ],
    defaultVariants: { variant: "pill", size: "default" },
  },
)

// pill size 를 List → Trigger 로 전파 (trigger 마다 size 재지정 불필요)
type TabsCtx = VariantProps<typeof tabsTriggerVariants>
const TabsContext = React.createContext<TabsCtx>({})

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, size, ...props }, ref) => (
  <TabsContext.Provider value={{ variant, size }}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  </TabsContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> &
  VariantProps<typeof tabsTriggerVariants>

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, size, ...props }, ref) => {
  const ctx = React.useContext(TabsContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTriggerVariants({
          variant: variant ?? ctx.variant,
          size: size ?? ctx.size,
        }),
        className,
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-[var(--spacing-sm)] ring-offset-bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
