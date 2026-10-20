import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import {
  submitImplicitly,
  useFieldGroup,
  useFieldGroupState,
} from "@/shared/ds/field";
import { Checkmark, CheckboxGroupContext } from "@/shared/ds/checkbox";
import { Radiomark, submitOnRadioEnter } from "@/shared/ds/radio-group";

import {
  SELECT_BOX_GHOST_NO_BG,
  SELECT_BOX_MARK,
  footerClasses,
  selectBoxBodyVariants,
  selectBoxContentVariants,
  selectBoxDescriptionVariants,
  selectBoxFooterInnerVariants,
  selectBoxGroupVariants,
  selectBoxLabelVariants,
  selectBoxPrefixVariants,
  selectBoxTriggerVariants,
  selectBoxVariants,
} from "./select-box-variants";

/*
 * Groo Select Box — 구조는 SEED Select Box(2026-10-01). 수치 원본은 groo-design specs/components/select-box.yaml(값은
 * src/shared/ds/spec/select-box.json). groo-design recipes/shadcn/components/ui/select-box.tsx 를 첫 판으로 가져왔다.
 *
 *   RadioSelectBoxGroup · RadioSelectBox   하나 고르기 — 묶음은 radiogroup, 오른쪽 라디오(Radiomark 20) 또는 없음
 *   CheckSelectBoxGroup · CheckSelectBox   여럿 고르기 — 묶음은 fieldset, 오른쪽 칸 없는 체크(Checkbox Ghost) 또는 없음
 *
 * 상자 하나 = 선택지 하나. 상자(div)는 테두리 · 바탕만 맡고, 그 안의 누르는 자리(label)가 콘텐츠 + 컨트롤을 담아 펼침(footer)을 뺀
 * 상자 전체가 누르는 영역이 된다. 고른 테두리는 ::after 로 안쪽 2px 에 덧그린다(바탕은 바꾸지 않는다). 누르면 바탕이
 * bg-layer-default-pressed 로 바뀌고 누르는 자리만 2px 거리로 준다(SEED scaleScope: content · v104) — 기준 길이
 * max(높이, 폭 ÷ 4, 24) 는 Button · List 처럼 누르는 순간 잰다. 컨트롤은 따로 줄지 않는다. 키보드 포커스 링은 상자 바깥에 하나만 —
 * 컨트롤은 자기 링을 끈다(SEED). 컨트롤이 '없음' 이어도 라디오 · 체크는 화면 밖에 두어(sr-only) 키보드 · 화면 읽기 프로그램이 그대로 쓴다.
 * 1열은 가로형(기본), 2 ~ 3열이면 세로형 — 묶음의 columns 가 정하고 상자마다 layout 으로 바꿀 수 있다.
 * 펼침은 고른 상자 아래로 열린다. 닫히면 보이지 않고 Tab 도 닿지 않는다.
 *
 * 묶음 — 하나 고르기는 role=radiogroup, 여럿은 <fieldset>. 둘 다 이름이 있어야 한다: Field 로 감싸면 Field 의 라벨이 이름(aria-labelledby)이고
 * 설명 · 오류가 설명이다, 아니면 aria-label · aria-labelledby 를 준다. Field 의 막힘은 묶음 aria-disabled 와 칸마다 disabled, 오류는
 * 상자를 바꾸지 않는다(묶음 아래 글 — Field 의 꼬리). 키 — 하나 고르기는 ← ↑ ↓ → 로 옮기며 고르고(Radix), 들어올 때 Tab 은 고른 상자
 * 하나로 온다. 여럿은 상자마다 Tab. Space 는 고르거나 켜고 끈다. Enter 는 고르지 않고 폼을 제출한다(Checkbox · Radio 와 같다, 2026-10-08).
 */

type Layout = "horizontal" | "vertical";
const SelectBoxGroupContext = React.createContext<{ columns: 1 | 2 | 3 }>({
  columns: 1,
});
const useLayout = (layout?: Layout): Layout => {
  const { columns } = React.useContext(SelectBoxGroupContext);
  return layout ?? (columns > 1 ? "vertical" : "horizontal");
};

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로(Button · List 와 같은 식) — 누르는 자리(label)에 단다.
// 키보드(Space)로 눌러도 :active 가 걸리므로 keydown 에서도 잰다. 가장자리를 오래 눌러도 click 이 그 자리로 가게
// 누른 요소가 포인터를 잡는다(마우스 · 펜 — 터치는 브라우저가 이미 잡는다)
function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}

const pressHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
    measurePress(e.currentTarget);
    const target = e.target as Element;
    if (e.pointerType !== "touch") target.setPointerCapture?.(e.pointerId);
  },
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) =>
    measurePress(e.currentTarget),
};

