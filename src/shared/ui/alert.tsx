import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

// POREST Design System — .p-alert spec
// Built on top of shadcn's Alert structure (svg absolute layout) with
// tokens.css / components.css variants applied.
const alertVariants = cva(
  [
    "relative w-full",
    "rounded-[var(--radius-md)] border border-[var(--border-subtle)] border-l-[3px]",
    "bg-[var(--bg-surface)] text-[var(--fg-secondary)]",
    "px-3.5 py-3 text-[13px] leading-normal",
    "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]",
    "[&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3 [&>svg]:size-4 [&>svg]:text-current",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "",
        success:
          "bg-[var(--status-success-subtle)] text-[var(--status-success-fg)] border-[var(--mossy-300)]",
        warning:
          "bg-[var(--status-warning-subtle)] text-[var(--status-warning-fg)] border-[var(--sunlit-500)]",
        danger:
          "bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)] border-[var(--berry-500)]",
        destructive:
          "bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)] border-[var(--berry-500)]",
        info:
          "bg-[var(--status-info-subtle)] text-[var(--status-info-fg)] border-[var(--sky-500)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-0.5 font-semibold leading-snug tracking-tight text-[var(--fg-primary)]",
      className
    )}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[13px] leading-normal [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
