import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

/*
 * Porest Badge — porest-design specs/components/badge.md SoT 기반.
 * Phase 2 마이그레이션: porest 시각 토큰(text-badge 11/600 + pill + ring focus) +
 * desk-front 호환 variant(brand/solid/danger/warm) 보존.
 *
 * Variants 매트릭스:
 *   solid:    default(secondary 톤, sunken) / secondary(sunken) / destructive(error soft) / danger(=destructive) / solid(brand)
 *   soft:     brand / success / warning / info — semantic + subtle
 *   outline:  outline(neutral) / outline-info / outline-success / outline-warning / outline-error
 *   warm:     bark warm (1건 사용)
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
        default:
          "border-transparent bg-[var(--bg-sunken)] text-text-primary",
        secondary:
          "border-transparent bg-[var(--bg-sunken)] text-text-primary",
        destructive:
          "border-transparent bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)]",
        danger:
          "border-transparent bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)]",
        brand:
          "border-transparent bg-[var(--bg-brand-subtle)] text-[var(--fg-brand-strong)]",
        solid:
          "border-transparent bg-[var(--bg-brand)] text-[var(--fg-on-brand)]",
        success:
          "border-transparent bg-[var(--status-success-subtle)] text-[var(--status-success-fg)]",
        warning:
          "border-transparent bg-[var(--status-warning-subtle)] text-[var(--status-warning-fg)]",
        info:
          "border-transparent bg-[var(--status-info-subtle)] text-[var(--status-info-fg)]",
        warm:
          "border-transparent bg-[var(--bg-section-warm)] text-[var(--fg-on-warm)]",
        outline:
          "border-border-default bg-transparent text-text-primary hover:bg-[var(--bg-hover-subtle)]",
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
