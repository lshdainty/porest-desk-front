import * as React from "react";
import { CircleX } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useField, useFieldControl } from "@/shared/ds/field";
import { mergeRefs } from "@/shared/ds/overlay";

import {
  CLEAR,
  CONTENT,
  CONTENT_PRESS,
  inputButtonSurfaceVariants,
  inputButtonVariants,
  measurePress,
  swallowClick,
} from "./input-button-variants";
import { useDsText } from "@/shared/ds/i18n";

/*
 * Groo Input Button — 구조는 SEED Input Button(React 이름 Field Button, 2026-10-01). 수치 원본은 groo-design
 * specs/components/input-button.yaml(값은 src/shared/ds/spec/input-button.json). groo-design recipes/shadcn/components/ui/
 * input-button.tsx 를 첫 판으로 가져왔다 — 변형(cva) · 상수는 input-button-variants.ts, 여는 자리 훅은 use-input-button-surface.ts.
 *
 * 입력칸 모양의 버튼 — 누르면 고르는 자리(달력 · 시각 휠 · 아이콘 격자 · 검색 시트)를 연다. 이 컴포넌트는 무엇을 여는지 모른다:
 * 값은 쓰는 쪽이 가지고(value), 누르면 onClick 을 부를 뿐이다. 시트(BottomSheet) · 팝오버(Popover)와 그 안의 내용은 쓰는 쪽이
 * useInputButtonSurface() 로 정해 짠다 — 뒤 묶음(Date · Time Picker · Icon Picker)이 그 위에 얹힌다. 팝오버는 PopoverTrigger asChild 로
 * 감싸도 된다(버튼이 ref · onClick · aria-* 를 그대로 받는다). 라벨 · 설명 · 오류는 Field 가 둘레에서 그린다 — Field 안에 두면 id · aria 를 받는다.
 *
 * 상자(div)는 크기 · 여백 · 모서리만 갖고, 진짜 버튼은 상자를 덮는 배경 층이다(SEED) — 테두리(안쪽 1px) · 바탕 · 키보드 포커스 링 ·
 * 오류 2px(::after)를 그리고, 상자 어디를 눌러도(붙이개 · 여백 포함) 눌린다. 값 · 붙이개는 그 위 콘텐츠 층에 얹고 누름을 지나
 * 보낸다(pointer-events: none). 지우기 버튼만 그 위에서 따로 눌린다 — 버튼 안에 버튼을 두지 않는다.
 *
 * 누르면 바탕이 bg-layer-default-pressed 로 바뀌고 콘텐츠 층만 2px 거리로 준다(SEED scaleScope: content · v104) —
 * 배율 = (기준 − 2) ÷ 기준, 기준 = max(높이, 폭 ÷ 4, 24). Button · List 처럼 누르는 순간(포인터 · Enter · Space) 상자를 재서
 * --press-basis 로 넘긴다. 마우스는 호버에 같은 바탕(지우기 버튼 위에서도 상자의 호버를 잇는다). 모션 줄이기면 축소하지 않는다.
 * 포커스 링은 키보드 포커스에만(버튼이라 마우스 · 터치로 눌러서는 없다). 오류의 2px 는 1px 위에 덧그리고 눌러도 그대로다.
 * 비활성은 버튼을 막는다(disabled). 읽기 전용은 포커스는 되고(aria-disabled) 눌러도 · Enter · Space 로도 onClick 을 부르지
 * 않는다. 둘 다 회색 바탕(bg-disabled)으로 가르고 흐리게 하지 않는다(v106) — 읽기 전용의 값은 진한 글자 그대로다.
 *
 * 이름은 Field 의 라벨 + 고른 값(aria-labelledby — "날짜 10월 1일 (목)"), 비면 라벨 + placeholder. aria-label 을 주면
 * 라벨 대신 그 글 + 값이고, aria-labelledby 를 주면 그대로 쓴다. 붙이개 글(prefix · suffix)은 설명으로 읽힌다(단위가 화면
 * 읽기 프로그램에도 들리게 — Input 과 같다). 필수는 설명으로 "필수" 를 읽힌다 — aria-required 는 버튼에 쓸 수 없는 속성이다
 * (화면의 필수 점은 Field 가 그린다).
 * 지우기(onClear)는 값이 있고 막히지 않았을 때만 — 누르면 onClear 만 부르고(onClick 은 부르지 않는다 — 열지 않는다)
 * 칸에 포커스를 둔다. 누름도 지우기 버튼만 준다(상자는 눌리지 않는다). Tab 순서에 없다.
 *
 * 크기: large 52 · medium 40(1280 이상 데스크톱 웹만) · responsive(웹 기본 — 1280 미만 large · 이상 medium). 앱은 늘 large.
 * className · style 은 버튼에, rootClassName · rootRef 는 상자(div)에 간다 — 폭은 rootClassName 으로 정한다.
 *
 * 레시피와 다른 자리
 *   - 지우기 버튼의 이름 "지우기" 를 clearLabel 로 받는다(기본 "지우기") — 번역 키를 이 컴포넌트가 들지 않고 부르는 쪽이 넘긴다(Input 의 방식은
 *     고정 글이지만 Input Button 은 뒤 묶음이 얹히며 나라별 글을 줄 수 있게 열어 둔다).
 *   - useInputButtonSurface 는 overlay/useWideSurface 위에 얹었다(use-input-button-surface.ts) — 1280 경계를 한 곳에서 읽는다.
 */

