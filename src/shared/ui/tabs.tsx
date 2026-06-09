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
 *                   설정/form section 토글에 적합.
 *   underline: bottom border + active 2px primary 색.
 *              절제 톤 페이지 네비게이션에 적합.
 *
 * - Radix Tabs 베이스. 키보드 네비/ARIA 자동.
 * - manual activation 기본 — focus와 selection 분리(screen reader 보호).
 */

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva("", {
  variants: {
    variant: {
      pill: "inline-flex h-10 items-center justify-center rounded-sm bg-surface-input p-[var(--spacing-xs)] gap-1 text-text-secondary",
      underline:
        "flex gap-0 border-b border-border-default bg-transparent p-0 h-auto rounded-none",
    },
  },
  defaultVariants: { variant: "pill" },
})

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-sans font-medium ring-offset-bg-page transition-all duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        pill: "rounded-xs px-[var(--spacing-md)] py-[var(--spacing-xs)] text-label-md data-[state=active]:bg-surface-default data-[state=active]:text-text-primary data-[state=active]:shadow-sm",
        underline:
          "rounded-none px-3.5 py-2.5 text-[13px] text-text-secondary border-b-2 border-transparent -mb-px hover:text-text-primary data-[state=active]:text-[var(--fg-brand)] data-[state=active]:border-[var(--border-brand)] data-[state=active]:font-semibold",
      },
    },
    defaultVariants: { variant: "pill" },
  },
)

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> &
  VariantProps<typeof tabsTriggerVariants>

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
))
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
