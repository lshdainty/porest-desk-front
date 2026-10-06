import { CreditCard, Search } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { Input, type InputProps } from "./input";

const VARIANTS = ["outline", "underline"] as const;
// 크기는 정해 둔다 — 카탈로그는 1440 폭이라 responsive(기본)는 medium 으로만 그려진다(반응형은 맨 아래 Field 안에서)
const SIZES = ["large", "medium"] as const;
// 검사기가 탭해서 재는 상태(focused)와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "focused",
  "invalid",
  "disabled",
  "readonly",
] as const;
type State = (typeof STATES)[number];
type Combo = {
  variant: (typeof VARIANTS)[number];
  size: (typeof SIZES)[number];
};
const COMBOS: Combo[] = VARIANTS.flatMap((variant) =>
  SIZES.map((size) => ({ variant, size })),
);

// 검사기는 견본의 첫 요소(상자)에 초점을 준다 — 상자는 초점을 받지 않으므로 입력으로 넘긴다(wheel-picker 데모와 같은 방법).
// Input 은 상자에 className 말고는 받지 않아 입력의 ref 로 상자를 찾는다. 포커스 테두리는 마우스로 눌러도 보인다(직접 눌러 본다)
function passFocus(input: HTMLInputElement | null) {
  const box = input?.parentElement;
  if (!input || !box) return;
  box.tabIndex = -1;
  box.onfocus = () => input.focus({ preventScroll: true });
}

/** 견본 하나 — 모양 · 크기 · 상태를 Input 에 그대로 준다. 오류는 aria-invalid(Field 안이면 Field 의 invalid). 아래에 이름표 */
const Sample = ({
  variant,
  size,
  state = "enabled",
  caption,
  ...props
}: Combo & { state?: State; caption: string } & Omit<
    InputProps,
    "variant" | "size"
  >) => (
  <div className="flex w-[200px] flex-col gap-x1">
    <Specimen spec="input" combo={{ variant, size }} state={state}>
      <Input
        ref={state === "focused" ? passFocus : undefined}
        variant={variant}
        size={size}
        aria-invalid={state === "invalid" || undefined}
        disabled={state === "disabled"}
        readOnly={state === "readonly"}
        {...props}
      />
    </Specimen>
    <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
  </div>
);

const comboLabel = ({ variant, size }: Combo) => `${variant} · ${size}`;

/** 카탈로그(/dev/ds) — 모양 × 크기 × 상태, 빈 칸(placeholder), 앞 · 뒤 붙이개, 지우기, Field 안 · 반응형 */
export const InputDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="모양 × 크기 × 상태 — 테두리는 안쪽 1px, 포커스 · 오류는 안쪽 2px 를 덧그린다(내용이 밀리지 않는다). 포커스는 직접 눌러 본다">
      {COMBOS.map((combo) => (
        <DemoRow key={comboLabel(combo)} label={comboLabel(combo)}>
          {STATES.map((state) => (
            <Sample
              key={state}
              {...combo}
              state={state}
              caption={state}
              aria-label={`내용 ${state}`}
              defaultValue="점심 식사"
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="빈 칸 — placeholder 는 예시만(칸 이름 대신 쓰지 않는다). 비활성은 fg-disabled, 밑줄 읽기 전용은 fg-neutral-muted">
      {COMBOS.map((combo) => (
        <DemoRow key={comboLabel(combo)} label={comboLabel(combo)}>
          {(["enabled", "disabled", "readonly"] as const).map((state) => (
            <Sample
              key={state}
              {...combo}
              state={state}
              caption={state}
              aria-label={`가맹점 ${state}`}
              placeholder="예: 포레 식당"
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="붙이개 — 글자는 칸 글자와 같은 크기의 fg-neutral-subtle, 아이콘은 fg-neutral-muted. 단위 글자는 칸의 설명으로도 읽힌다">
      {COMBOS.map((combo) => (
        <DemoRow key={comboLabel(combo)} label={comboLabel(combo)}>
          <Sample
            {...combo}
            caption="앞 아이콘 · 지우기"
            aria-label="메모 검색"
            prefixIcon={<Search />}
            defaultValue="회의록"
            clearable
          />
          <Sample
            {...combo}
            caption="뒤 글자(단위)"
            aria-label="금액"
            inputMode="numeric"
            defaultValue="12,000"
            suffix="원"
          />
          <Sample
            {...combo}
            caption="앞 글자"
            aria-label="주소"
            prefix="https://"
            defaultValue="porest.app"
          />
          <Sample
            {...combo}
            caption="앞 · 뒤 글자"
            aria-label="나이"
            inputMode="numeric"
            prefix="만"
            defaultValue="20"
            suffix="세"
          />
          <Sample
            {...combo}
            caption="뒤 아이콘"
            aria-label="카드 번호"
            inputMode="numeric"
            defaultValue="1234-5678"
            suffixIcon={<CreditCard />}
          />
          <Sample
            {...combo}
            state="disabled"
            caption="disabled · 앞 아이콘"
            aria-label="메모 검색 비활성"
            prefixIcon={<Search />}
            defaultValue="회의록"
          />
          <Sample
            {...combo}
            state="disabled"
            caption="disabled · 앞 · 뒤 글자"
            aria-label="나이 비활성"
            inputMode="numeric"
            prefix="만"
            defaultValue="20"
            suffix="세"
          />
          <Sample
            {...combo}
            state="disabled"
            caption="disabled · 뒤 아이콘"
            aria-label="카드 번호 비활성"
            inputMode="numeric"
            defaultValue="1234-5678"
            suffixIcon={<CreditCard />}
          />
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="지우기 — 값이 있을 때만(막혔거나 읽기 전용이면 없다). 누르면 값을 비우고 입력에 포커스를 둔다 — 직접 지워 본다">
      {COMBOS.map((combo) => (
        <DemoRow key={comboLabel(combo)} label={comboLabel(combo)}>
          <Sample
            {...combo}
            caption="값이 있다 — 지우기"
            aria-label="내용"
            defaultValue="점심 식사"
            clearable
          />
          <Sample
            {...combo}
            caption="빈 칸 — 없다"
            aria-label="내용 빈 칸"
            placeholder="예: 점심 식사"
            clearable
          />
          <Sample
            {...combo}
            state="disabled"
            caption="disabled — 없다"
            aria-label="내용 비활성"
            defaultValue="점심 식사"
            clearable
          />
          <Sample
            {...combo}
            state="readonly"
            caption="readonly — 없다"
            aria-label="내용 읽기 전용"
            defaultValue="점심 식사"
            clearable
          />
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="Field 안 · 반응형(기본) — 1280 미만 large · 이상 medium. 라벨 · 설명 · 오류 · 글자 수는 Field 가 그린다">
      <DemoRow label="responsive">
        <div className="flex w-full max-w-[320px] flex-col gap-x6">
          <Field label="제목" description="결재 목록에 이 제목으로 보여요.">
            <Input placeholder="예: 개인 사유" />
          </Field>
          <Field label="금액" invalid errorMessage="금액을 입력해 주세요.">
            <Input inputMode="numeric" suffix="원" />
          </Field>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
