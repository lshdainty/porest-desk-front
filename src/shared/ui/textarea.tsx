import * as React from "react"

import { cn } from "@/shared/lib/index"

/*
 * Porest Textarea — porest-design specs/components/textarea.md SoT 기반.
 *
 * - min-height 80px — 3줄 이상 본문 입력
 * - body-md typography (15/400/1.6) 한국어 본문 가독성
 * - bg-surface-input(input 정합) + border-default + text-primary
 * - focus: border-focus + ring-2 ring-ring/30, aria-invalid: error 톤
 * - resize: y(데스크 본문 편의 — 사용자가 늘려 적기 가능). 고정 필요 시 className="resize-none"
 */

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-20 w-full rounded-sm border border-border-default bg-surface-input px-[var(--spacing-md)] py-[var(--spacing-sm)] font-sans text-body-md text-text-primary placeholder:text-text-tertiary resize-y",
        "transition-[color,box-shadow,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
        "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
