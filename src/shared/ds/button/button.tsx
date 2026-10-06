import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import { ProgressCircle } from "@/shared/ds/progress-circle";

import { buttonVariants } from "./button-variants";

// 변형 · 크기 · 상태는 button-variants.ts 머리 주석과 porest-design specs/components/button.yaml 이 정한다.

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** 누름 색 위 로딩 원 + 누르기 막기 + aria-busy. asChild 와 함께 쓰지 않는다(Slot 은 자식 하나). */
  loading?: boolean;
}

// 로딩 중 누르기 — 제출도, 부모로 올라가는 것도 막는다
function swallow(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
  e.stopPropagation();
}

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로 — 폭이 넓은 버튼(w-full)도 세로 2px 만 준다.
function setPressBasis(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const basis = Math.max(el.offsetHeight, el.offsetWidth / 4, 24);
  el.style.setProperty("--press-basis", String(basis));
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      layout,
      ghostColor,
      flush,
      asChild = false,
      loading = false,
      disabled,
      children,
      onPointerDown,
      onClick,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      buttonVariants({ variant, size, layout, ghostColor, flush, className }),
    );
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      setPressBasis(e);
      onPointerDown?.(e);
    };
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          onPointerDown={handlePointerDown}
          onClick={onClick}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled}
        aria-busy={loading || undefined}
        onPointerDown={handlePointerDown}
        // 로딩 중엔 포인터뿐 아니라 키보드(Enter · Space) 누르기도 삼킨다 — 두 번 제출 방지(submit 도 막는다)
        onClick={loading ? swallow : onClick}
        {...props}
      >
        {children}
        {loading && (
          <ProgressCircle
            size="inherit"
            tone="inherit"
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
