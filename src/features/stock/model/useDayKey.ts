import { useEffect, useMemo, useState } from "react";
import { todayKeyIn } from "../lib/prev-close";

/**
 * 그 시간대의 오늘('YYYY-MM-DD') — 탭을 띄워 둔 채 날이 바뀌면 값이 바뀐다.
 * 달력 질의 키에 넣어, 어제 달력으로 오늘 장 상태를 판정하지 않게 한다(검수 M2). 1분마다 · 탭이 다시 보일 때 다시 읽는다.
 *
 * **시간대가 바뀌면 타이머를 기다리지 않고 그 렌더에서 바로 다시 계산한다.** 예전엔 값을 상태로 들고 있어 처음 시간대(통화를 알기 전의
 * 한국)로 굳었고, 통화가 USD 로 정해져 시간대가 뉴욕으로 바뀌어도 다음 타이머까지 한국 날짜가 남았다 — 한국 날짜가 뉴욕보다 앞선
 * 시각에 미국 "오늘 시세" 띠가 약 60초 안 보였다. 값은 `[tz, tick]` 으로만 다시 계산한다(같은 시간대에서는 타이머 전에 다시 읽지 않는다).
 */
export function useDayKey(tz: string): string {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const id = window.setInterval(bump, 60_000);
    document.addEventListener("visibilitychange", bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
    };
  }, [tz]);
  // tick 은 값이 아니라 "다시 읽어라" 신호다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => todayKeyIn(tz), [tz, tick]);
}
