import * as React from "react"

import { cn } from "@/shared/lib/index"

/*
 * Porest Skeleton — porest-design specs/components/skeleton.md SoT 기반.
 * 2 variants: pulse(animate-pulse, default) / shimmer(sweep gradient).
 * shape는 className으로 조정 (h-4 w-32, h-10 w-10 rounded-full 등).
 */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-surface-input", className)}
      {...props}
    />
  )
}

/**
 * SkeletonShimmer — sweep gradient variant.
 * surface-input 베이스 + primary 25% mix 좌→우 sweep, motion-duration-loop(1500ms) linear infinite.
 */
function SkeletonShimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-sm bg-surface-input", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] to-transparent animate-[shimmer_var(--motion-duration-loop)_linear_infinite]" />
    </div>
  )
}

export { Skeleton, SkeletonShimmer }
