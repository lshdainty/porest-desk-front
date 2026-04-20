import * as React from "react"

import { cn } from "@/shared/lib/index"

// POREST Design System — .p-input spec
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full min-w-0 px-3 py-[9px]",
          "rounded-[var(--radius-md)] border border-[var(--border-default)]",
          "bg-[var(--bg-surface)] text-sm text-[var(--fg-primary)]",
          "placeholder:text-[var(--fg-placeholder)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "transition-[border-color,box-shadow] duration-[140ms]",
          "hover:enabled:border-[var(--border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--mist-100)]",
          "aria-invalid:border-[var(--status-danger)] aria-invalid:focus-visible:shadow-[0_0_0_3px_oklch(0.605_0.135_25_/_0.2)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
