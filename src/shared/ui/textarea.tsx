import * as React from "react"

import { cn } from "@/shared/lib/index"

// POREST Design System — .p-textarea spec (mirrors .p-input)
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full resize-y px-3 py-2 leading-[1.55]",
        "rounded-[var(--radius-md)] border border-[var(--border-default)]",
        "bg-[var(--bg-surface)] text-sm text-[var(--fg-primary)]",
        "placeholder:text-[var(--fg-placeholder)]",
        "transition-[border-color,box-shadow] duration-[140ms]",
        "hover:enabled:border-[var(--border-strong)]",
        "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-sunken)]",
        "aria-invalid:border-[var(--status-danger)] aria-invalid:focus-visible:shadow-[0_0_0_3px_oklch(0.605_0.135_25_/_0.2)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
