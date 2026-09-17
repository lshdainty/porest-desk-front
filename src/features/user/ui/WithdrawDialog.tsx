import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { serverErrorMessage } from "@/shared/api/error-message";
import { toLocalDateKey } from "@/shared/lib/date";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter } from "@/shared/ui/porest/modal-footer";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import { useIsMobile } from "@/shared/hooks";
// 배럴(`@/features/user`)이 이 파일을 다시 내보내므로 거기서 가져오면 순환이 된다 —
// ESM 이 버티긴 해도 초기화 순서에 따라 undefined 가 잡힌다. 상대 경로로 간다.
import { WITHDRAW_BLOCK_SUBSCRIPTION } from "../api/userApi";
import {
  useSendReauthEmailCodeMutation,
  useVerifyReauthEmailCodeMutation,
  useVerifyReauthPasswordMutation,
  useWithdrawMutation,
  useWithdrawalCheck,
} from "../model/useWithdrawal";

/**
 * 해지 흐름의 단계.
 *
 * <p>한 다이얼로그 안에서 단계를 넘기는 이유 — 다이얼로그를 갈아 끼우면 뒤로 가기가
 * 끊기고(모바일 뒤로가기 = 닫기), 사용자가 "안내를 읽던 자리" 로 돌아올 수 없다.
 */
type Step = "impact" | "reauth";

/** 본인 확인 방법. 비밀번호가 없는 소셜 전용 계정은 코드 말고 길이 없다. */
type ReauthMethod = "password" | "emailCode";

