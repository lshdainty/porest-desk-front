import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import {
  submitImplicitly,
  useFieldGroup,
  useFieldGroupState,
} from "@/shared/ds/field";

import {
  checkboxLabelVariants,
  checkboxVariants,
  checkmarkVariants,
} from "./checkbox-variants";
import { CheckboxGroupContext } from "./checkbox-group-context";

// 크기 · 모양 · 톤 · 굵기 · 상태는 checkbox-variants.ts 머리 주석과 porest-design specs/components/checkbox.yaml 이 정한다.
// 키 — Space 는 켜고 끈다. Enter 는 폼을 제출한다(진짜 input · SEED 와 같다 — 폼의 기본 버튼을 누른다, 칸은 바뀌지 않는다).
// Radix 는 Enter 를 막기만 해서 칸이 받아 제출한다(사용자 결정 2026-10-08). 라벨 안에 링크 · 버튼을 두지 않는다 — 누르는 영역(::before)이
// 덮는다. 링크는 라벨 옆 · 아래에(checkbox.md Don't).
// 묶음의 상태 — Field(또는 묶음에 준 disabled · aria-invalid)의 막힘은 묶음 aria-disabled 와 칸마다 disabled, 오류는 칸마다
// aria-invalid 다. role="group" 은 aria-invalid · aria-required 를 받지 않아 묶음에는 걸지 않는다(SEED useFieldset 과 같다).

export interface CheckmarkProps
  extends
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkmarkVariants> {}

// 칸 — 체크 · 가로줄(일부 선택). Ghost 는 선택 안 됨에도 옅은 체크를 보인다(forceMount)
const Checkmark = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckmarkProps
>(({ className, size, shape, tone, disabled, onKeyDown, ...props }, ref) => {
  const group = React.useContext(CheckboxGroupContext);
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkmarkVariants({ size, shape, tone }), className)}
      disabled={disabled ?? group?.disabled}
      aria-invalid={group?.invalid || undefined}
      {...props}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        // Enter 는 폼을 제출한다 — Radix 는 Enter 를 막기만 한다(그 뒤에 막으므로 여기서는 부르는 쪽이 막았는지만 본다)
        if (!e.defaultPrevented && e.key === "Enter")
          submitImplicitly(e.currentTarget);
      }}
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
  );
});
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

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 칸을 모두 막는다 — 묶음 aria-disabled, 칸마다 disabled. Field 의 disabled 도 같다 */
  disabled?: boolean;
}

// 묶음 — 세로로 쌓고 줄 사이 12. 제목 · 오류 글은 Field 로 감싸면 이어진다(라벨 → aria-labelledby, 설명 · 오류 → aria-describedby).
// Field 없이 쓰면 aria-label 또는 aria-labelledby 를 준다. Field 의 막힘 · 오류는 칸에 나눠 건다(머리 주석) — 묶음에 준 disabled ·
// aria-invalid 가 이긴다. 필수는 묶음에 걸지 않는다(role=group 은 받지 않는다) — 고르지 않고 내면 오류 글이 알린다
const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ className, disabled, ...props }, ref) => {
    const field = useFieldGroupState();
    const own = props["aria-invalid"];
    const off = disabled ?? field.disabled;
    const invalid =
      own === undefined ? field.invalid : own === true || own === "true";
    const state = { disabled: off, invalid };
    return (
      <CheckboxGroupContext.Provider value={state}>
        <div
          ref={ref}
          role="group"
          aria-disabled={off || undefined}
          className={cn("flex flex-col gap-x3", className)}
          {...useFieldGroup(props)}
          aria-invalid={undefined}
          aria-required={undefined}
        />
      </CheckboxGroupContext.Provider>
    );
  },
);
CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, CheckboxGroup, Checkmark };
