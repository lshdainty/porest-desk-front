import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field, FieldLabel } from "@/shared/ui/field";
import { useVerifyPasswordMutation } from "@/features/user";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export function HideAmountsUnlockDialog({
  open,
  onOpenChange,
  onVerified,
}: Props) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verifyMut = useVerifyPasswordMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  // 닫히면 다음에 열 때 지난 입력이 남지 않도록 비운다. 부모가 `onVerified` 로도 닫으므로
  // 닫기 핸들러가 아니라 `open` 이 바뀌는 순간을 본다 — 렌더 중 조정이라 커밋을 한 번
  // 더 태우지 않는다(예전엔 effect 안에서 setState 해 `set-state-in-effect` 를 껐다).
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setPassword("");
      setError(null);
    }
  }

  // 지난 실패 상태를 턴다. 이 컴포넌트의 state 가 아니라 뮤테이션 쪽이라 effect 로 둔다
  // (이미 초기 상태면 no-op 이므로 몇 번 불려도 안전하다).
  const resetVerify = verifyMut.reset;
  useEffect(() => {
    if (!open) resetVerify();
  }, [open, resetVerify]);

  // 열리면 입력에 포커스. 다이얼로그가 자리를 잡은 뒤라야 먹는다.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  const submit = () => {
    if (!password.trim() || verifyMut.isPending) return;
    setError(null);
    verifyMut.mutate(password, {
      onSuccess: () => {
        onVerified();
        onOpenChange(false);
      },
      onError: (e) => {
        setError(e.message || t("hideAmounts.passwordError"));
        setPassword("");
        inputRef.current?.focus();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--fg-brand-strong)]" />
            {t("hideAmounts.unlockTitle")}
          </DialogTitle>
          <DialogClose
            aria-label={tc("close")}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)]"
          >
            ✕
          </DialogClose>
        </DialogHeader>
        <DialogBody>
          <p className="mb-4 text-[13.5px] leading-6 text-[var(--fg-secondary)]">
            {t("hideAmounts.unlockDesc")}
          </p>
          <Field>
            <FieldLabel htmlFor="hide-unlock-pw">
              {t("hideAmounts.password")}
            </FieldLabel>
            <Input
              id="hide-unlock-pw"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("hideAmounts.passwordPlaceholder")}
              aria-invalid={!!error || undefined}
            />
            {error && (
              <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button
            loading={verifyMut.isPending}
            disabled={!password.trim()}
            onClick={submit}
          >
            {tc("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
