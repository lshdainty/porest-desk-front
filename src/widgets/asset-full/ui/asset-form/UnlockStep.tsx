import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ds/button";
import {
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/shared/ds/dialog";
import { useWideSurface } from "@/shared/ds/overlay";
import { HideAmountsUnlockFields } from "@/widgets/account-settings/ui/HideAmountsUnlockBody";
import { useHideAmountsUnlock } from "@/widgets/account-settings/ui/use-hide-amounts-unlock";
import { focusFirstField } from "./focus";

/**
 * 숨김을 푸는 저장의 "금액 보기 인증" 단계(I-17 21 · I-14 6-A) — 같은 시트 · 대화상자의 본문이 바뀐다(위에 따로 띄우지 않는다).
 * 머리 ←(= 바닥 [취소])는 저장하지 않고 2단계로 돌아간다(체크는 끈 채). 맞으면 2단계로 돌아가 저장을 이어 간다.
 */
export function UnlockStep({
  onBack,
  onVerified,
}: {
  onBack: () => void;
  onVerified: () => void;
}) {
  const { t } = useTranslation("settings");
  const wide = useWideSurface();
  const unlock = useHideAmountsUnlock({ onVerified });
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    focusFirstField(bodyRef.current);
  }, []);
  return (
    <>
      <ResponsiveDialogBody ref={bodyRef}>
        <HideAmountsUnlockFields unlock={unlock} />
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <div
          className={
            wide ? "ml-auto flex items-center gap-x2" : "flex min-w-0 flex-1"
          }
        >
          {wide && (
            <Button variant="neutralWeak" size="small" onClick={onBack}>
              {t("hideAmounts.cancel")}
            </Button>
          )}
          <Button
            size={wide ? "small" : "large"}
            className={wide ? undefined : "flex-1"}
            loading={unlock.pending}
            onClick={unlock.submit}
          >
            {t("hideAmounts.viewAmounts")}
          </Button>
        </div>
      </ResponsiveDialogFooter>
    </>
  );
}
