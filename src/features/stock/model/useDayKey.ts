import { useEffect, useState } from "react";
import { todayKeyIn } from "../lib/prev-close";

/**
 * 그 시간대의 오늘('YYYY-MM-DD') — 탭을 띄워 둔 채 날이 바뀌면 값이 바뀐다.
 * 달력 질의 키에 넣어, 어제 달력으로 오늘 장 상태를 판정하지 않게 한다(검수 M2). 1분마다 · 탭이 다시 보일 때 확인한다.
 */
export function useDayKey(tz: string): string {
  const [key, setKey] = useState(() => todayKeyIn(tz));
  useEffect(() => {
    const check = () => setKey(todayKeyIn(tz));
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [tz]);
  return key;
}
