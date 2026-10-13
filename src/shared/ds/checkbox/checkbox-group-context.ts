import * as React from "react";

// 묶음(CheckboxGroup)이 칸에 넘기는 상태 — 막힘 · 오류. 칸에 직접 준 값이 이긴다.
// 문맥은 컴포넌트가 아니라 따로 둔다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
export type CheckboxGroupState = { disabled: boolean; invalid: boolean };

export const CheckboxGroupContext =
  React.createContext<CheckboxGroupState | null>(null);
