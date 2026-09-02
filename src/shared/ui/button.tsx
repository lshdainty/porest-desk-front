import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/shared/ui/button-variants";

import { cn } from "@/shared/lib/index";
import { Spinner } from "@/shared/ui/spinner";

/*
 * Porest Button — porest-design SoT(specs/components/button.md) 기반.
 * Phase 2 마이그레이션(2026-05-13): porest 시각 토큰 + desk-front 호환 보존.
 *
 * Porest 시각 (preview-html `.btn` SoT):
 *   - gap-sm + transition-[box-shadow] + focus-visible:ring-2 ring-ring ring-offset-2
 *   - default: bg-primary + shadow-sm/md + brightness hover/active
 *   - destructive: bg-destructive + 동일 패턴
 *   - outline: border-border-default + hover:bg-surface-input
 *   - secondary: bg-secondary + hover:bg-surface-input
 *   - ghost: hover:bg-surface-input (Porest는 hover:bg-surface-input, desk-front token alias 후 동일)
 *
 * desk-front 호환 보존:
 *   - size: default(=md 톤, h-9)/xs(h-6)/sm(h-8)/md(h-10 신규)/lg(h-11)/icon(h-9)
 *   - variant: warm 보존 (사용 1건, --bg-section-warm semantic alias 사용)
 *   - loading prop — porest Spinner(size=sm) 노출. currentColor 상속으로
 *     filled(default/destructive)에선 white, outline/ghost에선 primary 자동 적응.
 *     asChild와 함께 쓰지 말 것 (Slot 단일 child 제약).
 */

/** 같은 버튼의 재클릭을 버리는 창(ms). OS 더블클릭 판정(≈500ms)보다 조금 길게. */
export const DOUBLE_CLICK_GUARD_MS = 600;

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** true면 좌측에 spinner 표시 + disabled 처리. asChild와는 함께 쓰지 말 것 (Slot 단일 child). */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      flush,
      asChild = false,
      loading,
      disabled,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    // 더블클릭 방어 — `loading` 을 넘긴 버튼은 비동기 작업을 거는 버튼이다. isPending 이
    // true 로 바뀌어 disabled 가 되는 건 다음 렌더 뒤라, 따닥 누르면 두 번째 클릭이 그
    // 사이를 뚫고 같은 요청을 한 번 더 보냈다(거래 2건 저장, QA 2026-09-02). 렌더와
    // 무관하게 동기적으로 짧은 창(더블클릭 간격) 안의 재클릭을 버린다. 창이 지나면
    // 부모의 loading/disabled 가 이어받는다.
    const lastClickAt = React.useRef(0);
    const isAsyncAction = loading !== undefined;
    const guardedClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isAsyncAction) {
          const now = Date.now();
          if (now - lastClickAt.current < DOUBLE_CLICK_GUARD_MS) {
            e.preventDefault();
            return;
          }
          lastClickAt.current = now;
        }
        onClick?.(e);
      },
      [isAsyncAction, onClick],
    );
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, flush, className }))}
          ref={ref}
          onClick={onClick}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, flush, className }))}
        ref={ref}
        disabled={disabled || !!loading}
        aria-busy={loading || undefined}
        onClick={guardedClick}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            aria-hidden
            // 버튼 내부 spinner는 버튼 텍스트 색(currentColor) 상속해 모든 variant 일관 시각.
            // default/destructive(filled bg-primary/bg-error)에선 white spinner, outline/ghost(흰 bg)에선 primary spinner.
            style={{
              borderColor: "color-mix(in srgb, currentColor 30%, transparent)",
              borderTopColor: "currentColor",
            }}
          />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
