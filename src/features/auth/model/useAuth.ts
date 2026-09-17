import { useState, useCallback } from "react";
import { authApi } from "../api/authApi";
import { setAuthenticated, clearAuthenticated } from "@/shared/api";
import { config } from "@/shared/config";
import { rememberCurrentPath } from "@/shared/lib/porest/login-redirect";
import { isWithdrawnAccountError } from "../lib/withdrawn-error";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 인가 코드를 desk 토큰으로 바꾼다.
   *
   * <p>실패해도 던지지 않고 **왜 실패했는지**를 담아 돌려준다. 부르는 쪽이 갈 자리를
   * 그것으로 정하기 때문이다 — 해지한 계정(`USER_021`)은 로그인이 아니라 안내 화면이다.
   */
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
        return { ok: true as const, data: response };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Code exchange failed";
        setError(message);
        // 실패 이유를 **돌려준다** — 상태로 두면 같은 턴에 읽지 못한다(setState 는
        // 다음 렌더에 반영되는데, 부르는 쪽은 await 직후에 어디로 갈지 정한다).
        return { ok: false as const, withdrawn: isWithdrawnAccountError(err) };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * @param options.returnTo SSO 로그아웃 뒤 돌아올 자리(기본 `/login`). 해지처럼
   *   **로그인으로 보내면 안 되는** 경우에만 쓴다 — 왜 로그인이 안 되는지 모른 채
   *   비밀번호만 다시 넣어 보게 된다.
   * @param options.remember 보던 자리를 적어 둘지(기본 true). 해지한 사람에게는
   *   돌아갈 자리가 없다.
   */
  const logout = useCallback(
    async (options?: { returnTo?: string; remember?: boolean }) => {
      try {
        await authApi.logout();
      } catch {
        // 로그아웃 API 실패해도 클라이언트 상태는 정리
      }
      clearAuthenticated();
      // 로그아웃도 되돌아갈 자리를 남긴다 — 다시 들어온 사람이 보던 화면으로 간다(QA #131).
      if (options?.remember !== false) rememberCurrentPath();
      // desk 토큰만 지우면 SSO 의 Refresh 쿠키(7일)가 살아남아, 로그인 페이지의 무음
      // 재인증이 세션을 되살린다 — 로그아웃이 로그아웃이 아니게 된다. SSO 로그아웃
      // 경유지로 최상위 이동해 그 쿠키까지 폐기하고 /login 으로 돌아온다.
      // (XHR 로는 불가 — 쿠키가 SameSite=Strict 이고 SSO CORS 목록에 desk origin 이 없다)
      const back = encodeURIComponent(
        `${window.location.origin}${options?.returnTo ?? "/login"}`,
      );
      window.location.href = `${config.ssoUrl}/logout?redirect_uri=${back}`;
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { exchangeCode, logout, isLoading, error, clearError };
};
