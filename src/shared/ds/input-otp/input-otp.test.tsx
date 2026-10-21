// Input OTP 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field, setNativeValue } from "@/shared/ds/field";

import { InputOTP, InputOTPResend } from "./input-otp";
import { digitsOf, remainingOf } from "./input-otp-variants";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

const input = () => container.querySelector<HTMLInputElement>("input")!;
const button = () => container.querySelector<HTMLButtonElement>("button")!;

function type(text: string) {
  act(() => {
    input().focus();
    setNativeValue(input(), text);
  });
}

function paste(text: string) {
  const e = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(e, "clipboardData", {
    value: { getData: () => text },
  });
  act(() => {
    input().dispatchEvent(e);
  });
  return e;
}

describe("digitsOf", () => {
  it("숫자만 뽑고 전각 숫자는 반각으로 센다", () => {
    expect(digitsOf("123 456")).toBe("123456");
    expect(digitsOf("123-456")).toBe("123456");
    expect(digitsOf("인증 코드: 123456")).toBe("123456");
    expect(digitsOf("１２３４５６")).toBe("123456");
    expect(digitsOf("가나다")).toBe("");
  });
});

describe("InputOTP", () => {
  it("막혀도 자리 글은 fg-placeholder — Input 의 막힌 글(fg-disabled)을 덮는다(01T-013)", () => {
    render(<InputOTP aria-label="인증 코드" disabled />);
    expect(input().disabled).toBe(true);
    // 막힌 입력의 ::placeholder 는 jsdom 이 못 읽는다 — 클래스로 본다(computed 값은 i02-measure 가 크로미움에서 잰다)
    expect(input().className).toContain("placeholder:text-fg-disabled");
    expect(input().className).toContain(
      "disabled:placeholder:text-fg-placeholder",
    );
  });

  it("한 칸이다 — 숫자 키보드 · one-time-code · 안내 글 · maxLength 없음", () => {
    render(<InputOTP aria-label="인증 코드" />);
    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(input().type).toBe("text");
    expect(input().inputMode).toBe("numeric");
    expect(input().getAttribute("autocomplete")).toBe("one-time-code");
    expect(input().placeholder).toBe("6자리 숫자");
    expect(input().hasAttribute("maxlength")).toBe(false);
    // 고정폭 숫자는 상자에 건다
    expect(input().closest("[data-slot=text-input]")!.className).toContain(
      "tabular-nums",
    );
  });

  it("치면 숫자만 남고 6자리에서 멈춘다 — 알리는 값도 그 값", () => {
    const onValueChange = vi.fn();
    render(<InputOTP aria-label="코드" onValueChange={onValueChange} />);
    type("12a3 4567890");
    expect(input().value).toBe("123456");
    expect(onValueChange).toHaveBeenLastCalledWith("123456");
    type("");
    expect(input().value).toBe("");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("6자리를 채워도 아무것도 보내지 않는다 — 값 알림만", () => {
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <InputOTP aria-label="코드" />
      </form>,
    );
    type("123456");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("붙여넣기 — 숫자를 6자리 이상 담은 글은 칸의 값을 그 코드로 바꾼다", () => {
    const onValueChange = vi.fn();
    render(
      <InputOTP
        aria-label="코드"
        defaultValue="12"
        onValueChange={onValueChange}
      />,
    );
    const e = paste("인증 코드: 654321");
    expect(e.defaultPrevented).toBe(true);
    expect(input().value).toBe("654321");
    expect(onValueChange).toHaveBeenLastCalledWith("654321");
    paste("123 456 789");
    expect(input().value).toBe("123456");
  });

  it("붙여넣기 — 6자리보다 짧으면 막지 않는다(브라우저가 커서 자리에 넣고 onChange 가 숫자만 남긴다)", () => {
    render(<InputOTP aria-label="코드" />);
    const e = paste("12-3");
    expect(e.defaultPrevented).toBe(false);
    type("12-3");
    expect(input().value).toBe("123");
  });

  it("값을 밖에서 쥐면 바뀐 값을 넣어야 바뀐다 — 넘치는 값은 6자리로 자른다", () => {
    const Controlled = () => {
      const [v, setV] = useState("1234567");
      return <InputOTP aria-label="코드" value={v} onValueChange={setV} />;
    };
    render(<Controlled />);
    expect(input().value).toBe("123456");
    type("12345");
    expect(input().value).toBe("12345");
  });

  it("length 를 바꾸면 그 자리수 · placeholder", () => {
    render(<InputOTP aria-label="코드" length={4} />);
    expect(input().placeholder).toBe("4자리 숫자");
    type("98765");
    expect(input().value).toBe("9876");
  });

  it("값이 그대로면 알리지 않는다", () => {
    const onValueChange = vi.fn();
    render(
      <InputOTP
        aria-label="코드"
        defaultValue="123456"
        onValueChange={onValueChange}
      />,
    );
    paste("123456");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Field 안이면 라벨이 이름 · 설명 · 오류가 설명 · 막힘을 받는다", () => {
    render(
      <Field
        label="인증 코드"
        description="10분 안에 입력해주세요 · 5번 틀리면 다시 받아요."
      >
        <InputOTP />
      </Field>,
    );
    expect(input().labels?.[0]?.textContent).toContain("인증 코드");
    const describedBy = input().getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toContain(
      "10분 안에",
    );
    act(() =>
      root.render(
        <Field
          label="인증 코드"
          invalid
          errorMessage="코드가 맞지 않아요."
          disabled
        >
          <InputOTP />
        </Field>,
      ),
    );
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().disabled).toBe(true);
  });
});

describe("remainingOf", () => {
  it("보낸 때부터 cooldown 안이면 올림한 초, 넘으면 0, 안 보냈으면 0", () => {
    expect(remainingOf(null, 60, 1000)).toBe(0);
    expect(remainingOf(0, 60, 0)).toBe(60);
    expect(remainingOf(0, 60, 8_000)).toBe(52);
    expect(remainingOf(0, 60, 8_001)).toBe(52);
    expect(remainingOf(0, 60, 59_999)).toBe(1);
    expect(remainingOf(0, 60, 60_000)).toBe(0);
    expect(remainingOf(0, 60, 90_000)).toBe(0);
    // 시계가 보낸 때보다 앞서도 cooldown 을 넘지 않는다
    expect(remainingOf(10_000, 60, 0)).toBe(60);
  });
});

describe("InputOTPResend", () => {
  it('보내기 전에는 "코드 받기" — 눌린다', () => {
    const onResend = vi.fn();
    render(<InputOTPResend sentAt={null} onResend={onResend} />);
    expect(button().textContent).toBe("코드 받기");
    expect(button().disabled).toBe(false);
    act(() => button().click());
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it('보낸 뒤 60초 동안은 남은 초를 붙여 막고, 1초마다 줄어 0 이 되면 "다시 받기" 로 풀린다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
    render(<InputOTPResend sentAt={92_000} onResend={() => undefined} />);
    expect(button().textContent).toBe("다시 받기(52초)");
    expect(button().disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(button().textContent).toBe("다시 받기(51초)");
    act(() => {
      vi.advanceTimersByTime(51_000);
    });
    expect(button().textContent).toBe("다시 받기");
    expect(button().disabled).toBe(false);
  });

  it("cooldownSeconds 를 바꾸면 그 초만큼 막는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    render(
      <InputOTPResend
        sentAt={0}
        cooldownSeconds={30}
        onResend={() => undefined}
      />,
    );
    expect(button().textContent).toBe("다시 받기(30초)");
  });

  it("이미 지난 때면 처음부터 풀려 있다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(500_000);
    render(<InputOTPResend sentAt={100_000} onResend={() => undefined} />);
    expect(button().textContent).toBe("다시 받기");
    expect(button().disabled).toBe(false);
  });

  it("누르면 코드 칸으로 초점을 옮긴다 — 막히는 단추에 초점이 남지 않게", () => {
    render(
      <>
        <InputOTP id="code" aria-label="코드" />
        <InputOTPResend
          sentAt={null}
          codeInputId="code"
          onResend={() => undefined}
        />
      </>,
    );
    act(() => button().focus());
    act(() => button().click());
    expect(document.activeElement).toBe(input());
  });

  it("onResend 가 Promise 면 끝날 때까지 다시 눌러도 한 번만", async () => {
    let finish: () => void = () => undefined;
    const onResend = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    render(<InputOTPResend sentAt={null} onResend={onResend} />);
    act(() => button().click());
    act(() => button().click());
    expect(onResend).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
    });
    act(() => button().click());
    expect(onResend).toHaveBeenCalledTimes(2);
  });

  it("neutralWeak · 40 · 고정폭 숫자 — Button medium", () => {
    render(<InputOTPResend sentAt={null} onResend={() => undefined} />);
    expect(button().type).toBe("button");
    expect(button().dataset.slot).toBe("input-otp-resend");
    expect(button().className).toContain("tabular-nums");
  });
});
