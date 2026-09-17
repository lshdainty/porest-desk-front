import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/button";

/**
 * 해지 안내 화면.
 *
 * <p><b>로그인 없이 열린다.</b> 두 자리에서 온다 — ① 방금 해지한 사람이 SSO 로그아웃을
 * 거쳐 돌아오는 자리 ② 해지한 계정으로 다시 로그인을 시도해 {@code USER_021} 을 맞은
 * 자리. 같은 화면인 이유는 두 사람이 알아야 할 것이 같기 때문이다 — 끝났고, 같은
 * 아이디로는 다시 못 들어온다.
 *
 * <p>여기서 로그인 화면으로 곧장 떨어뜨리지 않는 것은 그러면 <b>아무 설명이 없기</b>
 * 때문이다. 로그인이 안 되는 이유를 모른 채 비밀번호만 다시 넣어 보게 된다.
 */
export const WithdrawnPage = () => {
  const { t } = useTranslation("user");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="grid w-full max-w-[420px] justify-items-center gap-5 text-center">
        <CheckCircle2
          size={40}
          className="text-[var(--status-success-fg)]"
          aria-hidden
        />
        <h1 className="text-title-md text-[var(--fg-primary)]">
          {t("withdrawn.title")}
        </h1>
        <div className="grid gap-2">
          <p className="text-sm text-[var(--fg-secondary)]">
            {t("withdrawn.body")}
          </p>
          <p className="text-sm text-[var(--fg-secondary)]">
            {t("withdrawn.rejoin")}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate("/login", { replace: true })}
        >
          {t("withdrawn.toLogin")}
        </Button>
      </div>
    </div>
  );
};
