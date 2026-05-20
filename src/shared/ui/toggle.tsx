"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

/*
 * Porest Toggle — porest-design specs/components/toggle.md SoT 기반.
 * Phase 2 마이그레이션: porest 토큰 + desk-front variants(default/outline/segmented*) +
 * sizes(default/sm/lg) 보존.
 *
 * variants:
 *   default (borderless toolbar): bg-transparent + hover:bg-surface-input + on:bg-surface-input
 *   outline (독립 toggle): border-default + on:border-strong
 *   segmented (= solid): ToggleGroup variant="segmented" 와 — active = primary 채움 + 흰글씨 + bold + shadow (강조 톤)
 *   segmented-subtle: ToggleGroup variant="segmented-subtle" 와 — active = surface-input 채움 + 검정 + semi (토스 절제 톤)
 */
const toggleVariants = cva(
  [
    "inline-flex items-center justify-center gap-[var(--spacing-xs)] rounded-md font-medium",
    "ring-offset-bg-page transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // spec toggle-group.md visual=subtle on state — surface-input 채움 + text-primary + 600.
        // 기존엔 font-semibold 누락 → multiple toolbar (Bold/Italic/Underline) active 강조 약했음.
        default:
          "bg-transparent text-text-secondary hover:bg-surface-input hover:text-text-primary data-[state=on]:bg-surface-input data-[state=on]:text-text-primary data-[state=on]:font-semibold",
        outline:
          "border border-border-default bg-transparent text-text-secondary hover:bg-surface-input hover:text-text-primary data-[state=on]:bg-surface-input data-[state=on]:text-text-primary data-[state=on]:font-semibold data-[state=on]:border-border-default-strong",
        // POREST .p-seg__btn (solid) — segmented item, active 강조 톤.
        // spec toggle-group.md visual=solid 정합 — primary 채움 + 흰글씨 + bold + shadow.
        segmented: [
          "flex-1 gap-0 rounded-[var(--radius-sm)] bg-transparent px-3 py-1 whitespace-nowrap",
          "text-[length:var(--text-caption)] font-semibold leading-none text-text-secondary",
          "hover:bg-transparent hover:text-text-secondary",
          "data-[state=on]:bg-primary data-[state=on]:text-text-on-accent data-[state=on]:font-bold",
          "data-[state=on]:shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
        ].join(" "),
        // POREST .p-seg__btn--subtle — segmented item, 토스 절제 톤.
        // spec toggle-group.md visual=subtle 정합 — surface-input 채움 + 검정 + semi.
        "segmented-subtle": [
          "flex-1 gap-0 rounded-[var(--radius-sm)] bg-transparent px-3 py-1 whitespace-nowrap",
          "text-[length:var(--text-caption)] font-semibold leading-none text-text-secondary",
          "hover:bg-surface-input hover:text-text-primary",
          "data-[state=on]:bg-surface-input data-[state=on]:text-text-primary data-[state=on]:font-semibold",
        ].join(" "),
      },
      size: {
        default: "h-10 px-3 min-w-10 text-sm",
        sm: "h-9 px-2.5 min-w-9 text-[13px]",
        lg: "h-11 px-5 min-w-11 text-base",
      },
    },
    compoundVariants: [
      // segmented는 size.default의 h-10을 무력화 — padding으로 높이 결정
      { variant: "segmented", size: "default", class: "h-7 min-w-0 px-3" },
      { variant: "segmented", size: "sm", class: "h-7 min-w-0 px-3" },
      { variant: "segmented", size: "lg", class: "h-8 min-w-0 px-3" },
      // segmented-subtle 도 동일 — variant 시각 변경, 사이즈 메트릭은 segmented 와 1:1
      { variant: "segmented-subtle", size: "default", class: "h-7 min-w-0 px-3" },
      { variant: "segmented-subtle", size: "sm", class: "h-7 min-w-0 px-3" },
      { variant: "segmented-subtle", size: "lg", class: "h-8 min-w-0 px-3" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
