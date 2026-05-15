import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

/*
 * Porest Badge — porest-design specs/components/badge.md SoT 기반.
 *
 * 3 styles × neutral·semantic 매트릭스 (12 variants):
 *   solid:    default(primary) / secondary(surface-input) / destructive(error)
 *   soft:     info / success / warning / error  — color-mix 16% bg
 *   outline:  outline(neutral) / outline-info / outline-success / outline-warning / outline-error
 *
 * 강조 강도: solid > soft > outline. 의미 분기는 색으로, style은 카테고리 안에서 통일.
 */

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full border",
    "px-[var(--spacing-sm)] py-0.5 text-xs font-semibold leading-[1.4] tracking-normal",
    "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        // solid
        default:
          "border-transparent bg-primary text-text-on-accent hover:brightness-105",
        secondary:
          "border-transparent bg-surface-input text-text-primary hover:bg-border-default",
        destructive:
          "border-transparent bg-error text-text-on-accent hover:brightness-105",
        // soft (semantic, color-mix 16% bg)
        info:
          "border-transparent bg-[color-mix(in_srgb,var(--color-info)_16%,transparent)] text-info hover:bg-[color-mix(in_srgb,var(--color-info)_24%,transparent)]",
        success:
          "border-transparent bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] text-success hover:bg-[color-mix(in_srgb,var(--color-success)_24%,transparent)]",
        warning:
          "border-transparent bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)] text-warning hover:bg-[color-mix(in_srgb,var(--color-warning)_24%,transparent)]",
        error:
          "border-transparent bg-[color-mix(in_srgb,var(--color-error)_16%,transparent)] text-error hover:bg-[color-mix(in_srgb,var(--color-error)_24%,transparent)]",
        // outline (neutral + semantic)
        outline:
          "border-border-default bg-transparent text-text-primary hover:bg-surface-input",
        "outline-info":
          "border-info text-info bg-transparent hover:bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)]",
        "outline-success":
          "border-success text-success bg-transparent hover:bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]",
        "outline-warning":
          "border-warning text-warning bg-transparent hover:bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)]",
        "outline-error":
          "border-error text-error bg-transparent hover:bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
