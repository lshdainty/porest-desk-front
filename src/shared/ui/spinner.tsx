import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

/*
 * Porest Spinner — porest-design specs/components/spinner.md SoT 기반.
 *
 * - circular indeterminate. 360deg 회전, arc 270deg(3/4 conic).
 * - 색: border-border-default 트랙 + border-t-primary (라이트) / 다크는 cascade 자동 swap.
 *   track border-default 사용으로 page bg 위 ring outline visible (1.4:1+ 대비).
 * - sizes: sm 16/2 · md 24/2 · lg 32/3 · xl 48/4.
 * - animation: motion-duration-loop(1500ms) motion-ease-linear infinite.
 * - prefers-reduced-motion 시 motion-safe 가드로 회전 멈춤.
 *
 * 사용 예:
 *   <Spinner />                                    md 기본
 *   <Spinner size="sm" />                          inline (버튼 안)
 *   <Spinner size="xl" />                          full-page
 *   <div className="inline-flex items-center gap-2"><Spinner size="sm" /> 저장 중…</div>
 */

const spinnerVariants = cva(
  "inline-block rounded-full border-border-default border-t-primary motion-safe:animate-[spin_var(--motion-duration-loop)_var(--motion-ease-linear)_infinite]",
  {
    variants: {
      size: {
        sm: "size-4 border-2",
        md: "size-6 border-2",
        lg: "size-8 border-[3px]",
        xl: "size-12 border-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, label = "로딩 중", ...props }, ref) => {
    return (
      <span
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(spinnerVariants({ size, className }))}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </span>
    )
  },
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
