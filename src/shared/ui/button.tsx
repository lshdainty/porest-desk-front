import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

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
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-[var(--spacing-sm)] whitespace-nowrap select-none",
    "rounded-sm font-sans font-medium tracking-[-0.005em] leading-none",
    "transition-[box-shadow,background-color,color,border-color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text-on-accent shadow-sm hover:shadow-md hover:brightness-105 active:shadow-none active:scale-[0.98] active:brightness-95",
        destructive:
          "bg-destructive text-text-on-accent shadow-sm hover:shadow-md hover:brightness-105 active:shadow-none active:scale-[0.98] active:brightness-95",
        outline:
          "border border-border-default bg-transparent text-text-primary hover:bg-surface-input hover:border-[var(--border-strong)] active:scale-[0.98]",
        secondary:
          "bg-secondary text-text-primary border border-border-default hover:bg-surface-input hover:border-[var(--border-strong)] active:scale-[0.98] active:brightness-95",
        ghost:
          "bg-transparent text-text-primary hover:bg-surface-input active:bg-border-default active:scale-[0.98]",
        accent:
          "bg-transparent text-[var(--fg-brand)] hover:bg-surface-input active:bg-border-default active:scale-[0.98]",
        link:
          "bg-transparent border-0 px-0.5 text-[var(--fg-link)] hover:text-[var(--fg-link-hover)] hover:underline underline-offset-[3px] active:brightness-90",
        warm:
          "bg-[var(--bg-section-warm)] text-[var(--fg-on-warm)] hover:bg-surface-input",
      },
      size: {
        default: "h-9 px-4 py-[9px] text-sm [&_svg]:size-4",
        xs:      "h-6 px-2 py-1 text-xs gap-1 rounded-[var(--radius-sm)] [&_svg]:size-3.5",
        sm:      "h-8 px-3 py-1.5 text-[13px] gap-[5px] rounded-[var(--radius-sm)] [&_svg]:size-3.5",
        md:      "h-10 px-3 py-2 text-sm [&_svg]:size-4",
        lg:      "h-11 px-5 py-3 text-base [&_svg]:size-[18px]",
        icon:    "h-9 w-9 p-0 rounded-md [&_svg]:size-4",
        // 모바일 크롬 헤더(m-header) 전용 — 36×36 원형 + glyph 20px.
        // ghost 조합에서도 보조톤 약화 없이 중립(text-primary) 유지. button.md v97.
        iconLg:  "h-9 w-9 p-0 rounded-full [&_svg]:size-5",
      },
    },
    compoundVariants: [
      // 아이콘 액션 버튼(ghost+icon): 글씨색을 보조톤(text-secondary)으로 약화 —
      // 리스트 행/툴바의 quiet 아이콘 액션. porest-design button.md v96 정합.
      // (iconLg는 페이지당 1개뿐인 주 액션이라 약화 없이 중립 유지 — v97)
      { variant: "ghost", size: "icon", className: "text-text-secondary" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

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
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
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

// buttonVariants(cva)는 alert-dialog/calendar 에서 재사용 — 컴포넌트 파일에서 함께 export.
// (shadcn 관례. Fast Refresh 경고는 의도된 것이라 이 줄만 예외 처리.)
// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