/** 해지하면 없어지는 것들 — 개수가 0 이면 줄을 아예 안 보여 준다. */
function ImpactList({
  counts,
  t,
}: {
  counts: {
    sharedCalendarsOwned: number;
    calendarMemberships: number;
    dutchPaysOwned: number;
    dutchPayParticipations: number;
  };
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const rows = [
    { key: "impact.calendarsOwned", n: counts.sharedCalendarsOwned },
    { key: "impact.calendarMemberships", n: counts.calendarMemberships },
    { key: "impact.dutchPaysOwned", n: counts.dutchPaysOwned },
    {
      key: "impact.dutchPayParticipations",
      n: counts.dutchPayParticipations,
    },
  ].filter((r) => r.n > 0);

  if (rows.length === 0) return null;

  return (
    <ul className="grid gap-1.5">
      {rows.map((r) => (
        <li
          key={r.key}
          className="flex items-start gap-2 text-sm text-[var(--fg-secondary)]"
        >
          <span
            aria-hidden
            className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--fg-tertiary)]"
          />
          <span>{t(r.key, { count: r.n })}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * desk 이용 해지.
 *
 * <p>세 번 확인한다 — ① 무엇을 잃는지 개수로 보여 주고 ② 본인 확인을 다시 받고
 * ③ 마지막 버튼이 빨갛다. 되돌릴 수 없는 일이라 한 번의 오조작으로 끝나면 안 된다.
 *
 * <p>성공하면 이 세션은 끝난다. `onWithdrawn` 이 로그아웃까지 책임진다 — 여기서
 * 화면을 갱신하려 들면 이미 없는 계정으로 API 를 부르게 된다.
 */
export function WithdrawDialog({
  onClose,
  onWithdrawn,
}: {
  onClose: () => void;
  /** 해지가 끝났다. 부르는 쪽이 로그아웃시키고 안내 화면으로 보낸다. */
  onWithdrawn: () => void;
}) {
  const { t } = useTranslation("user");
  const { t: tc } = useTranslation("common");
  const mobile = useIsMobile();

  const [step, setStep] = useState<Step>("impact");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<ReauthMethod>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const checkQ = useWithdrawalCheck(true);
  const sendCode = useSendReauthEmailCodeMutation();
  const verifyCode = useVerifyReauthEmailCodeMutation();
  const verifyPassword = useVerifyReauthPasswordMutation();
  const withdraw = useWithdrawMutation();

  // 해지가 나가 있는 동안 또 눌려도 아무 일이 없어야 한다 — 두 번 불러도 결과는
  // 같지만(서버가 멱등) 그 사이 두 번째 요청이 이미 쓴 티켓을 들고 가 401 이 뜬다.
  const runningRef = useRef(false);

  const check = checkQ.data;
  const blocked = (check?.blocked?.length ?? 0) > 0;
  const blockedBySubscription =
    check?.blocked?.includes(WITHDRAW_BLOCK_SUBSCRIPTION) ?? false;
  // 서버가 시간대 없이 주는 `[UTC]` — 자르면 KST 에서 하루 이르게 보인다.
  // 구독 다이얼로그·설정 화면과 같은 값이라 같은 방식으로 읽어야 세 화면이
  // 다른 날짜를 말하지 않는다.
  const unblockDate = check?.subscriptionPeriodEnd
    ? (toLocalDateKey(check.subscriptionPeriodEnd) ??
      check.subscriptionPeriodEnd.slice(0, 10))
    : null;

  // 방법을 바꾸면 앞선 오류를 지운다 — 비밀번호가 틀렸다는 빨간 줄이 코드 칸 위에
  // 남아 있으면 무엇이 잘못됐는지 알 수 없다.
  useEffect(() => {
    setReauthError(null);
  }, [method]);

  const reauthPending =
    verifyCode.isPending || verifyPassword.isPending || withdraw.isPending;

  const doWithdraw = async (reauthToken: string) => {
    await withdraw.mutateAsync({
      reauthToken,
      reason: reason.trim() || undefined,
    });
    onWithdrawn();
  };

  const onConfirm = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setReauthError(null);
    try {
      const token =
        method === "password"
          ? await verifyPassword.mutateAsync(password)
          : await verifyCode.mutateAsync(code);
      await doWithdraw(token);
    } catch (e) {
      // 본인 확인 실패는 그 칸의 문제다 — 토스트로 띄우면 어느 칸을 고쳐야 하는지
      // 안 보인다. 칸 밑에 붙인다(PasswordChangeDialog 와 같은 규칙).
      //
      // `e.message` 를 쓰면 안 된다 — axios 가 감싼 "Request failed with status code 400"
      // 이 그대로 나간다. 사용자에게 할 말("인증 코드가 올바르지 않아요")은 응답 본문에
      // 들어 있다.
      setReauthError(serverErrorMessage(e, t("withdraw.failed")));
    } finally {
      runningRef.current = false;
    }
  };

  const onSendCode = () => {
    sendCode.mutate(undefined, {
      onError: (e) => {
        // 확인 실패와 같은 자리에 붙인다 — 한쪽만 토스트로 띄우면 같은 흐름 안에서
        // 오류가 두 가지 방식으로 나타난다.
        setReauthError(serverErrorMessage(e, t("withdraw.failed")));
      },
      onSuccess: () => {
        setCodeSent(true);
        setReauthError(null);
        toast.success(t("withdraw.codeSent"), { id: "withdraw-code-sent" });
      },
    });
  };

  const canConfirm =
    method === "password" ? password.length > 0 : /^\d{6}$/.test(code);

  // ── 본문 ────────────────────────────────────────────────────────────────
  let body;
  if (checkQ.isLoading) {
    body = (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  } else if (checkQ.isError) {
    body = (
      <p className="text-sm text-[var(--fg-secondary)]">{tc("apiError")}</p>
    );
  } else if (blocked) {
    body = (
      <div className="grid gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-[var(--status-warning-fg)]"
            aria-hidden
          />
          <p className="text-sm text-[var(--fg-primary)]">
            {blockedBySubscription
              ? unblockDate
                ? t("withdraw.blockedSubscriptionUntil", { date: unblockDate })
                : t("withdraw.blockedSubscription")
              : t("withdraw.blockedOther")}
          </p>
        </div>
        <p className="text-sm text-[var(--fg-secondary)]">
          {t("withdraw.blockedHint")}
        </p>
      </div>
    );
  } else if (step === "impact") {
    body = (
      <div className="grid gap-4">
        <p className="text-sm text-[var(--fg-primary)]">
          {t("withdraw.intro")}
        </p>
        <ImpactList counts={check!} t={t} />
        {/* 되돌릴 수 없는 것 둘 — 여기서 말하지 않으면 사용자가 알 길이 없다. */}
        <div className="grid gap-1.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] p-3">
          <p className="text-sm font-medium text-[var(--fg-primary)]">
            {t("withdraw.irreversibleTitle")}
          </p>
          <p className="text-sm text-[var(--fg-secondary)]">
            {t("withdraw.irreversibleRejoin")}
          </p>
          <p className="text-sm text-[var(--fg-secondary)]">
            {t("withdraw.irreversibleData")}
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="withdraw-reason">{t("withdraw.reasonLabel")}</Label>
          <Input
            id="withdraw-reason"
            value={reason}
            maxLength={200}
            placeholder={t("withdraw.reasonPlaceholder")}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
    );
  } else {
    body = (
      <div className="grid gap-4">
        <p className="text-sm text-[var(--fg-primary)]">
          {t("withdraw.reauthIntro")}
        </p>
        {method === "password" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="withdraw-password">{t("currentPassword")}</Label>
            <Input
              id="withdraw-password"
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder={t("currentPasswordPlaceholder")}
              onChange={(e) => {
                setPassword(e.target.value);
                setReauthError(null);
              }}
            />
            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}
            <Button
              variant="link"
              size="sm"
              className="justify-self-start px-0"
              onClick={() => setMethod("emailCode")}
            >
              {t("withdraw.useEmailCode")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label htmlFor="withdraw-code">{t("withdraw.codeLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="withdraw-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                placeholder={t("withdraw.codePlaceholder")}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setReauthError(null);
                }}
              />
              <Button
                variant="secondary"
                className="shrink-0"
                loading={sendCode.isPending}
                onClick={onSendCode}
              >
                {codeSent ? t("withdraw.resendCode") : t("withdraw.sendCode")}
              </Button>
            </div>
            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}
            <p className="text-sm text-[var(--fg-secondary)]">
              {t("withdraw.codeHint")}
            </p>
            <Button
              variant="link"
              size="sm"
              className="justify-self-start px-0"
              onClick={() => setMethod("password")}
            >
              {t("withdraw.usePassword")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── footer ──────────────────────────────────────────────────────────────
  let footer;
  if (checkQ.isLoading) {
    footer = undefined;
  } else if (blocked || checkQ.isError) {
    // 막힌 자리에는 진행 버튼을 두지 않는다 — 누를 수 없는 버튼을 보여 주는 것보다
    // 아예 없는 편이 낫다.
    footer = <ModalFooter onSave={onClose} saveLabel={tc("close")} />;
  } else if (step === "impact") {
    footer = (
      <ModalFooter
        onCancel={onClose}
        cancelLabel={tc("cancel")}
        onSave={() => setStep("reauth")}
        saveLabel={t("withdraw.next")}
        saveVariant="destructive"
      />
    );
  } else {
    footer = (
      <ModalFooter
        onCancel={() => setStep("impact")}
        cancelLabel={tc("back")}
        onSave={onConfirm}
        saveLabel={t("withdraw.confirm")}
        saveVariant="destructive"
        saving={reauthPending}
        saveDisabled={!canConfirm}
      />
    );
  }

  return (
    <ModalShell
      title={t("withdraw.title")}
      onClose={onClose}
      mobile={mobile}
      size="sm"
      footer={footer}
    >
      {body}
    </ModalShell>
  );
}
