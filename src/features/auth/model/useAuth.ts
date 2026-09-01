import { useState, useCallback } from "react";
import { authApi } from "../api/authApi";
import { setAuthenticated, clearAuthenticated } from "@/shared/api";
import { config } from "@/shared/config";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exchangeCode = useCallback(
    async (params: {
      code: string;
      codeVerifier: string;
      redirectUri: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authApi.exchangeCode(params);
        setAuthenticated();
        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Code exchange failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 로그아웃 API 실패해도 클라이언트 상태는 정리
    }
    clearAuthenticated();
    // desk 토큰만 지우면 SSO 의 Refresh 쿠키(7일)가 살아남아, 로그인 페이지의 무음
    // 재인증이 세션을 되살린다 — 로그아웃이 로그아웃이 아니게 된다. SSO 로그아웃
    // 경유지로 최상위 이동해 그 쿠키까지 폐기하고 /login 으로 돌아온다.
    // (XHR 로는 불가 — 쿠키가 SameSite=Strict 이고 SSO CORS 목록에 desk origin 이 없다)
    const back = encodeURIComponent(`${window.location.origin}/login`);
    window.location.href = `${config.ssoUrl}/logout?redirect_uri=${back}`;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { exchangeCode, logout, isLoading, error, clearError };
};
