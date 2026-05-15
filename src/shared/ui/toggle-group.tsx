import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"
import { toggleVariants } from "@/shared/ui/toggle"

/*
 * Porest ToggleGroup — porest-design specs/components/toggle-group.md SoT 기반.
 * Phase 2 마이그레이션: porest 토큰 + desk-front segmented wrapper 보존.
 *
 * variant:
 *   default — flex gap-1 (개별 toggle 시각이 자체 border/bg)
 *   segmented — POREST .p-seg sunken bar wrapper (--bg-sunken + border + p-0.5)
 */

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => {
  // POREST .p-seg — sunken bar for segmented control.
  const wrapper =
    variant === "segmented"
      ? "inline-flex w-full gap-[2px] rounded-[var(--radius-md)] border border-border-default bg-[var(--bg-sunken)] p-0.5"
      : "flex items-center justify-center gap-1"
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(wrapper, className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
