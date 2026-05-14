import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

/*
 * Porest Checkbox — porest-design specs/components/checkbox.md SoT 기반.
 *
 * - sizes: sm 16 / md 18 (default) / lg 20
 * - radius: rounded-sm (4px)
 * - checked/indeterminate: bg-primary + 흰 아이콘
 * - unchecked hover: bg-surface-input (Toss 톤 미세 affordance)
 * - focus: ring-2 ring-ring + 2px offset (다크는 border-focus-light 자동 alias)
 * - 터치 타겟은 control 단독으론 작음 (16-20) — 반드시 label까지 hit area 44+ 확보 (WCAG 2.5.5)
 */

const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border border-border-strong bg-surface-default hover:bg-surface-input data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-text-on-accent data-[state=checked]:hover:bg-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-text-on-accent data-[state=indeterminate]:hover:bg-primary aria-invalid:border-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-input disabled:hover:bg-surface-input transition-colors motion-safe:duration-[var(--motion-duration-fast)] motion-safe:ease-[var(--motion-ease-out)]",
  {
    variants: {
      size: {
        sm: "size-4 [&_svg]:size-2.5",
        md: "size-[18px] [&_svg]:size-3",
        lg: "size-5 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { size: "md" },
  },
)

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(checkboxVariants({ size }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {checked === "indeterminate" ? (
        <Minus strokeWidth={3} />
      ) : (
        <Check strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, checkboxVariants }
