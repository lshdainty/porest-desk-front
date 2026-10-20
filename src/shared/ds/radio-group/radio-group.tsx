import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import { useFieldGroup, useFieldGroupState } from "@/shared/ds/field";

import { submitOnRadioEnter } from "./radio-group-keys";
import {
  radioLabelVariants,
  radiomarkDotVariants,
  radiomarkVariants,
  radioVariants,
} from "./radio-group-variants";

// 크기 · 톤 · 굵기 · 상태는 radio-group-variants.ts 머리 주석과 groo-design specs/components/radio-group.yaml 이 정한다.
// 키 — 화살표는 옮기며 고르고 Space 는 포커스된 선택지를 고른다. Enter 는 폼을 제출한다(진짜 input · SEED 와 같다 — 폼의 기본 버튼을
// 누른다, 고르지 않는다). Radix 의 항목은 onKeyDown 을 덮어써 Enter 를 막기만 하므로 묶음이 받는다(submitOnRadioEnter — Radiomark 를
// 담는 List · Select Box 의 묶음도 같이 쓴다, 사용자 결정 2026-10-08). 라벨 안에 링크 · 버튼을 두지 않는다 — 누르는 영역(::before)이
// 덮는다. 링크는 라벨 옆 · 아래에(radio-group.md Don't).
// 묶음의 상태 — Field 의 막힘은 묶음 aria-disabled 와 칸마다 disabled(Radix disabled), 오류 · 필수는 radiogroup 의 aria-invalid ·
// aria-required 다(SEED RadioGroup 과 같다). 묶음에 직접 준 값이 이긴다.

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
// Field 없이 쓰면 aria-label 또는 aria-labelledby 를 준다. Field 의 막힘 · 오류 · 필수도 받는다(머리 주석) — 묶음에 직접 준 값이 이긴다
const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, disabled, onKeyDown, ...props }, ref) => {
  const field = useFieldGroupState();
  const off = disabled ?? field.disabled;
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn("flex flex-col gap-x3", className)}
      disabled={off}
      {...(off ? { "aria-disabled": true } : {})}
      {...(field.invalid ? { "aria-invalid": true } : {})}
      {...(field.required ? { "aria-required": true } : {})}
      {...useFieldGroup(props)}
      onKeyDown={submitOnRadioEnter(onKeyDown)}
    />
  );
});
RadioGroup.displayName = "RadioGroup";

export { Radio, RadioGroup, Radiomark };
