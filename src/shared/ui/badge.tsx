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
    // spec badge.md: text-badge(11/600/1.2) — text-xs(12/1.4)는 spec 일탈이었음 (앱 PBadge 정합)
    "px-[var(--spacing-sm)] py-0.5 text-[length:var(--text-badge)] font-semibold leading-[1.2] tracking-normal",
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
        // soft (semantic, color-mix 16% bg) — 텍스트는 status-*-fg (다크에서 light variant, 앱 statusXxxFg 정합)
        info:
          "border-transparent bg-[color-mix(in_srgb,var(--color-info)_16%,transparent)] text-[color:var(--status-info-fg)] hover:bg-[color-mix(in_srgb,var(--color-info)_24%,transparent)]",
        success:
          "border-transparent bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] text-[color:var(--status-success-fg)] hover:bg-[color-mix(in_srgb,var(--color-success)_24%,transparent)]",
        warning:
          "border-transparent bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)] text-[color:var(--status-warning-fg)] hover:bg-[color-mix(in_srgb,var(--color-warning)_24%,transparent)]",
        error:
          "border-transparent bg-[color-mix(in_srgb,var(--color-error)_16%,transparent)] text-[color:var(--status-danger-fg)] hover:bg-[color-mix(in_srgb,var(--color-error)_24%,transparent)]",
        // outline (neutral + semantic) — 텍스트 status-*-fg / 테두리 base (앱 outline 정합)
        outline:
          "border-border-default bg-transparent text-text-primary hover:bg-surface-input",
        "outline-info":
          "border-info text-[color:var(--status-info-fg)] bg-transparent hover:bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)]",
        "outline-success":
          "border-success text-[color:var(--status-success-fg)] bg-transparent hover:bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]",
        "outline-warning":
          "border-warning text-[color:var(--status-warning-fg)] bg-transparent hover:bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)]",
        "outline-error":
          "border-error text-[color:var(--status-danger-fg)] bg-transparent hover:bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]",
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
