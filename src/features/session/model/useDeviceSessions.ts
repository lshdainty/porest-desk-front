import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "../api/sessionApi";
import type { DeviceSession } from "../api/sessionApi";

export const deviceSessionKeys = {
  all: ["deviceSessions"] as const,
};

export const useDeviceSessions = () =>
  useQuery<DeviceSession[]>({
    queryKey: deviceSessionKeys.all,
    queryFn: () => sessionApi.list(),
    // 다른 기기에서 로그인·로그아웃하면 목록이 바뀐다. 오래 들고 있을 이유가 없다.
    staleTime: 0,
  });

export const useRevokeDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (sessionId: string) => sessionApi.revoke(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceSessionKeys.all });
    },
  });
};

export const useRevokeAllDevicesMutation = () =>
  useMutation<void, Error, void>({
    // 전부 끊으면 이 브라우저도 끊긴다 — 목록을 다시 부를 이유가 없다(호출부가 로그아웃한다).
    mutationFn: () => sessionApi.revokeAll(),
  });
