import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/features/user";
import { syncHideCardsFromServer } from "@/shared/lib/porest/hide-amounts-core";

/**
 * 로그인한 뒤 금액 가리기 설정을 서버와 한 번 맞춘다.
 *
 * <p>인증된 셸(`AppLayout`)에 한 번만 건다 — 화면마다 걸면 라우트를 옮길 때마다 GET 이 나간다.
 *
 * <p>사용자가 바뀌면 다시 맞춘다. 같은 브라우저에서 계정을 갈아탄 경우 남의 설정이
 * 그대로 보이면 안 된다.
 */
export function useHideCardsSync(): void {
  const { data: user } = useCurrentUser();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.userId;
    if (!userId || syncedFor.current === userId) return;
    syncedFor.current = userId;
    void syncHideCardsFromServer(userId);
  }, [user?.userId]);
}
