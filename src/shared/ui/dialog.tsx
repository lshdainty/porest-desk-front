import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/shared/lib/index"

/*
 * Porest Dialog — porest-design specs/components/dialog.md SoT 기반.
 * Phase 2 마이그레이션: porest overlay/shadow 토큰 + desk-front 구조 보존.
 *
 * 호환 보존:
 *   - sizes: sm 420 / md 520 (default) / lg 720 (desk-front 사용처 정합)
 *   - composition: DialogHeader > DialogTitle / DialogDescription / + DialogBody + DialogFooter
 *   - hideClose prop — 호출자가 직접 close 그리는 패턴(기본 true)
 *
 * Porest 시각:
 *   - overlay: var(--overlay-dim-light) light / var(--overlay-dim-dark) dark
 *   - bg-[var(--bg-surface)]: Phase 1 alias로 자동 Cobalt 톤 surface-default
 *   - shadow-[var(--shadow-xl)]: Tailwind arbitrary(분해 회피, dark token swap 안전)
 *   - radius-xl + rounded
 */

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
      "fixed inset-0 z-[100] bg-[var(--overlay-dim-light)] dark:bg-[var(--overlay-dim-dark)]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      "duration-200",
      className,
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
    "bg-[var(--bg-surface)] rounded-[var(--radius-xl)]",
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
  },
)

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> &
  VariantProps<typeof dialogContentVariants> & {
    /** true면 우상단 자동 X 버튼 표시. 기본 false — 호출자가 직접 close 그림. */
    hideClose?: boolean
  }

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, size, hideClose = true, children, style, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ size }), className)}
      style={{ boxShadow: "var(--shadow-xl)", ...style }}
      onOpenAutoFocus={(e) => e.preventDefault()}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// .modal__head — padding 18 22 + flex + flex-shrink-0
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 items-center gap-3 px-[22px] py-[18px]",
      className,
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

// .modal__foot — padding 14 22 + flex justify-end + gap 8
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-end gap-2 px-[22px] py-[14px]",
      className,
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
      "flex-1 text-title-md font-semibold leading-snug tracking-tight text-text-primary",
      className,
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
    className={cn("text-sm text-text-secondary", className)}
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