type BoxBase = {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** 앞 — 아이콘(22 로 맞춘다) · 그림 */
  prefix?: React.ReactNode;
  /** 고르면 상자 아래로 펼쳐지는 내용 — 딸린 입력 · 안내 */
  footer?: React.ReactNode;
  /** 펼침을 보일 때 — 고르면(기본) · 고르지 않으면 · 늘 */
  footerVisibility?: "when-selected" | "when-not-selected" | "always";
  /** 묶음의 열 수에서 온다(1열 가로형 · 2 ~ 3열 세로형) — 상자마다 바꿀 때만 */
  layout?: Layout;
  rootProps?: React.HTMLAttributes<HTMLDivElement>;
};

// 상자의 짜임 — div(테두리 · 바탕) > label(누르는 자리: 앞 · 본문 · 컨트롤) + 펼침
function Box({
  label,
  description,
  prefix,
  footer,
  footerVisibility = "when-selected",
  layout: layoutProp,
  rootProps: { className: rootClassName, ...rootRest } = {},
  disabled,
  htmlFor,
  control,
  mark,
}: BoxBase & {
  disabled?: boolean;
  htmlFor: string;
  control: React.ReactNode;
  mark: "radio" | "check" | "none";
}) {
  const layout = useLayout(layoutProp);
  return (
    <div
      data-slot="select-box"
      className={cn(selectBoxVariants(), rootClassName)}
      {...rootRest}
    >
      <label
        htmlFor={htmlFor}
        data-slot="select-box-trigger"
        data-select-box-action=""
        data-disabled={disabled ? "" : undefined}
        className={selectBoxTriggerVariants({ layout, mark })}
        {...pressHandlers}
      >
        <span
          data-slot="select-box-content"
          className={selectBoxContentVariants({ layout })}
        >
          {prefix && (
            <span
              data-slot="select-box-prefix"
              className={cn(selectBoxPrefixVariants({ disabled: !!disabled }))}
            >
              {prefix}
            </span>
          )}
          <span data-slot="select-box-body" className={selectBoxBodyVariants()}>
            <span
              data-slot="select-box-label"
              className={cn(selectBoxLabelVariants({ disabled: !!disabled }))}
            >
              {label}
            </span>
            {description && (
              <span
                data-slot="select-box-description"
                className={cn(
                  selectBoxDescriptionVariants({ disabled: !!disabled }),
                )}
              >
                {description}
              </span>
            )}
          </span>
        </span>
        {control}
      </label>
      {footer &&
        (footerVisibility === "always" ? (
          <div
            data-slot="select-box-footer-inner"
            className={selectBoxFooterInnerVariants()}
          >
            {footer}
          </div>
        ) : (
          <div
            data-slot="select-box-footer"
            className={footerClasses(footerVisibility)}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                data-slot="select-box-footer-inner"
                className={selectBoxFooterInnerVariants()}
              >
                {footer}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ── 하나 고르기 ───────────────────────────────────────────────
export interface RadioSelectBoxGroupProps
  extends
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    VariantProps<typeof selectBoxGroupVariants> {}

// 하나 고르기 묶음 — role=radiogroup, 이름 필수. 화살표로 옮기며 고른다. Enter 는 폼을 제출한다(Radio 와 같다).
// Field 의 막힘 · 오류 · 필수는 RadioGroup 처럼 받는다(묶음에 직접 준 값이 이긴다)
const RadioSelectBoxGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  RadioSelectBoxGroupProps
>(({ className, columns = 1, disabled, onKeyDown, ...props }, ref) => {
  const field = useFieldGroupState();
  const off = disabled ?? field.disabled;
  return (
    <SelectBoxGroupContext.Provider value={{ columns: columns ?? 1 }}>
      <RadioGroupPrimitive.Root
        ref={ref}
        data-slot="select-box-group"
        className={cn(selectBoxGroupVariants({ columns }), className)}
        disabled={off}
        {...(off ? { "aria-disabled": true } : {})}
        {...(field.invalid ? { "aria-invalid": true } : {})}
        {...(field.required ? { "aria-required": true } : {})}
        {...useFieldGroup(props)}
        onKeyDown={submitOnRadioEnter(onKeyDown)}
      />
    </SelectBoxGroupContext.Provider>
  );
});
RadioSelectBoxGroup.displayName = "RadioSelectBoxGroup";

export interface RadioSelectBoxProps
  extends
    BoxBase,
    Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
      "prefix" | "children"
    > {
  /** 오른쪽 컨트롤 — 라디오(기본) · 없음(테두리만) */
  control?: "radio" | "none";
}

// 하나 고르기 상자 — RadioSelectBoxGroup 안에 둔다
const RadioSelectBox = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioSelectBoxProps
>(
  (
    {
      label,
      description,
      prefix,
      footer,
      footerVisibility,
      layout,
      rootProps,
      control = "radio",
      id,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const autoId = React.useId();
    const rid = id ?? autoId;
    const mark =
      control === "radio" ? (
        <Radiomark
          ref={ref}
          id={rid}
          data-slot="select-box-control"
          data-select-box-control=""
          data-select-box-action=""
          size="medium"
          tone="neutral"
          disabled={disabled}
          className={cn(SELECT_BOX_MARK, className)}
          {...props}
        />
      ) : (
        <RadioGroupPrimitive.Item
          ref={ref}
          id={rid}
          data-slot="select-box-control"
          data-select-box-control=""
          data-select-box-action=""
          disabled={disabled}
          className={cn("sr-only", className)}
          {...props}
        />
      );
    return (
      <Box
        {...{
          label,
          description,
          prefix,
          footer,
          footerVisibility,
          layout,
          rootProps,
          disabled,
        }}
        htmlFor={rid}
        control={mark}
        mark={control === "radio" ? "radio" : "none"}
      />
    );
  },
);
RadioSelectBox.displayName = "RadioSelectBox";

// ── 여럿 고르기 ───────────────────────────────────────────────
export interface CheckSelectBoxGroupProps
  extends
    React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
    VariantProps<typeof selectBoxGroupVariants> {}

// 여럿 고르기 묶음 — fieldset, 이름 필수. "없음" 으로 여럿을 고르게 하면 몇 개까지인지 미리 적는다.
// Field 의 막힘 · 오류는 칸마다 건다(Checkbox 묶음과 같다 — role=group 은 aria-invalid · aria-required 를 받지 않는다)
const CheckSelectBoxGroup = React.forwardRef<
  HTMLFieldSetElement,
  CheckSelectBoxGroupProps
>(({ className, columns = 1, disabled, ...props }, ref) => {
  const field = useFieldGroupState();
  const own = props["aria-invalid"];
  const off = disabled ?? field.disabled;
  const invalid =
    own === undefined ? field.invalid : own === true || own === "true";
  return (
    <SelectBoxGroupContext.Provider value={{ columns: columns ?? 1 }}>
      <CheckboxGroupContext.Provider value={{ disabled: off, invalid }}>
        <fieldset
          ref={ref}
          data-slot="select-box-group"
          aria-disabled={off || undefined}
          className={cn(
            selectBoxGroupVariants({ columns }),
            "m-0 min-w-0 border-0 p-0",
            className,
          )}
          {...useFieldGroup(props)}
          aria-invalid={undefined}
          aria-required={undefined}
        />
      </CheckboxGroupContext.Provider>
    </SelectBoxGroupContext.Provider>
  );
});
CheckSelectBoxGroup.displayName = "CheckSelectBoxGroup";

export interface CheckSelectBoxProps
  extends
    BoxBase,
    Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      "prefix" | "children" | "checked" | "defaultChecked" | "onCheckedChange"
    > {
  /** 오른쪽 컨트롤 — 칸 없는 체크(기본) · 없음(테두리만) */
  control?: "check" | "none";
  // 일부 선택(indeterminate)은 없다 — 부모 · 자식 묶음은 Checkbox
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

// 여럿 고르기 상자 — CheckSelectBoxGroup 안에 둔다
const CheckSelectBox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckSelectBoxProps
>(
  (
    {
      label,
      description,
      prefix,
      footer,
      footerVisibility,
      layout,
      rootProps,
      control = "check",
      id,
      disabled,
      className,
      onCheckedChange,
      onKeyDown,
      ...rest
    },
    ref,
  ) => {
    const autoId = React.useId();
    const cid = id ?? autoId;
    const props = {
      ...rest,
      onCheckedChange:
        onCheckedChange &&
        ((v: CheckboxPrimitive.CheckedState) => onCheckedChange(v === true)),
    };
    const group = React.useContext(CheckboxGroupContext);
    const mark =
      control === "check" ? (
        <Checkmark
          ref={ref}
          id={cid}
          data-slot="select-box-control"
          data-select-box-control=""
          data-select-box-action=""
          size="medium"
          shape="ghost"
          tone="neutral"
          disabled={disabled}
          className={cn(SELECT_BOX_MARK, SELECT_BOX_GHOST_NO_BG, className)}
          onKeyDown={onKeyDown}
          {...props}
        />
      ) : (
        <CheckboxPrimitive.Root
          ref={ref}
          id={cid}
          data-slot="select-box-control"
          data-select-box-control=""
          data-select-box-action=""
          disabled={disabled ?? group?.disabled}
          aria-invalid={group?.invalid || undefined}
          className={cn("sr-only", className)}
          {...props}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            // Enter 는 폼을 제출한다 — Checkmark 와 같다(Radix 는 Enter 를 막기만 한다)
            if (!e.defaultPrevented && e.key === "Enter")
              submitImplicitly(e.currentTarget);
          }}
        />
      );
    return (
      <Box
        {...{
          label,
          description,
          prefix,
          footer,
          footerVisibility,
          layout,
          rootProps,
          disabled: disabled ?? group?.disabled,
        }}
        htmlFor={cid}
        control={mark}
        mark={control === "check" ? "check" : "none"}
      />
    );
  },
);
CheckSelectBox.displayName = "CheckSelectBox";

export {
  RadioSelectBoxGroup,
  RadioSelectBox,
  CheckSelectBoxGroup,
  CheckSelectBox,
};
