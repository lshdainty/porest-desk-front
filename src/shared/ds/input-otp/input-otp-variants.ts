/*
 * Groo Input OTP — 메일 · 문자로 받은 일회용 인증 코드(지금은 숫자 6자리)를 넣는 칸(2026-10-09). 수치 원본은 groo-design specs/components/input-otp.yaml(값은 src/shared/ds/spec/input-otp.json),
 * 칸의 상자 · 글자 · 상태는 input.yaml(Input), 라벨 · 설명 · 오류는 field.yaml(Field)이 원본이다.
 * SEED 에는 이 컴포넌트가 없다 — Text Input 의 "Input을 나누지 말고 … 한 번에 입력" 을 따라 칸을 자릿수만큼 나누지 않는다(사용자 결정 10A).
 * 옛 Input OTP(칸 6 × 40 · 숨은 입력 하나 — input-otp 라이브러리)를 대신한다.
 * groo-design recipes/shadcn/components/ui/input-otp.tsx 를 첫 판으로 가져왔다 — 이 파일은 숫자 뽑기 · 남은 초 셈, 컴포넌트는 input-otp.tsx 다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로고침).
 *
 *   InputOTP         코드 칸 — Input 상자형 한 칸. Input 의 속성(size · disabled · id · placeholder …)에 value · defaultValue(숫자 글) ·
 *                    onValueChange(value — 숫자만 · 최대 length 자) · length(기본 6)를 받는다. inputMode="numeric" ·
 *                    autoComplete="one-time-code" · placeholder("{length}자리 숫자") · 고정폭 숫자를 스스로 건다 — type · maxLength ·
 *                    inputMode · autoComplete · onChange 는 받지 않는다. Field 안이면 라벨 · 설명 · 오류 · 막힘을 Input 처럼 받는다
 *   InputOTPResend   다시 받기 — Button neutralWeak medium(40), 칸 아래 왼쪽(Field 꼬리 ↔ 단추 12 는 className="mt-x3").
 *                    sentAt(마지막으로 보낸 때 — Date.now() 의 수, 아직 안 보냈으면 null) · onResend() · cooldownSeconds(기본 60) ·
 *                    codeInputId(보낸 뒤 초점을 옮길 코드 칸의 id) · className. null 이면 "코드 받기", 보낸 뒤 cooldownSeconds 안이면
 *                    "다시 받기({n}초)" + 막힘, 지나면 "다시 받기" — 남은 초는 단추가 1초마다 스스로 센다
 *
 * 숫자만: 치기 · 붙여넣기 · 자동 채우기 모두 글에서 숫자만 뽑아 앞 length 자리를 쓴다("123 456" · "123-456" · "인증 코드: 123456" →
 *   123456, 전각 숫자는 반각으로). maxLength 를 걸지 않는다 — 브라우저가 먼저 잘라 붙인 글의 숫자를 잃는다. 숫자를 length 자리 이상 담은 글을
 *   붙여 넣으면 칸의 값을 그 숫자로 바꾼다(칸에 이미 숫자가 있어도 — 받은 코드 하나를 통째로 넣는 자리다). 걸러져 글이 바뀌면 커서는 그 앞 숫자
 *   뒤에 둔다. 6자리를 채워도 아무것도 보내지 않는다(확인 단추를 누른다).
 * 다시 받기: 누르면 onResend 를 부르고 초점을 코드 칸으로 옮긴다 — 단추가 막히며 초점이 본문으로 빠지지 않게. onResend 가 Promise 를
 *   돌려주면 끝날 때까지 다시 누를 수 없다(Button). 남은 초는 단추 이름에 들어 있어 초점이 오면 읽힌다 — 1초마다 알리지 않는다.
 *   막힘은 Button 의 전용 색(bg-disabled · fg-disabled) — 흐리게 하지 않는다.
 */

// 글에서 숫자만 — 전각 숫자(０-９)는 반각으로 바꿔 센다
export const digitsOf = (text: string) =>
  text.normalize("NFKC").replace(/\D/g, "");

// 남은 초 — 보낸 때부터 cooldown 안이면 올림한 초(cooldown 을 넘지 않는다), 아니면 0
export const remainingOf = (
  sentAt: number | null,
  cooldown: number,
  now: number,
) =>
  sentAt == null
    ? 0
    : Math.min(
        cooldown,
        Math.max(0, Math.ceil((sentAt + cooldown * 1000 - now) / 1000)),
      );
