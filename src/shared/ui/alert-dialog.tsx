import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/index";
import { buttonVariants } from "@/shared/ui/button-variants";
import { Spinner } from "@/shared/ui/spinner";

/*
 * Porest AlertDialog — porest-design specs/components/alert-dialog.md SoT 기반.
 * Phase 2 마이그레이션: 비가역 액션 확정용 modal. Dialog와 시각 동일.
 *
 * 호환 보존:
 *   - sizes 추가(sm/md/lg) — desk-front 기존 max-w-lg는 default md(480)와 유사
 *   - AlertDialogAction: buttonVariants() default(primary) 유지 + loading prop 보존
 *     (사용처에서 destructive 필요 시 className 또는 variant override)
 *   - Loader2 → porest Spinner 교체
 *
 * 동작 차이(Dialog 대비):
 *   - overlay click 무시 / close button(X) 없음 / default focus = Cancel
 */

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[300] bg-[var(--overlay-dim-light)] dark:bg-[var(--overlay-dim-dark)]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const alertDialogContentVariants = cva(
  [
    "fixed left-[50%] top-[50%] z-[301] grid w-[min(90%,var(--dialog-max-w))] translate-x-[-50%] translate-y-[-50%]",
    "flex-col bg-[var(--bg-surface)] gap-[var(--spacing-md)] duration-200",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "[--dialog-max-w:384px] p-[var(--spacing-xl)] rounded-lg",
        // popup 은 세 사이즈 모두 radius-lg(12) — dialog.md. 시트/드로어(20)와 갈라 둔다.
        md: "[--dialog-max-w:480px] p-[var(--spacing-2xl)] rounded-lg",
        lg: "[--dialog-max-w:640px] p-[var(--spacing-2xl)] rounded-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface AlertDialogContentProps
  extends
    React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
    VariantProps<typeof alertDialogContentVariants> {}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ className, size, style, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(alertDialogContentVariants({ size }), className)}
      style={{ boxShadow: "var(--shadow-xl)", ...style }}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-[var(--spacing-md)] text-left", className)}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // spec alert-dialog.md "ⓔ footer (모바일 < 640px)": 각 button flex-1 균등 분배.
      // 데스크탑(≥640px)은 preview .modal-actions 그대로 우측 정렬.
      //
      // 모바일에서 우측 정렬 compact 로 두면 화면 구석의 작은 알약이 돼 한 손으로
      // 누를 폭이 안 나온다 — dialog.md 114-116 · drawer.md footer 와 같은 규칙.
      "flex gap-[var(--spacing-sm)] mt-[var(--spacing-md)]",
      "[&>button]:flex-1 sm:justify-end sm:[&>button]:flex-none",
      className,
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-title-md font-semibold leading-[var(--text-title-md--line-height)] text-text-primary tracking-[-0.01em]",
      className,
    )}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-body-md leading-[1.6] text-text-secondary", className)}
    {...props}
  />
));
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
    /** true면 좌측에 spinner 표시 + disabled 처리. */
    loading?: boolean;
  }
>(({ className, loading = false, disabled, children, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      buttonVariants(),
      // spec alert-dialog.md footer(모바일 <640px) — size lg(48) 로 한 손 조작 폭 확보.
      // 데스크탑은 buttonVariants() 기본(h-9) 유지.
      "h-11 px-5 py-3 text-base [&_svg]:size-[18px] sm:h-9 sm:px-4 sm:py-[9px] sm:text-sm sm:[&_svg]:size-4",
      className,
    )}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading && (
      <Spinner
        size="sm"
        aria-hidden
        style={{
          borderColor: "color-mix(in srgb, currentColor 30%, transparent)",
          borderTopColor: "currentColor",
        }}
      />
    )}
    {children}
  </AlertDialogPrimitive.Action>
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      // 모달 footer 취소 통일 — 테두리 없는 회색 채움(spec alert-dialog.md).
      // ghost 는 배경이 없어 전체 폭 두 버튼 중 한쪽이 빈자리처럼 보인다
      // (spec button.md Migration notes 2026-08).
      buttonVariants({ variant: "secondary" }),
      // Action 과 같은 규칙 — 모바일 lg(48) / 데스크탑 기본.
      "h-11 px-5 py-3 text-base [&_svg]:size-[18px] sm:h-9 sm:px-4 sm:py-[9px] sm:text-sm sm:[&_svg]:size-4",
      className,
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
