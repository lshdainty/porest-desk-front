import { useState } from "react";

import { Slider } from "@/shared/ui/slider";

/**
 * 예산 경고 기준 슬라이더 — 끄는 동안 화면이 값을 따라가고, 손을 뗄 때(onValueCommit) 한 번 저장한다.
 * 요청 중에도 막지 않는다(스펙 slider.yaml "손을 뗄 때 한 번 저장 · 요청 중에도 막지 않는다", 사용자 결정 2026-10-09) —
 * 막힘은 불러오는 동안(`disabled`)만이다. 저장이 끝나면(`onSettled`) 끄는 값을 비우고 서버 값을 따른다.
 */
export function ThresholdSlider({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled?: boolean;
  /** 손을 뗄 때 한 번 — 저장이 끝나면 `settled()` 를 부른다 */
  onCommit: (next: number, settled: () => void) => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <Slider
      min={50}
      max={100}
      step={5}
      // 5단위 눈금 점 — 앱 divisions(10) 틱 마커 정합 (10구간 + 1 = 11).
      ticks={11}
      value={[drag ?? value]}
      onValueChange={([v]) => setDrag(v!)}
      onValueCommit={([v]) => onCommit(v!, () => setDrag(null))}
      disabled={disabled}
    />
  );
}
