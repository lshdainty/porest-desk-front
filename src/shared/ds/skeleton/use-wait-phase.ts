import * as React from "react";

import { LOADING_TIMING } from "./skeleton-variants";

// 기다린 시간 — 시간표는 skeleton-variants.ts 의 LOADING_TIMING(skeleton.yaml 의 region)

export type WaitPhase = "quiet" | "waiting" | "slow";

// pending 이 이어진 시간 — 0 ~ 1초 quiet · 1초 ~ waiting · 5초 ~ slow. pending 이 아니면 quiet, 다시 pending 이 되면 처음부터 센다.
// 영역을 직접 짤 때 쓴다(LoadingRegion 도 이것으로 센다)
export function useWaitPhase(pending: boolean): WaitPhase {
  const [phase, setPhase] = React.useState<WaitPhase>("quiet");
  const [counting, setCounting] = React.useState(pending);
  // pending 이 바뀐 그 렌더에서 바로 처음으로 — 지난 기다림의 slow 가 한 번이라도 보이지 않게
  if (counting !== pending) {
    setCounting(pending);
    setPhase("quiet");
  }
  React.useEffect(() => {
    if (!pending) return;
    const show = window.setTimeout(
      () => setPhase("waiting"),
      LOADING_TIMING.showAfter,
    );
    const slow = window.setTimeout(
      () => setPhase("slow"),
      LOADING_TIMING.slowAfter,
    );
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(slow);
    };
  }, [pending]);
  return pending ? phase : "quiet";
}
