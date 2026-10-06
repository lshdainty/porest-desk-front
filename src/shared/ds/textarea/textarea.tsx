import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { useFieldControl, useTextControl } from "@/shared/ds/field";

import { textareaValueVariants, textareaVariants } from "./textarea-variants";

/*
 * Porest Textarea — 구조는 SEED Textarea(Text Input 의 여러 줄, 2026-10-01). 수치 원본은 porest-design
 * specs/components/textarea.yaml(값은 src/shared/ds/spec/textarea.json).
 * porest-design recipes/shadcn/components/ui/textarea.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 상자 · 입력 변형(cva)은
 * textarea-variants.ts 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 여러 줄 입력칸. 상자 · 테두리 · 상태는 Input 의 outline 과 같다 — 안쪽 1px, 포커스 · 오류 2px 는 ::after 로 덧그린다.
 * 라벨 · 설명 · 오류 · 글자 수는 Field 가 둘레에서 그린다.
 *
 * 높이(autoSize)
 *   true(기본)  3줄(large 94 · medium 82)에서 시작해 쓴 만큼 자란다. 최대 높이(max-h-*)를 주면 그 높이부터 칸 안에서 스크롤
 *   false       고정 높이 — 자리마다 높이(h-* · rows)를 정한다. 2줄(72 · 62)보다 낮게 두지 않고, 넘치면 칸 안에서 스크롤
 * 손잡이(resize)는 두지 않는다 — 자동 높이가 대신한다.
 * 크기: large(글자 16 · 모서리 12) · medium(14 · 8, 1280 이상 데스크톱 웹만) · responsive(웹 기본). 앱은 늘 large.
 *
 * 레시피는 맞추는 함수(fit)를 useCallback 으로 묶어 폭 관찰 효과의 의존에 넣었다. 이 레포는 손 메모이제이션을 두지 않고
 * (React Compiler), 테스트는 컴파일하지 않은 코드를 돈다 — 렌더마다 새 함수가 의존에 들어가면 관찰을 렌더마다 다시 건다.
 * 그래서 맞추는 일은 모듈 함수(fitHeight)로 빼고, 관찰 효과는 autoSize 에만 기댄다(동작은 레시피와 같다).
 */

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// 자동 높이 — 내용 높이에 맞추고, 최대 높이(max-height)를 넘으면 그 높이에서 멈추고 스크롤한다
function fitHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  const max = parseFloat(getComputedStyle(el).maxHeight);
  const full = el.scrollHeight;
  const limit = Number.isFinite(max) ? max : Infinity;
  el.style.height = `${Math.min(full, limit)}px`;
  el.style.overflowY = full > limit ? "auto" : "hidden";
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** large(글자 16) · medium(14, 1280 이상 데스크톱 웹만) · responsive(웹 기본). 앱은 large */
  size?: "large" | "medium" | "responsive";
  /** 자동 높이(기본) — 3줄에서 시작해 쓴 만큼 자란다. false 면 고정 높이(2줄 이상, 넘치면 스크롤) */
  autoSize?: boolean;
  /** 상자(div)의 className — className 은 입력(<textarea>)에 간다(max-h-* · h-* 는 여기) */
  rootClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = "responsive",
      autoSize = true,
      rootClassName,
      className,
      rows,
      onChange,
      onCompositionEnd,
      ...props
    },
    ref,
  ) => {
    const areaRef = React.useRef<HTMLTextAreaElement>(null);
    const control = useFieldControl(props);
    const text = useTextControl(areaRef, { onChange, onCompositionEnd });
    const disabled = !!control.disabled;
    const readOnly = !!control.readOnly;
    const invalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";

    const fit = () => {
      const el = areaRef.current;
      if (el && autoSize) fitHeight(el);
    };

    // 값이 밖에서 바뀌어도(제어 값 · reset) 맞춘다
    useIsoLayoutEffect(() => {
      fit();
    });
    // 폭이 바뀌어 줄이 다시 감기면 맞춘다 — 높이만 바뀐 것(맞추기가 바꾼 높이)은 넘긴다
    React.useEffect(() => {
      const el = areaRef.current;
      if (!el || !autoSize || typeof ResizeObserver === "undefined") return;
      let width = el.offsetWidth;
      const ro = new ResizeObserver(() => {
        if (el.offsetWidth === width) return;
        width = el.offsetWidth;
        fitHeight(el);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [autoSize]);

    return (
      <div
        data-slot="textarea"
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        className={cn(textareaVariants({ size }), rootClassName)}
      >
        <textarea
          ref={mergeRefs(ref, areaRef)}
          rows={rows ?? (autoSize ? 3 : 2)}
          data-slot="textarea-value"
          className={cn(
            textareaValueVariants({ size, autoSize }),
            disabled
              ? "text-fg-disabled placeholder:text-fg-disabled"
              : "text-fg-neutral placeholder:text-fg-placeholder",
            className,
          )}
          {...props}
          {...control}
          onChange={(e) => {
            text.onChange(e);
            fit();
          }}
          onCompositionEnd={text.onCompositionEnd}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
