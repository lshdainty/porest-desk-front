import { useCallback, useState } from "react";

/**
 * 항목별 진행 중 표시 — 고정·완료·읽음 같은 토글이 대상이다.
 *
 * 토글은 저장 버튼과 달리 눌러도 아무 표시가 없어서, 통신이 느리면 된 건지 안 된 건지
 * 모른 채 다시 누르게 됐다(사용자 신고). 토글한 항목의 id 를 요청이 끝날 때까지
 * 들고 있으면 그 항목만 스피너를 띄우고 잠글 수 있다. mutation 의 `isPending`/`variables`
 * 는 마지막 하나만 기억해 연달아 다른 항목을 누르면 앞의 것이 사라진다 — 그래서 Set.
 */
export function usePendingIds() {
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const begin = useCallback((id: number) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  const end = useCallback((id: number) => {
    setPendingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  return { pendingIds, begin, end };
}
