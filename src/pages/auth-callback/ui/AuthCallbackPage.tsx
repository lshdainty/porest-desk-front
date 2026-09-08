import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import {
  getCodeVerifier,
  getSavedState,
  clearPkce,
} from "@/features/auth/lib/pkce";
import { Spinner } from "@/shared/ui/spinner";
import { takeLoginRedirect } from "@/shared/lib/porest/login-redirect";

export const AuthCallbackPage = () => {
  const { t } = useTranslation("login");
  const navigate = useNavigate();
  const { exchangeCode } = useAuth();
  // StrictMode/재렌더로 effect 가 2번 돌아도 일회용 code 를 단 한 번만 교환하도록 가드
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    const handleCallback = async () => {
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");

      // 신규: OAuth2 Authorization Code + PKCE (?code=&state=)
      if (code) {
        const returnedState = query.get("state");
        const savedState = getSavedState();
        const verifier = getCodeVerifier();
        // verifier 없거나 state(CSRF) 불일치 시 거부
        if (
          !verifier ||
          (savedState && returnedState && savedState !== returnedState)
        ) {
          clearPkce();
          navigate("/login", { replace: true });
          return;
        }
        const redirectUri = `${window.location.origin}/auth/callback`;
        const result = await exchangeCode({
          code,
          codeVerifier: verifier,
          redirectUri,
        });
        clearPkce();
        window.history.replaceState({}, "", window.location.pathname);
        // 밀려나기 전에 보던 자리로 되돌린다(QA #131). 적어 둔 게 없으면 홈이다.
        // 꺼내며 지우므로 다음 로그인이 옛 자리를 물려받지 않는다.
        navigate(result ? (takeLoginRedirect() ?? "/desk") : "/login", {
          replace: true,
        });
        return;
      }

      // code 없음 → 로그인으로
      navigate("/login", { replace: true });
    };

    handleCallback();
  }, [exchangeCode, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{t("authenticating")}</p>
    </div>
  );
};
