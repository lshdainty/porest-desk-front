import { useEffect, useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { InputOTP, InputOTPResend } from "./input-otp";

const SIZES = ["large", "medium"] as const;
// 검사기가 탭해서 재는 상태(focused)와, 그대로 그리는 상태
const STATES = ["enabled", "focused", "invalid", "disabled"] as const;
const RESENDS = ["first", "ready", "cooldown"] as const;
type Size = (typeof SIZES)[number];
type State = (typeof STATES)[number];
type Resend = (typeof RESENDS)[number];

const DESCRIPTION = "10분 안에 입력해주세요 · 5번 틀리면 다시 받아요.";
const ERROR = "코드가 맞지 않거나 시간이 지났어요. 확인하거나 다시 받아주세요.";

// 검사기는 견본의 첫 요소(틀)에 초점을 준다 — 틀은 초점을 받지 않으므로 코드 칸으로 넘긴다(input 데모와 같은 방법)
function passFocus(frame: HTMLDivElement | null) {
  if (!frame) return;
  frame.tabIndex = -1;
  frame.onfocus = () =>
    frame
      .querySelector<HTMLInputElement>("[data-input-otp]")
      ?.focus({ preventScroll: true });
}

// 다시 받기 — 보낸 때가 "8초 전" 으로 이어지게 50초마다 다시 보낸 것으로 친다(카탈로그를 오래 켜 둬도 남은 초가 보인다)
const useSentAt = (resend: Resend) => {
  const [sentAt, setSentAt] = useState<number | null>(() =>
    resend === "first"
      ? null
      : Date.now() - (resend === "ready" ? 120_000 : 8_000),
  );
  useEffect(() => {
    if (resend !== "cooldown") return;
    const timer = window.setInterval(
      () => setSentAt(Date.now() - 8_000),
      50_000,
    );
    return () => window.clearInterval(timer);
  }, [resend]);
  return [sentAt, setSentAt] as const;
};

const Sample = ({
  size,
  state = "enabled",
  resend = "ready",
}: {
  size: Size;
  state?: State;
  resend?: Resend;
}) => {
  const [sentAt, setSentAt] = useSentAt(resend);
  const id = `otp-${size}-${state}-${resend}`;
  return (
    <Specimen spec="input-otp" combo={{ size, resend }} state={state}>
      <div
        ref={state === "focused" ? passFocus : undefined}
        className="flex w-[280px] flex-col"
      >
        <Field
          label="인증 코드"
          description={DESCRIPTION}
          invalid={state === "invalid"}
          errorMessage={ERROR}
          disabled={state === "disabled"}
        >
          <InputOTP id={id} size={size} defaultValue="123456" />
        </Field>
        <InputOTPResend
          className="mt-x3 self-start"
          sentAt={sentAt}
          codeInputId={id}
          onResend={() => setSentAt(Date.now())}
        />
      </div>
    </Specimen>
  );
};

// 본인 확인 흐름 — 붙여넣기 · 다시 받기 · 확인(저절로 보내지 않는다)
const FlowExample = () => {
  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex w-[320px] flex-col">
      <Field
        label="인증 코드"
        description={DESCRIPTION}
        invalid={error !== null}
        errorMessage={error}
      >
        <InputOTP
          id="otp-flow"
          value={code}
          onValueChange={(value) => {
            setCode(value);
            setError(null);
          }}
        />
      </Field>
      <InputOTPResend
        className="mt-x3 self-start"
        sentAt={sentAt}
        codeInputId="otp-flow"
        onResend={() => setSentAt(Date.now())}
      />
      <button
        type="button"
        className="mt-x3 self-start text-t3 text-fg-neutral-subtle underline"
        onClick={() =>
          setError(code.length < 6 ? "인증 코드 6자리를 입력해주세요." : ERROR)
        }
      >
        확인(데모)
      </button>
    </div>
  );
};

/** 카탈로그(/dev/ds) — 크기 × 상태(칸 · 설명 줄 · 다시 받기), 다시 받기의 때(처음 · 다시 받기 · 남은 초), 붙여넣기 흐름 */
export const InputOtpDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 상태 — 칸은 Input 한 칸이다(자릿수만큼 나누지 않는다). 포커스는 직접 눌러 본다">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {STATES.map((state) => (
            <Sample key={state} size={size} state={state} />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="다시 받기의 때 — 코드 받기 · 다시 받기 · 다시 받기(52초, 막힘)">
      <DemoRow label="large">
        {RESENDS.map((resend) => (
          <Sample key={resend} size="large" resend={resend} />
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title='붙여넣기 · 다시 받기 — "123 456" · "인증 코드: 123456" 를 붙여 본다'>
      <DemoRow label="흐름">
        <FlowExample />
      </DemoRow>
    </DemoBlock>
  </div>
);
