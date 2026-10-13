import type * as React from "react";

import { submitImplicitly } from "@/shared/ds/field";

// 묶음이 받는 Enter — 진짜 input 처럼 폼을 제출한다(폼의 기본 버튼을 누른다). Radix 의 항목은 Enter 를 막기만 하고 묶음으로 올려 보낸다.
// Radiomark 를 담는 묶음(RadioGroup · List 의 ListRadioGroup · Select Box 의 RadioSelectBoxGroup)이 함께 쓴다.
// 컴포넌트가 아니라 따로 둔다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
export function submitOnRadioEnter(
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>,
) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const item = e.target;
    if (
      e.key === "Enter" &&
      item instanceof HTMLButtonElement &&
      item.getAttribute("role") === "radio"
    )
      submitImplicitly(item);
  };
}
