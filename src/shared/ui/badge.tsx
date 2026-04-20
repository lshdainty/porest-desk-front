import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

// POREST Design System — .p-badge spec
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full",
    "px-2 py-0.5 text-xs font-semibold leading-[1.4] tracking-normal",
    "transition-colors focus:outline-none focus-visible:shadow-[var(--shadow-focus)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--mist-200)] text-[var(--mist-800)]",
        secondary:
          "bg-[var(--mist-200)] text-[var(--mist-800)]",
        destructive:
          "bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)]",
        danger:
          "bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)]",
        outline:
          "bg-transparent text-[var(--fg-secondary)] shadow-[inset_0_0_0_1px_var(--border-default)]",
        brand:
          "bg-[var(--mossy-100)] text-[var(--mossy-800)]",
        solid:
          "bg-[var(--mossy-600)] text-white",
        success:
          "bg-[var(--status-success-subtle)] text-[var(--status-success-fg)]",
        warning:
          "bg-[var(--status-warning-subtle)] text-[var(--status-warning-fg)]",
        info:
          "bg-[var(--status-info-subtle)] text-[var(--status-info-fg)]",
        warm:
          "bg-[var(--bark-200)] text-[var(--bark-800)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
