import * as React from "react";

/**
 * 쥐고 다루는(controlled) 값과 스스로 다루는 값을 한 곳에서 — prop 이 있으면 그것을 따르고, 바꾸려는 값은 늘 onChange 로 알린다.
 * Accordion 의 values 가 쓴다.
 */
export function useControllable<T>(
  prop: T | undefined,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined,
) {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = prop !== undefined;
  const value = controlled ? prop : inner;
  const set = (next: T) => {
    if (!controlled) setInner(next);
    onChange?.(next);
  };
  return [value, set] as const;
}
