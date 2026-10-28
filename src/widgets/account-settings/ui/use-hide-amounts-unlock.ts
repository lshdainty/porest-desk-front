import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useVerifyPasswordMutation } from "@/features/user";

/**
 * 금액 보기 인증의 상태 훅(I-14 43 · I-17 21 — 본문은 HideAmountsUnlockFields) — 설명 + 비밀번호 칸(밑줄 · 자동 완성 current-password · Enter 로 제출).
 * 시트 · 대화상자 안의 한 단계로 쓴다(바닥 버튼은 쓰는 쪽이 놓고 `submit` 을 부른다). 틀린 비밀번호는 칸 아래 오류
 * ("비밀번호가 일치하지 않아요." — 서버 오류 코드 USER_004), 그 밖의 실패는 다시 시도를 부탁한다(서버 글을 내지 않는다).
 */
export function useHideAmountsUnlock({
  onVerified,
}: {
  onVerified: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verifyMut = useVerifyPasswordMutation();
  const { t } = useTranslation("settings");

  const submit = () => {
    if (!password.trim() || verifyMut.isPending) return;
    setError(null);
    verifyMut.mutate(password, {
      onSuccess: () => onVerified(),
      onError: (e) => {
        const code = (e as { response?: { data?: { code?: string } } }).response
          ?.data?.code;
        setError(
          code === "USER_004"
            ? t("hideAmounts.passwordError")
            : t("hideAmounts.verifyFailed"),
        );
        setPassword("");
      },
    });
  };
  return {
    password,
    setPassword,
    error,
    clearError: () => setError(null),
    pending: verifyMut.isPending,
    canSubmit: password.trim().length > 0,
    submit,
  };
}
