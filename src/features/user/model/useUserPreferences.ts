import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_CURRENCY } from "@/shared/lib/porest/currency";
import { userApi, type UserPreferences } from "../api/userApi";

const PREF_KEY = ["user", "preferences"] as const;

export const useUserPreferences = () => {
  return useQuery({
    queryKey: PREF_KEY,
    queryFn: () => userApi.getPreferences(),
    // preferences 는 자주 안 바뀜 — 5분 신선도로 마운트/리마운트마다 재요청되던 폭주를 억제.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateUserPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) =>
      userApi.updatePreferences(data),
    onSuccess: (resp) => {
      qc.setQueryData(PREF_KEY, resp);
    },
  });
};

/**
 * 새 자산·거래가 먼저 골라 둘 통화 (QA #124 · D7).
 *
 * 값이 아직 안 왔을 때는 원화다 — 쿼리가 도는 사이 화면이 빈 통화로 뜨면 select 가
 * 값 없는 상태로 보인다. 이 훅을 쓰는 폼은 **여기서 받은 값을 `useState` 초기값으로
 * 굳히지 마라.** 설정 화면을 안 들른 세션에서는 이 쿼리가 폼보다 늦게 도착해서,
 * 초기값으로 받으면 첫 렌더의 `KRW` 에 그대로 잠긴다. 사용자가 고르기 전까지 이 값을
 * 매 렌더 읽는 쪽(`pick ?? item ?? 기본값`)으로 짜야 늦게 온 값이 반영된다.
 */
export const useDefaultCurrency = (): string => {
  const { data } = useUserPreferences();
  return data?.defaultCurrency ?? DEFAULT_CURRENCY;
};