const join = (...ids: (string | undefined | false | null)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

export interface InputButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "prefix"
> {
  /** 고른 값 — 고른 자리의 표기 그대로(날짜 · 시각 · 이름). 비면(undefined · null · "") placeholder */
  value?: React.ReactNode;
  /** 고르기 전의 글 — "{값의 종류} 선택"("날짜 선택"). 마침표 없이 */
  placeholder?: string;
  /** large 52 · medium 40(1280 이상 데스크톱 웹만) · responsive(웹 기본 — 1280 에서 바뀐다). 앱은 large */
  size?: "large" | "medium" | "responsive";
  /** 앞 글자 — 만 · https:// */
  prefix?: React.ReactNode;
  /** 앞 아이콘 — 값의 종류 · 고른 값에 딸린 아이콘(카테고리) */
  prefixIcon?: React.ReactNode;
  /** 뒤 글자 — 단위(세 · cm) */
  suffix?: React.ReactNode;
  /** 뒤 아이콘 — 누르면 무엇이 열리는지(달력 · 시계 · 아래 화살표) */
  suffixIcon?: React.ReactNode;
  /** 지우기 버튼 — 주면 값이 있고 막히지 않았을 때만 보인다. 선택 사항인 칸에 */
  onClear?: () => void;
  /** 지우기 버튼의 이름 — 기본 "지우기" */
  clearLabel?: string;
  /** 읽기 전용 — 포커스는 되고 열리지 않는다(onClick 을 부르지 않는다) */
  readOnly?: boolean;
  /** 상자(div)의 className — className 은 버튼에 간다 */
  rootClassName?: string;
  /** 상자(div)의 ref — ref 는 버튼에 간다(팝오버의 기준 · 포커스) */
  rootRef?: React.Ref<HTMLDivElement>;
}

const InputButton = React.forwardRef<HTMLButtonElement, InputButtonProps>(
  (
    {
      value,
      placeholder,
      size = "responsive",
      prefix,
      prefixIcon,
      suffix,
      suffixIcon,
      onClear,
      clearLabel: clearLabelProp,
      readOnly: readOnlyProp,
      rootClassName,
      rootRef,
      className,
      type = "button",
      id,
      disabled: disabledProp,
      onClick,
      onPointerDown,
      onKeyDown,
      "aria-invalid": ariaInvalid,
      "aria-required": ariaRequired,
      "aria-describedby": ariaDescribedBy,
      "aria-labelledby": ariaLabelledBy,
      "aria-disabled": ariaDisabled,
      ...props
    },
    ref,
  ) => {
    const dsT = useDsText();
    const clearLabel = clearLabelProp ?? dsT("common.clear");
    const field = useField();
    const control = useFieldControl({
      id,
      disabled: disabledProp,
      readOnly: readOnlyProp,
      "aria-invalid": ariaInvalid,
      "aria-required": ariaRequired,
      "aria-describedby": ariaDescribedBy,
    });
    const boxRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const auto = React.useId();
    const buttonId = control.id ?? `${auto}button`;
    const valueId = `${auto}value`;
    const prefixId = prefix != null ? `${auto}prefix` : undefined;
    const required =
      control["aria-required"] === true || control["aria-required"] === "true";
    const requiredId = required ? `${auto}required` : undefined;
    const suffixId = suffix != null ? `${auto}suffix` : undefined;
    const disabled = !!control.disabled;
    const readOnly = !!control.readOnly;
    const invalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";
    const interactive = !disabled && !readOnly;
    const hasValue = value != null && value !== false && value !== "";
    const showClear = onClear != null && hasValue && interactive;
    const iconColor = disabled ? "text-fg-disabled" : "text-fg-neutral-muted";
    const affixColor = disabled ? "text-fg-disabled" : "text-fg-neutral-subtle";
    const valueColor = disabled
      ? "text-fg-disabled"
      : hasValue
        ? "text-fg-neutral"
        : "text-fg-placeholder";
    // 이름 — 라벨(aria-label 을 주면 그 글) 다음에 값이 이어 읽힌다. 자기 id 를 가리키면 aria-label 이 그 자리에 읽힌다
    const labelledBy =
      ariaLabelledBy ??
      join(props["aria-label"] ? buttonId : field?.labelId, valueId);

    const clear = () => {
      onClear?.();
      buttonRef.current?.focus();
    };

    return (
      <div
        ref={mergeRefs(rootRef, boxRef)}
        data-slot="input-button"
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        className={cn(
          "group/input-button relative isolate flex w-full min-w-0 items-center",
          inputButtonVariants({ size }),
          rootClassName,
        )}
      >
        <button
          ref={mergeRefs(ref, buttonRef)}
          type={type}
          data-slot="input-button-trigger"
          className={cn(
            "peer/input-button absolute inset-0 m-0 appearance-none rounded-[inherit] border-0 p-0",
            inputButtonSurfaceVariants({
              state: disabled ? "disabled" : readOnly ? "readonly" : "enabled",
              hover: "group",
              invalid,
            }),
            className,
          )}
          {...props}
          id={buttonId}
          disabled={disabled}
          aria-disabled={readOnly || ariaDisabled || undefined}
          aria-invalid={control["aria-invalid"]}
          aria-labelledby={labelledBy}
          aria-describedby={join(
            requiredId,
            prefixId,
            suffixId,
            control["aria-describedby"],
          )}
          onClick={readOnly ? swallowClick : onClick}
          onPointerDown={(e) => {
            measurePress(boxRef.current);
            onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            // Space 를 누르는 동안에도 :active 가 걸린다 — 키로 눌러도 잰다
            if (e.key === " " || e.key === "Enter")
              measurePress(boxRef.current);
            onKeyDown?.(e);
          }}
        />
        <span
          data-slot="input-button-content"
          className={cn(CONTENT, interactive && CONTENT_PRESS)}
        >
          {prefixIcon != null && (
            <span
              aria-hidden
              data-slot="input-button-prefix-icon"
              className={cn(
                "flex shrink-0 [&>svg]:size-[var(--input-button-icon)]",
                iconColor,
              )}
            >
              {prefixIcon}
            </span>
          )}
          {prefix != null && (
            <span
              id={prefixId}
              aria-hidden
              data-slot="input-button-prefix"
              className={cn("shrink-0", affixColor)}
            >
              {prefix}
            </span>
          )}
          <span
            id={valueId}
            aria-hidden
            data-slot="input-button-value"
            data-placeholder={hasValue ? undefined : ""}
            className={cn("min-w-0 flex-1 truncate text-left", valueColor)}
          >
            {hasValue ? value : placeholder}
          </span>
          {showClear && (
            <button
              type="button"
              aria-label={clearLabel}
              tabIndex={-1}
              data-slot="input-button-clear"
              onClick={clear}
              className={CLEAR}
            >
              <CircleX aria-hidden strokeWidth={2} />
            </button>
          )}
          {suffix != null && (
            <span
              id={suffixId}
              aria-hidden
              data-slot="input-button-suffix"
              className={cn("shrink-0", affixColor)}
            >
              {suffix}
            </span>
          )}
          {suffixIcon != null && (
            <span
              aria-hidden
              data-slot="input-button-suffix-icon"
              className={cn(
                "flex shrink-0 [&>svg]:size-[var(--input-button-icon)]",
                iconColor,
              )}
            >
              {suffixIcon}
            </span>
          )}
        </span>
        {required && (
          <span id={requiredId} className="sr-only">
            {dsT("common.required")}
          </span>
        )}
      </div>
    );
  },
);
InputButton.displayName = "InputButton";

export { InputButton };
