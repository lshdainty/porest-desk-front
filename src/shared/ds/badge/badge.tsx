import * as React from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

import { badgeGroupVariants, badgeVariants } from "./badge-variants";

// 변형 · 톤 · 크기는 badge-variants.ts 머리 주석과 porest-design specs/components/badge.yaml 이 정한다.

type BadgeSize = "medium" | "large";

// 앞 아이콘 — 12 · 14(px 그대로), 글자색. Tailwind 는 소스의 글자 그대로를 읽으므로 크기마다 다 적는다
const PREFIX_ICON =
  "flex shrink-0 items-center justify-center [&>svg]:shrink-0";
const PREFIX_ICON_SIZE: Record<BadgeSize, string> = {
  medium: "[&>svg]:size-x3",
  large: "[&>svg]:size-x3_5",
};

// 글 — 한 줄. 부모가 좁을 때만 말줄임(min-width 0 · overflow hidden)
const LABEL = "min-w-0 truncate";

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** 글 — 한두 낱말 · 명사("예정" · "연체 3" · "한도 초과") */
  children: React.ReactNode;
  /** 앞 아이콘(lucide) — 크기는 배지가 정하고(12 · 14) 색은 글자색을 따른다. 보조 기술에는 숨긴다 */
  prefixIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, tone, size, prefixIcon, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    >
      {prefixIcon != null && prefixIcon !== false && (
        <span
          aria-hidden
          data-slot="badge-prefix-icon"
          className={cn(PREFIX_ICON, PREFIX_ICON_SIZE[size ?? "medium"])}
        >
          {prefixIcon}
        </span>
      )}
      <span data-slot="badge-label" className={LABEL}>
        {children}
      </span>
    </span>
  ),
);
Badge.displayName = "Badge";

export type BadgeGroupProps = React.HTMLAttributes<HTMLSpanElement>;

const BadgeGroup = React.forwardRef<HTMLSpanElement, BadgeGroupProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="badge-group"
      className={cn(badgeGroupVariants(), className)}
      {...props}
    />
  ),
);
BadgeGroup.displayName = "BadgeGroup";

export { Badge, BadgeGroup };
