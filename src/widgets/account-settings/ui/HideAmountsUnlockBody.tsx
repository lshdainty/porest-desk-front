import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";
import type { useHideAmountsUnlock } from "./use-hide-amounts-unlock";

/**
 * 금액 보기 인증의 본문 부품(I-14 43 · I-17 21) — 설명 + 비밀번호 칸(밑줄 · 자동 완성 current-password · Enter 로 제출).
 * 시트 · 대화상자 안의 한 단계로 쓴다(바닥 버튼은 쓰는 쪽이 놓고 `submit` 을 부른다). 틀리면 비운 칸에 다시 초점이 간다.
 */
export function HideAmountsUnlockFields({
  unlock,
}: {
  unlock: ReturnType<typeof useHideAmountsUnlock>;
}) {
  const { t } = useTranslation("settings");
  const inputRef = useRef<HTMLInputElement>(null);
  const { error } = unlock;
  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);
  return (
    <div className="flex flex-col gap-x4 pb-x2">
      <p className="m-0 font-sans text-t5 text-fg-neutral-muted">
        {t("hideAmounts.unlockDesc")}
      </p>
      <Field
        label={t("hideAmounts.password")}
        invalid={unlock.error != null}
        errorMessage={unlock.error}
      >
        <Input
          ref={inputRef}
          variant="underline"
          type="password"
          autoComplete="current-password"
          value={unlock.password}
          placeholder={t("hideAmounts.passwordPlaceholder")}
          onChange={(e) => {
            unlock.setPassword(e.target.value);
            if (unlock.error) unlock.clearError();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              unlock.submit();
            }
          }}
        />
      </Field>
    </div>
  );
}
