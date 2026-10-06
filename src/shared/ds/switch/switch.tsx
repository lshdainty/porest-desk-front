import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

import {
  switchLabelVariants,
  switchmarkThumbVariants,
  switchmarkVariants,
  switchVariants,
} from "./switch-variants";

// 크기 · 톤 · 상태는 switch-variants.ts 머리 주석과 porest-design specs/components/switch.yaml 이 정한다.

export interface SwitchmarkProps
  extends
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchmarkVariants> {}

// 스위치 — 트랙과 엄지
const Switchmark = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchmarkProps
>(({ className, size, tone, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(switchmarkVariants({ size, tone }), className)}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={switchmarkThumbVariants({ size, tone })}
    />
  </SwitchPrimitive.Root>
));
Switchmark.displayName = "Switchmark";

export interface SwitchProps extends SwitchmarkProps {
  label: React.ReactNode;
  labelClassName?: string;
}

// 한 줄 — 스위치 + 라벨. 라벨은 <label htmlFor> 로 스위치와 잇는다(라벨을 눌러도 바뀐다)
const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, labelClassName, label, size, tone, id, ...props }, ref) => {
  const autoId = React.useId();
  const sid = id ?? autoId;
  return (
    <label htmlFor={sid} className={cn(switchVariants({ size }), className)}>
      <Switchmark ref={ref} id={sid} size={size} tone={tone} {...props} />
      <span className={cn(switchLabelVariants({ size }), labelClassName)}>
        {label}
      </span>
    </label>
  );
});
Switch.displayName = "Switch";

export { Switch, Switchmark };
