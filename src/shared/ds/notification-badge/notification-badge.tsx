import * as React from "react";

import { cn } from "@/shared/lib/cn";

import {
  formatNotificationCount,
  notificationBadgeVariants,
} from "./notification-badge-variants";

// 크기 · 붙는 자리 · 숫자 표기는 notification-badge-variants.ts 머리 주석과
// porest-design specs/components/notification-badge.yaml 이 정한다.

// 붙을 대상 — 상자가 곧 아이콘 · 글의 상자다(inline-flex: 아이콘이면 아이콘 크기, 글이면 글 줄 상자)
const TARGET = "relative inline-flex";

type NotificationBadgeKind =
  | {
      /** 점(기본) — 새 것이 있는지만 */
      size?: "small";
      /** 점을 보일지 — 기본 true. 사용자가 보면 끈다 */
      visible?: boolean;
      count?: never;
    }
  | {
      /** 숫자 — 몇 개인지가 판단에 필요할 때만 */
      size: "large";
      /** 안 읽은 수 — 0 이하면 배지가 없고, 100 이상이면 "99+". 버튼 이름에는 줄이지 않은 수를 넣는다 */
      count: number;
      visible?: never;
    };

export type NotificationBadgeProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> &
  NotificationBadgeKind & {
    /** 붙는 자리 — icon(기본, 아이콘 상자에서 잰다) · text(글 끝 + 2 · 줄 상자 위 끝) */
    attach?: "icon" | "text";
    /** 붙을 대상 — 아이콘(lucide) 또는 글 */
    children: React.ReactNode;
  };

const NotificationBadge = React.forwardRef<
  HTMLSpanElement,
  NotificationBadgeProps
>(
  (
    {
      className,
      size = "small",
      attach = "icon",
      visible = true,
      count,
      children,
      ...props
    },
    ref,
  ) => {
    const label = size === "large" ? formatNotificationCount(count ?? 0) : null;
    const shown = size === "large" ? label !== null : visible;
    return (
      <span
        ref={ref}
        data-slot="notification-badge-target"
        className={cn(TARGET, className)}
        {...props}
      >
        {children}
        {shown && (
          <span
            aria-hidden
            data-slot="notification-badge"
            data-size={size}
            className={notificationBadgeVariants({ size, attach })}
          >
            {label}
          </span>
        )}
      </span>
    );
  },
);
NotificationBadge.displayName = "NotificationBadge";

export { NotificationBadge };
