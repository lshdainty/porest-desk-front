import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

// POREST Design System — .p-btn spec (tokens.css + components.css)
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none",
    "text-sm font-semibold tracking-[-0.005em]",
    "rounded-[var(--radius-md)] border border-transparent",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-[140ms]",
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "active:enabled:translate-y-[0.5px] active:enabled:scale-[0.99]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--bg-brand-hover)] active:bg-[var(--bg-brand-press)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[var(--berry-700)]",
        outline:
          "bg-transparent text-[var(--fg-brand)] border-[var(--mossy-300)] hover:bg-accent hover:border-[var(--border-brand)]",
        secondary:
          "bg-card text-foreground border-input hover:bg-muted hover:border-[var(--border-strong)]",
        ghost:
          "bg-transparent text-foreground hover:bg-muted",
        warm:
          "bg-[var(--bg-section-warm)] text-[var(--fg-on-warm)] hover:bg-muted",
        link:
          "bg-transparent border-0 px-0.5 text-[var(--fg-link)] hover:text-[var(--fg-link-hover)] hover:underline underline-offset-[3px]",
      },
      size: {
        default: "h-9 px-4 py-[9px]",
        xs:      "h-6 px-2   py-1   text-xs gap-1 rounded-[var(--radius-sm)]",
        sm:      "h-8 px-3   py-1.5 text-[13px] gap-[5px] rounded-[var(--radius-sm)]",
        lg:      "h-11 px-5  py-3   text-base",
        icon:    "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
