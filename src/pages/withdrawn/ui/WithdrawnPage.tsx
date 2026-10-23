import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ds/button";
import { ResultSection } from "@/shared/ds/result-section";

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
    // 셸 밖 화면은 흰 면 하나(bg-layer-default — Q11 11B, I-05 77). 폭 420 상자 안에 Result Section(완료) + Bottom CTA.
    // 폰(768 미만)은 버튼이 화면 바닥 · 좌우 24 · 안전 영역 위, 768 이상은 Result Section 아래 가운데.
    <div
      data-slot="withdrawn-page"
      className="flex min-h-svh flex-col items-center bg-bg-layer-default md:justify-center"
    >
      <div className="flex w-full max-w-[420px] grow flex-col md:grow-0">
        <ResultSection
          kind="done"
          size="large"
          as="h1"
          title={t("withdrawn.title")}
          description={
            <>
              <span className="block">{t("withdrawn.body")}</span>
              <span className="mt-x2 block">{t("withdrawn.rejoin")}</span>
            </>
          }
          className="md:grow-0"
        />
        <div className="flex justify-center px-x6 pb-[calc(var(--spacing-x6)+env(safe-area-inset-bottom))] md:pb-x6">
          <Button
            type="button"
            variant="neutralSolid"
            size="large"
            className="w-full md:w-auto"
            onClick={() => navigate("/login", { replace: true })}
          >
            {t("withdrawn.toLogin")}
          </Button>
        </div>
      </div>
    </div>
  );
};
