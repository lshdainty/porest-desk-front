import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/shared/lib/index"

// POREST Design System — .modal spec
// 자체 X 버튼은 호출자가 명시적으로 그림 (DialogClose). 자동 X는 hideClose=false 시에만.

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-[oklch(0.15_0.01_180/0.5)]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      "duration-200",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const dialogContentVariants = cva(
  [
    "fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2",
    "max-h-[86vh] max-w-[calc(100%-40px)]",
    "flex flex-col overflow-hidden",
    "bg-[var(--bg-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
    "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
    "data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-1",
    "duration-200",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "w-[420px]",
        md: "w-[520px]",
        lg: "w-[720px]",
      },
    },
    defaultVariants: { size: "md" },
  }
)

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> &
  VariantProps<typeof dialogContentVariants> & {
    /** true면 우상단 자동 X 버튼 표시 (cmdk 같은 호출자용). 기본은 false — 호출자가 직접 close 그림 */
    hideClose?: boolean
  }

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, size, hideClose = true, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ size }), className)}
      onOpenAutoFocus={(e) => e.preventDefault()}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// .modal__head — padding 18 22 + flex + border-bottom + flex-shrink-0
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 items-center gap-3 px-[22px] py-[18px] border-b border-[var(--border-subtle)]",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// .modal__body — flex-1 + min-h-0 + padding 22 + scroll
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 min-h-0 overflow-y-auto p-[22px]", className)}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

// .modal__foot — padding 14 22 + flex justify-end + gap 8 + border-top + sunken bg
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-end gap-2 px-[22px] py-[14px] border-t border-[var(--border-subtle)] bg-[var(--pd-surface-inset)]",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// .modal__head h3 — 17px / 700 / flex-1
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "flex-1 text-[17px] font-bold leading-snug tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
