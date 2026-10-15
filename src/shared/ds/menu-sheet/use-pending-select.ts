import * as React from "react";

/*
 * 고른 줄의 동작 — 표면(Menu · Menu Sheet)이 다 닫혀 초점이 트리거로 돌아온 뒤 부른다. 확인이 필요한 동작이 그 안에서
 * Alert Dialog 를 열어도 닫히는 표면과 겹치지 않는다. 닫힘을 놓쳐도(표면이 통째로 사라짐) 1초 뒤에는 부른다.
 */
export function usePendingSelect() {
  const pendingRef = React.useRef<{ run?: () => void; id: number } | null>(
    null,
  );
  const idRef = React.useRef(0);
  const flush = (id?: number) => {
    const pending = pendingRef.current;
    if (!pending || (id !== undefined && pending.id !== id)) return;
    pendingRef.current = null;
    pending.run?.();
  };
  const queue = (run?: () => void) => {
    const id = ++idRef.current;
    pendingRef.current = { run, id };
    window.setTimeout(() => flush(id), 1000);
  };
  return { queue, flush };
}
