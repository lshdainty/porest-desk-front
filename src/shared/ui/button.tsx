import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { buttonVariants } from "@/shared/ui/button-variants"

import { cn } from "@/shared/lib/index"
import { Spinner } from "@/shared/ui/spinner"

/*
 * Porest Button — porest-design SoT(specs/components/button.md) 기반.
 * Phase 2 마이그레이션(2026-05-13): porest 시각 토큰 + desk-front 호환 보존.
 *
 * Porest 시각 (preview-html `.btn` SoT):
 *   - gap-sm + transition-[box-shadow] + focus-visible:ring-2 ring-ring ring-offset-2
 *   - default: bg-primary + shadow-sm/md + brightness hover/active
 *   - destructive: bg-destructive + 동일 패턴
 *   - outline: border-border-default + hover:bg-surface-input
 *   - secondary: bg-secondary + hover:bg-surface-input
 *   - ghost: hover:bg-surface-input (Porest는 hover:bg-surface-input, desk-front token alias 후 동일)
 *
 * desk-front 호환 보존:
 *   - size: default(=md 톤, h-9)/xs(h-6)/sm(h-8)/md(h-10 신규)/lg(h-11)/icon(h-9)
 *   - variant: warm 보존 (사용 1건, --bg-section-warm semantic alias 사용)
 *   - loading prop — porest Spinner(size=sm) 노출. currentColor 상속으로
 *     filled(default/destructive)에선 white, outline/ghost에선 primary 자동 적응.
 *     asChild와 함께 쓰지 말 것 (Slot 단일 child 제약).
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** true면 좌측에 spinner 표시 + disabled 처리. asChild와는 함께 쓰지 말 것 (Slot 단일 child). */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      flush,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, flush, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, flush, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            aria-hidden
            // 버튼 내부 spinner는 버튼 텍스트 색(currentColor) 상속해 모든 variant 일관 시각.
            // default/destructive(filled bg-primary/bg-error)에선 white spinner, outline/ghost(흰 bg)에선 primary spinner.
            style={{
              borderColor: 'color-mix(in srgb, currentColor 30%, transparent)',
              borderTopColor: 'currentColor',
            }}
          />
        )}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button }
