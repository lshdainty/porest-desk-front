/**
 * 화면에 들어온 묶음 찾기 — 관심 그룹마다 보이는지 본다(I-13 22).
 *
 * 위아래 200px 안에 들어와 300ms 머문 묶음만 보인 것으로 친다(지나가는 스크롤에 시세를 부르지 않는다).
 * 나갔다 들어오면 다시 머문다. IntersectionObserver 가 없는 환경(시험)은 모두 보이는 것으로 본다.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const MARGIN = "200px 0px";
const DWELL_MS = 300;

export function useVisibleIds() {
  const [visible, setVisible] = useState<ReadonlySet<number>>(new Set());
  const nodes = useRef(new Map<number, Element>());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const observer = useRef<IntersectionObserver | null>(null);
  const noObserver = typeof IntersectionObserver === "undefined";

  const mark = useCallback((id: number, on: boolean) => {
    setVisible((prev) => {
      if (prev.has(id) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (noObserver) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = Number((e.target as HTMLElement).dataset.groupId);
          const pending = timers.current.get(id);
          if (pending) {
            clearTimeout(pending);
            timers.current.delete(id);
          }
          if (e.isIntersecting) {
            timers.current.set(
              id,
              setTimeout(() => {
                timers.current.delete(id);
                mark(id, true);
              }, DWELL_MS),
            );
          } else {
            mark(id, false);
          }
        }
      },
      { rootMargin: MARGIN },
    );
    observer.current = obs;
    for (const el of nodes.current.values()) obs.observe(el);
    const pendingTimers = timers.current;
    return () => {
      obs.disconnect();
      observer.current = null;
      for (const t of pendingTimers.values()) clearTimeout(t);
      pendingTimers.clear();
    };
  }, [noObserver, mark]);

  /** 묶음 요소에 단다 — `data-group-id` 도 이 함수가 단다 */
  const track = useCallback(
    (id: number) => (el: HTMLElement | null) => {
      const prev = nodes.current.get(id);
      if (prev && prev !== el) {
        observer.current?.unobserve(prev);
        nodes.current.delete(id);
      }
      if (el) {
        el.dataset.groupId = String(id);
        nodes.current.set(id, el);
        observer.current?.observe(el);
      }
    },
    [],
  );

  return { visibleIds: visible, track, allVisible: noObserver };
}
