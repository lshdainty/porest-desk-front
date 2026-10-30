import { useEffect, useMemo, useState } from "react";
import { niceAxis } from "./chartAxis";

/**
 * 세로축(Y) 폭 — 눈금 글자 중 **가장 긴 것**을 실제로 재서 잡는다(스펙 chart.md "세로축의 폭은 가장
 * 긴 글자('−3,000만')가 잘리지 않게", 결함 D6). 고정 폭(44 · 52)은 음수 부호 하나로 첫 글자가 잘렸다.
 *
 * 숨은 span 에 눈금 글자와 같은 글꼴 · 크기(`--text-badge`, rem 이라 글자 크기 200% 도 따라간다)를
 * 주고 `getBoundingClientRect().width` 를 읽는다. 레이아웃이 없는 환경(jsdom)이면 글자 수 추정치로 돌아간다.
 * 웹폰트가 늦게 도착하면 `document.fonts.ready` 뒤에 한 번 더 잰다.
 */
export const AXIS_TICK_FONT_SIZE = "var(--text-badge)";
/** 눈금 글자 옆 여백(recharts tickMargin + 안전 여유). */
const AXIS_PAD = 10;

const estimate = (s: string): number =>
  [...s].reduce((w, c) => w + (c > "ᄀ" ? 11 : 7), 0);

export function measureTickWidth(labels: readonly string[]): number {
  if (typeof document === "undefined" || labels.length === 0) {
    return Math.max(0, ...labels.map(estimate)) + AXIS_PAD;
  }
  const span = document.createElement("span");
  span.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0;font-size:${AXIS_TICK_FONT_SIZE};font-weight:400;font-variant-numeric:tabular-nums;`;
  document.body.appendChild(span);
  let max = 0;
  try {
    for (const l of labels) {
      span.textContent = l;
      max = Math.max(max, span.getBoundingClientRect().width);
    }
  } finally {
    span.remove();
  }
  if (max === 0) max = Math.max(0, ...labels.map(estimate));
  return Math.ceil(max) + AXIS_PAD;
}

export function useAxisWidth(labels: readonly string[]): number {
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    let live = true;
    void document.fonts?.ready.then(() => live && setFontTick((n) => n + 1));
    return () => {
      live = false;
    };
  }, []);
  const key = labels.join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key 가 labels 내용을 대신한다
  return useMemo(() => measureTickWidth(labels), [key, fontTick]);
}

/**
 * 눈금을 recharts 자동에 맡기는 차트용 — 값 범위에서 nice 눈금 글자를 뽑아 폭 측정에 넘긴다
 * (자동 눈금은 렌더 전에 알 수 없다). 0 은 늘 포함, 음수가 있으면 음수 눈금도 나온다.
 */
export const niceTickLabels = (
  values: readonly number[],
  format: (v: number) => string,
): string[] =>
  niceAxis(Math.min(0, ...values), Math.max(0, ...values)).ticks.map(format);
