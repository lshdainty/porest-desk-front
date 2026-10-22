import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { Button, type ButtonProps } from "@/shared/ds/button";
import { Input, type InputProps } from "@/shared/ds/input";

import { digitsOf, remainingOf } from "./input-otp-variants";
import { useDsText } from "@/shared/ds/i18n";

// 숫자 뽑기 · 붙여넣기 · 다시 받기의 규칙은 input-otp-variants.ts 머리 주석과 groo-design specs/components/input-otp.md 가 정한다.

export interface InputOTPProps extends Omit<
  InputProps,
  | "type"
  | "maxLength"
  | "inputMode"
  | "autoComplete"
  | "onChange"
  | "value"
  | "defaultValue"
> {
  /** 숫자 글(제어) */
  value?: string;
  /** 처음 숫자 글(비제어) */
  defaultValue?: string;
  /** 숫자만 · 최대 length 자 — 붙여넣기 · 자동 채우기도 이 값으로 */
  onValueChange?: (value: string) => void;
  /** 자릿수 — 기본 6 */
  length?: number;
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      length = 6,
      placeholder,
      className,
      rootClassName,
      onPaste,
      ...props
    },
    ref,
  ) => {
    const dsT = useDsText();
    const cut = (text: string) => digitsOf(text).slice(0, length);
    const [inner, setInner] = React.useState(() => cut(defaultValue ?? ""));
    const controlled = value !== undefined;
    const current = controlled ? cut(value) : inner;

    const change = (next: string) => {
      if (!controlled) setInner(next);
      if (next !== current) onValueChange?.(next);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        spellCheck={false}
        placeholder={
          placeholder ?? dsT("inputOtp.placeholder", { count: length })
        }
        // 입력의 data-slot(text-input-value)은 Input 그대로 둔다 — 코드 칸 표시는 따로
        data-input-otp=""
        // 막혀도 자리 글은 fg-placeholder — Input 의 막힌 글(fg-disabled)을 덮는다(스펙 disabled.placeholder, 사용자 결정 01T-013)
        className={cn("disabled:placeholder:text-fg-placeholder", className)}
        // 고정폭 숫자는 상자에 건다 — 입력은 상자의 글꼴을 통째로 이어받는다(Input 의 font: inherit)
        rootClassName={cn("tabular-nums", rootClassName)}
        {...props}
        value={current}
        onPaste={(e) => {
          onPaste?.(e);
          if (e.defaultPrevented) return;
          // 받은 코드를 통째로 붙이면 칸의 값을 그 코드로 — 앞에 있던 숫자와 섞이지 않게
          const pasted = digitsOf(e.clipboardData.getData("text"));
          if (pasted.length < length) return;
          e.preventDefault();
          change(pasted.slice(0, length));
        }}
        onChange={(e) => {
          const el = e.currentTarget;
          const raw = el.value;
          const next = cut(raw);
          // 걸러져 글이 바뀌면 칸의 글을 바로 고치고 커서를 그 앞 숫자 뒤에 둔다 — 값이 그대로여서 다시 그리지 않아도 제자리
          if (next !== raw) {
            const at = Math.min(
              next.length,
              digitsOf(raw.slice(0, el.selectionStart ?? raw.length)).length,
            );
            el.value = next;
            el.setSelectionRange(at, at);
          }
          change(next);
        }}
      />
    );
  },
);
InputOTP.displayName = "InputOTP";

export interface InputOTPResendProps extends Omit<
  ButtonProps,
  "onClick" | "children" | "variant" | "size" | "asChild" | "loading" | "layout"
> {
  /** 마지막으로 보낸 때(Date.now() 의 수) — 아직 안 보냈으면 null */
  sentAt: number | null;
  /** 코드를 보낸다 — Promise 를 돌려주면 끝날 때까지 다시 누를 수 없다 */
  onResend: () => unknown;
  /** 다시 받을 수 있을 때까지(초) — 기본 60(서버의 다시 받기 60초) */
  cooldownSeconds?: number;
  /** 보낸 뒤 초점을 옮길 코드 칸의 id */
  codeInputId?: string;
}

const InputOTPResend = React.forwardRef<HTMLButtonElement, InputOTPResendProps>(
  (
    {
      sentAt,
      onResend,
      cooldownSeconds = 60,
      codeInputId,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const dsT = useDsText();
    const [now, setNow] = React.useState(() => Date.now());
    // 1초마다 — 남은 초가 바뀌는 때에 맞춰 다시 잰다. 다 지나면 멈춘다
    React.useEffect(() => {
      if (sentAt == null) return;
      let timer: number | undefined;
      const tick = () => {
        const t = Date.now();
        setNow(t);
        const left = sentAt + cooldownSeconds * 1000 - t;
        if (left > 0) timer = window.setTimeout(tick, left % 1000 || 1000);
      };
      tick();
      return () => window.clearTimeout(timer);
    }, [sentAt, cooldownSeconds]);

    const remaining = remainingOf(sentAt, cooldownSeconds, now);
    const label =
      sentAt == null
        ? dsT("inputOtp.send")
        : remaining > 0
          ? dsT("inputOtp.resendIn", { seconds: remaining })
          : dsT("inputOtp.resend");

    return (
      <Button
        ref={ref}
        type="button"
        variant="neutralWeak"
        size="medium"
        data-slot="input-otp-resend"
        className={cn("tabular-nums", className)}
        disabled={disabled || remaining > 0}
        {...props}
        onClick={() => {
          const result = onResend();
          // 단추가 막히기 전에 초점을 코드 칸으로 — 막힌 단추에서 초점이 본문으로 빠지지 않게
          if (codeInputId) document.getElementById(codeInputId)?.focus();
          return result;
        }}
      >
        {label}
      </Button>
    );
  },
);
InputOTPResend.displayName = "InputOTPResend";

export { InputOTP, InputOTPResend };
