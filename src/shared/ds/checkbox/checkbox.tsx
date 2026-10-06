import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import { useFieldGroup } from "@/shared/ds/field";

import {
  checkboxLabelVariants,
  checkboxVariants,
  checkmarkVariants,
} from "./checkbox-variants";

// 크기 · 모양 · 톤 · 굵기 · 상태는 checkbox-variants.ts 머리 주석과 porest-design specs/components/checkbox.yaml 이 정한다.

export interface CheckmarkProps
  extends
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkmarkVariants> {}

// 칸 — 체크 · 가로줄(일부 선택). Ghost 는 선택 안 됨에도 옅은 체크를 보인다(forceMount)
const Checkmark = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckmarkProps
>(({ className, size, shape, tone, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkmarkVariants({ size, shape, tone }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      forceMount
      className={cn(
        "grid place-items-center",
        shape !== "ghost" && "data-[state=unchecked]:invisible",
      )}
    >
      <Check
        strokeWidth={3}
        className="group-data-[state=indeterminate]/checkmark:hidden"
      />
      <Minus
        strokeWidth={3}
        className="hidden group-data-[state=indeterminate]/checkmark:block"
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkmark.displayName = "Checkmark";

export interface CheckboxProps
  extends CheckmarkProps, VariantProps<typeof checkboxLabelVariants> {
  label: React.ReactNode;
  labelClassName?: string;
}

// 한 줄 — 칸 + 라벨. 라벨은 <label htmlFor> 로 칸과 잇는다(라벨을 눌러도 바뀐다)
const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      labelClassName,
      label,
      size,
      shape,
      tone,
      weight,
      id,
      ...props
    },
    ref,
  ) => {
    const autoId = React.useId();
    const cid = id ?? autoId;
    return (
      <label
        htmlFor={cid}
        className={cn(checkboxVariants({ size }), className)}
      >
        <Checkmark
          ref={ref}
          id={cid}
          size={size}
          shape={shape}
          tone={tone}
          {...props}
        />
        <span
          className={cn(
            checkboxLabelVariants({ size, weight }),
            labelClassName,
          )}
        >
          {label}
        </span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

// 묶음 — 세로로 쌓고 줄 사이 12. 제목 · 오류 글은 Field 로 감싸면 이어진다(라벨 → aria-labelledby, 설명 · 오류 → aria-describedby).
// Field 없이 쓰면 aria-label 또는 aria-labelledby 를 준다
const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    className={cn("flex flex-col gap-x3", className)}
    {...useFieldGroup(props)}
  />
));
CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, CheckboxGroup, Checkmark };
