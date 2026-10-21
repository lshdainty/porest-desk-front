import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/index";

/*
 * Groo Alert — groo-design specs/components/alert.md SoT 기반.
 *
 * - 인라인 정보·경고 메시지. 페이지 안 한 위치에 고정 표시.
 * - composition: Alert > [icon] AlertBody > AlertTitle / AlertDescription
 * - 6 variants: default / info / success / warning / error / danger / destructive
 *   (desk-front 호환: danger=error 별칭, destructive=error 별칭)
 * - semantic variants: border-l 4px + color-mix 8% bg (preview .banner SoT)
 * - default: border 1px all-around + surface-default
 *
 * Layout: flex items-start + gap-md (icon ↔ body wrapper). icon은 first child(absolute X).
 * role: error/warning/danger/destructive는 alert, 그 외는 status.
 */

const alertVariants = cva(
  "relative w-full flex items-start gap-[var(--spacing-md)] rounded-sm p-[var(--spacing-md)] text-body-sm [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:mt-[2px]",
  {
    variants: {
      variant: {
        default:
          "border border-border-default bg-surface-default text-text-primary",
        info: "border-l-4 border-l-stroke-informative-solid bg-bg-informative-weak text-text-primary [&>svg]:text-fg-informative",
        success:
          "border-l-4 border-l-stroke-positive-solid bg-bg-positive-weak text-text-primary [&>svg]:text-fg-positive",
        warning:
          "border-l-4 border-l-stroke-warning-solid bg-bg-warning-weak text-text-primary [&>svg]:text-fg-warning",
        error:
          "border-l-4 border-l-stroke-critical-solid bg-bg-critical-weak text-text-primary [&>svg]:text-fg-critical",
        // 호환 별칭 — desk-front 사용처 보존
        danger:
          "border-l-4 border-l-stroke-critical-solid bg-bg-critical-weak text-text-primary [&>svg]:text-fg-critical",
        destructive:
          "border-l-4 border-l-stroke-critical-solid bg-bg-critical-weak text-text-primary [&>svg]:text-fg-critical",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role={
      variant === "error" ||
      variant === "warning" ||
      variant === "danger" ||
      variant === "destructive"
        ? "alert"
        : "status"
    }
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

/* Body wrapper — title + description 묶음. flex-1 + gap-xs. */
const AlertBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-[var(--spacing-xs)] flex-1 min-w-0",
      className,
    )}
    {...props}
  />
));
AlertBody.displayName = "AlertBody";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "text-body-md font-semibold leading-none tracking-tight text-text-primary",
      className,
    )}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-body-sm text-text-secondary [&_p]:leading-[1.5]",
      className,
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertBody, AlertTitle, AlertDescription };
