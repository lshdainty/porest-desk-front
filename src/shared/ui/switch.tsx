import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/shared/lib/index"

/*
 * Porest Switch — porest-design specs/components/switch.md SoT 기반.
 *
 * - 44×24 track (WCAG 2.5.5 AAA 44px 터치 권장) + 20×20 thumb
 * - off: border-strong / on: primary
 * - thumb bg는 text-on-accent(#fff 고정) — surface-default 토큰은 dark swap 시 어두워져 thumb 안 보임.
 * - 다크모드: cascade 자동 swap (primary는 다크모드에 동일, border-strong은 *-dark 적용).
 */

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-[background-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-border-default-strong",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-text-on-accent shadow-md ring-0",
        "transition-transform duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
