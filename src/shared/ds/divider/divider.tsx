import * as React from "react";

import { cn } from "@/shared/lib/cn";

import { dividerVariants } from "./divider-variants";

// 방향 · 들임 · 장식은 divider-variants.ts 머리 주석과 porest-design specs/components/divider.yaml 이 정한다.

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** horizontal(기본) · vertical */
  orientation?: "horizontal" | "vertical";
  /** 양끝 16 들임 — 기본 false(끝까지) */
  inset?: boolean;
  /** 기본 true — 보조 기술에 숨긴다. false 면 role="separator" */
  decorative?: boolean;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      orientation = "horizontal",
      inset = false,
      decorative = true,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="divider"
      data-orientation={orientation}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(dividerVariants({ orientation, inset }), className)}
      {...props}
    />
  ),
);
Divider.displayName = "Divider";

export { Divider };
