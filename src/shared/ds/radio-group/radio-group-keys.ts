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

// 하나 고르기 묶음이 받지 않는 키 — Home · End · PageUp · PageDown(화살표만 — SEED · 진짜 라디오 · APG, 사용자 결정 2026-10-17 — 03-E 결정 3 A).
// Radix 의 RovingFocusGroup 은 이 키로 초점만 첫 · 끝으로 옮긴다(고르지 않는다) — 초점과 고른 것이 갈려, Tab 으로 나갔다 오면 고른 것으로 돌아간다.
// 묶음이 캡처 단계에서 기본 동작을 막는다 — Radix 의 항목 처리는 defaultPrevented 면 건너뛰고, 화면도 스크롤되지 않는다.
// 라디오가 아닌 곳(Select Box 펼침 안의 입력칸)에서는 그대로 둔다. 라디오를 담는 묶음(RadioGroup · ChipRadioGroup · SegmentedControl ·
// ListRadioGroup · RadioSelectBoxGroup · ColorSwatchGroup)이 함께 쓴다.
const RADIO_JUMP_KEYS = new Set(["Home", "End", "PageUp", "PageDown"]);
export function ignoreRadioJumpKeys(
  onKeyDownCapture?: React.KeyboardEventHandler<HTMLDivElement>,
) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(e);
    const item = e.target;
    if (
      RADIO_JUMP_KEYS.has(e.key) &&
      item instanceof HTMLElement &&
      item.getAttribute("role") === "radio"
    )
      e.preventDefault();
  };
}
