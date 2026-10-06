import * as React from "react";

/*
 * Field 문맥 — 입력 · 묶음이 Field 의 값을 받는 훅과 자소(grapheme) 셈. 컴포넌트는 field.tsx 다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침). porest-design recipes/shadcn/components/ui/field.tsx 에서
 * 컴포넌트가 아닌 것을 옮겨 왔다.
 *
 *   useField         Field 안이면 그 문맥, 밖이면 null — 고르는 칸(Input Button · Select)이 글자 수 · 묶음 여부를 본다
 *   useFieldControl  입력(Input · Textarea)이 Field 의 id · 설명 · 오류 · 필수 · 막힘을 받는다
 *   useFieldGroup    묶음(Checkbox · Radio · Select Box)이 Field 의 라벨을 이름으로, 설명 · 오류를 설명으로 받는다
 *   useTextControl   입력 · 여러 줄 입력의 글자 수 — 자소 단위로 세고 최대에서 자른다(한글 조합이 끝난 뒤)
 */

// ── 자소(grapheme) ────────────────────────────────────────────
// Intl.Segmenter 는 ES2022 다. 이 레포의 TypeScript lib 은 ES2020 이라 쓰는 모양만 여기 적는다(없는 환경은 코드 포인트로 센다)
type GraphemeSegmenter = {
  segment(input: string): Iterable<{ segment: string }>;
};
const Segmenter =
  typeof Intl !== "undefined"
    ? (
        Intl as unknown as {
          Segmenter?: new (
            locales: string,
            options: { granularity: "grapheme" },
          ) => GraphemeSegmenter;
        }
      ).Segmenter
    : undefined;
const segmenter = Segmenter
  ? new Segmenter("ko", { granularity: "grapheme" })
  : null;

function graphemesOf(value: string): string[] {
  return segmenter
    ? Array.from(segmenter.segment(value), (s) => s.segment)
    : Array.from(value);
}

export function countGraphemes(value: string) {
  return graphemesOf(value).length;
}

export function sliceGraphemes(value: string, max: number) {
  const all = graphemesOf(value);
  return all.length > max ? all.slice(0, max).join("") : value;
}

// 값을 바꾸고 input 이벤트를 보낸다 — 제어 · 비제어 · react-hook-form 모두 onChange 로 새 값을 받는다
export function setNativeValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// ── Field 문맥 ────────────────────────────────────────────────
export type FieldContextValue = {
  controlId: string;
  labelId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  maxGraphemeCount: number | undefined;
  setGraphemeCount: (count: number) => void;
  setControlId: (id: string | undefined) => void;
  setGroup: (group: boolean) => void;
};

export const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useField() {
  return React.useContext(FieldContext);
}

export const join = (...ids: (string | undefined | false | null)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

type ControlProps = {
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-required"?: React.AriaAttributes["aria-required"];
  "aria-describedby"?: string;
};

// 입력이 Field 안에 있으면 Field 의 값을 받는다. 입력에 직접 준 값이 이긴다(id 를 주면 라벨도 그 id 로 간다)
export function useFieldControl(props: ControlProps) {
  const field = useField();
  const setControlId = field?.setControlId;
  useIsoLayoutEffect(() => {
    if (!setControlId || !props.id) return;
    setControlId(props.id);
    return () => setControlId(undefined);
  }, [setControlId, props.id]);
  if (!field) return props;
  return {
    id: props.id ?? field.controlId,
    disabled: props.disabled ?? (field.disabled || undefined),
    readOnly: props.readOnly ?? (field.readOnly || undefined),
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    "aria-required": props["aria-required"] ?? (field.required || undefined),
    "aria-describedby": join(field.describedBy, props["aria-describedby"]),
  };
}

// 묶음이 Field 안에 있으면 라벨을 이름으로, 설명 · 오류 · 글자 수를 설명으로 잇는다. 묶음에 직접 준 값이 이긴다
export function useFieldGroup<
  P extends {
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  },
>(props: P) {
  const field = useField();
  const setGroup = field?.setGroup;
  useIsoLayoutEffect(() => {
    if (!setGroup) return;
    setGroup(true);
    return () => setGroup(false);
  }, [setGroup]);
  if (!field) return props;
  return {
    ...props,
    "aria-labelledby":
      props["aria-labelledby"] ??
      (props["aria-label"] ? undefined : field.labelId),
    "aria-describedby": join(field.describedBy, props["aria-describedby"]),
  };
}

// 입력 · 여러 줄 입력이 함께 쓴다 — 값이 있는지(지우기 버튼) · 글자 수(Field)를 알리고, 최대에서 자른다.
// 한글을 조합하는 동안에는 자르지 않는다(조합이 깨진다) — 조합이 끝나면 자르고 onChange 로 새 값을 보낸다
export function useTextControl<
  E extends HTMLInputElement | HTMLTextAreaElement,
>(
  ref: React.RefObject<E | null>,
  handlers: {
    onChange?: React.ChangeEventHandler<E>;
    onCompositionEnd?: React.CompositionEventHandler<E>;
  },
) {
  const field = useField();
  const max = field?.maxGraphemeCount;
  const setCount = field?.setGraphemeCount;
  const [hasValue, setHasValue] = React.useState(false);
  // 손 메모이제이션은 두지 않는다(React Compiler) — 아래 효과는 의존 배열이 없어 함수의 정체가 바뀌어도 상관없다
  const sync = (value: string) => {
    setHasValue(value !== "");
    setCount?.(countGraphemes(value));
  };
  // 값이 밖에서 바뀌어도(제어 값 · reset) 그린 뒤 다시 센다
  useIsoLayoutEffect(() => {
    if (ref.current) sync(ref.current.value);
  });
  const onChange = (e: React.ChangeEvent<E>) => {
    const el = e.currentTarget;
    if (max != null && !(e.nativeEvent as InputEvent).isComposing) {
      const sliced = sliceGraphemes(el.value, max);
      if (sliced !== el.value) el.value = sliced;
    }
    sync(el.value);
    handlers.onChange?.(e);
  };
  const onCompositionEnd = (e: React.CompositionEvent<E>) => {
    const el = e.currentTarget;
    if (max != null) {
      const sliced = sliceGraphemes(el.value, max);
      if (sliced !== el.value) setNativeValue(el, sliced);
    }
    handlers.onCompositionEnd?.(e);
  };
  return { hasValue, onChange, onCompositionEnd };
}
