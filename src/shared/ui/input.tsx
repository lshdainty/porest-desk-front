import * as React from "react"

import { cn } from "@/shared/lib/index"

/*
 * Porest Input — porest-design specs/components/input.md SoT 기반.
 *
 * - 높이 40px (h-10) 고정 — variant 분리 안 함 (form 안 통일 우선).
 * - 색상: surface-input(회색 채움 — 1.4.11 보강) / border-default / text-primary / placeholder text-tertiary
 * - 폰트: body-lg (16/400/1.6) — 입력값 가독성 (title-sm 16/500보다 가벼움)
 * - focus: border-focus + ring-2 ring-ring/30 (다크 시 border-focus-light 자동 swap)
 * - aria-invalid: border-error + ring-error/30
 * - disabled: opacity-50 + cursor-not-allowed
 * - file: prop 보존 (file:border-0 file:bg-transparent ...)
 * - 사이즈 예외 필요 시 사용처 className으로 (예: `className="h-12 text-title-md"`)
 */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full min-w-0 rounded-sm border border-border-default bg-surface-input px-[var(--spacing-md)] py-[var(--spacing-sm)] font-sans text-body-lg text-text-primary placeholder:text-text-tertiary",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "transition-[color,box-shadow,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
