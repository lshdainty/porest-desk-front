import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import { useFieldGroup } from "@/shared/ds/field";

import {
  radioLabelVariants,
  radiomarkDotVariants,
  radiomarkVariants,
  radioVariants,
} from "./radio-group-variants";

// 크기 · 톤 · 굵기 · 상태는 radio-group-variants.ts 머리 주석과 porest-design specs/components/radio-group.yaml 이 정한다.

export interface RadiomarkProps
  extends
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radiomarkVariants> {}

// 동그라미 — RadioGroup 안에서만 쓴다
const Radiomark = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadiomarkProps
>(({ className, size, tone, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(radiomarkVariants({ size, tone }), className)}
    {...props}
  >
    <RadioGroupPrimitive.Indicator
      forceMount
      className={radiomarkDotVariants({ size, tone })}
    />
  </RadioGroupPrimitive.Item>
));
Radiomark.displayName = "Radiomark";

export interface RadioProps
  extends RadiomarkProps, VariantProps<typeof radioLabelVariants> {
  label: React.ReactNode;
  labelClassName?: string;
}

// 한 줄 — 동그라미 + 라벨. 라벨은 <label htmlFor> 로 동그라미와 잇는다(라벨을 눌러도 고른다)
const Radio = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioProps
>(
  (
    { className, labelClassName, label, size, tone, weight, id, ...props },
    ref,
  ) => {
    const autoId = React.useId();
    const rid = id ?? autoId;
    return (
      <label htmlFor={rid} className={cn(radioVariants({ size }), className)}>
        <Radiomark ref={ref} id={rid} size={size} tone={tone} {...props} />
        <span
          className={cn(radioLabelVariants({ size, weight }), labelClassName)}
        >
          {label}
        </span>
      </label>
    );
  },
);
Radio.displayName = "Radio";

// 묶음 — 세로로 쌓고 줄 사이 12. 제목 · 오류 글은 Field 로 감싸면 이어진다(라벨 → aria-labelledby, 설명 · 오류 → aria-describedby).
// Field 없이 쓰면 aria-label 또는 aria-labelledby 를 준다
const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-x3", className)}
    {...useFieldGroup(props)}
  />
));
RadioGroup.displayName = "RadioGroup";

export { Radio, RadioGroup, Radiomark };
