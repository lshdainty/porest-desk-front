import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { Textarea, type TextareaProps } from "./textarea";

// 크기는 정해 둔다 — 카탈로그는 1440 폭이라 responsive(기본)는 medium 으로만 그려진다(반응형은 맨 아래 Field 안에서)
const SIZES = ["large", "medium"] as const;
const AUTO_SIZES = ["on", "off"] as const;
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
  size: (typeof SIZES)[number];
  autoSize: (typeof AUTO_SIZES)[number];
};

const REASON = "다음 주 금요일 오후 반차 — 병원 예약이 있어요.";
const LONG = [
  "10월 회의록 — 디자인 시스템",
  "1. 입력칸을 SEED Text Input 으로 옮긴다",
  "2. 여러 줄은 3줄에서 시작해 쓴 만큼 자란다",
  "3. 시트 · 대화상자 안에서는 최대 높이를 정한다",
  "4. 고정 높이는 2줄보다 낮게 두지 않는다",
  "5. 손잡이는 두지 않는다",
].join("\n");

// 검사기는 견본의 첫 요소(상자)에 초점을 준다 — 상자는 초점을 받지 않으므로 입력으로 넘긴다(wheel-picker 데모와 같은 방법).
// Textarea 는 상자에 className 말고는 받지 않아 입력의 ref 로 상자를 찾는다. 포커스 테두리는 마우스로 눌러도 보인다(직접 눌러 본다)
function passFocus(area: HTMLTextAreaElement | null) {
  const box = area?.parentElement;
  if (!area || !box) return;
  box.tabIndex = -1;
  box.onfocus = () => area.focus({ preventScroll: true });
}

/** 견본 하나 — 크기 · 자동 높이 · 상태를 Textarea 에 그대로 준다. 오류는 aria-invalid(Field 안이면 Field 의 invalid). 아래에 이름표 */
const Sample = ({
  size,
  autoSize,
  state = "enabled",
  caption,
  ...props
}: Combo & { state?: State; caption: string } & Omit<
    TextareaProps,
    "size" | "autoSize"
  >) => (
  <div className="flex w-[200px] flex-col gap-x1">
    <Specimen spec="textarea" combo={{ size, autoSize }} state={state}>
      <Textarea
        ref={state === "focused" ? passFocus : undefined}
        size={size}
        autoSize={autoSize === "on"}
        aria-invalid={state === "invalid" || undefined}
        disabled={state === "disabled"}
        readOnly={state === "readonly"}
        {...props}
      />
    </Specimen>
    <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
  </div>
);

/** 카탈로그(/dev/ds) — 크기 × 자동 높이 × 상태, 높이(자라기 · 최대 높이 · 고정 높이), Field 안 · 반응형 */
export const TextareaDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 자동 높이 × 상태 — 자동 높이는 3줄, 끄면 2줄에서 시작한다. 테두리 · 상태는 Input 의 상자와 같다. 포커스는 직접 눌러 본다">
      {SIZES.map((size) =>
        AUTO_SIZES.map((autoSize) => (
          <DemoRow
            key={`${size}-${autoSize}`}
            label={`${size} · autoSize ${autoSize}`}
          >
            {STATES.map((state) => (
              <Sample
                key={state}
                size={size}
                autoSize={autoSize}
                state={state}
                caption={state}
                aria-label={`휴가 사유 ${state}`}
                defaultValue={REASON}
              />
            ))}
            <Sample
              size={size}
              autoSize={autoSize}
              caption="빈 칸"
              aria-label="휴가 사유 빈 칸"
              placeholder="예: 가족 행사 참석"
            />
            <Sample
              size={size}
              autoSize={autoSize}
              state="disabled"
              caption="disabled · 빈 칸"
              aria-label="휴가 사유 빈 칸 비활성"
              placeholder="예: 가족 행사 참석"
            />
          </DemoRow>
        )),
      )}
    </DemoBlock>

    <DemoBlock title="높이 — 자동 높이는 쓴 만큼 자란다(움직임 없이) · 최대 높이(max-h-*)에서 멈추고 칸 안에서 스크롤 · 고정 높이(h-*)는 넘치면 스크롤. 직접 써 본다">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          <Sample
            size={size}
            autoSize="on"
            caption="자동 높이 — 자란다"
            aria-label="회의록 자동 높이"
            defaultValue={LONG}
          />
          <Sample
            size={size}
            autoSize="on"
            caption="max-h-32 — 128 에서 스크롤"
            aria-label="회의록 최대 높이"
            className="max-h-32"
            defaultValue={LONG}
          />
          <Sample
            size={size}
            autoSize="off"
            caption="autoSize off · h-28 — 112 고정"
            aria-label="회의록 고정 높이"
            className="h-28"
            defaultValue={LONG}
          />
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="Field 안 · 반응형(기본) — 1280 미만 large · 이상 medium. 글자 수는 Field 가 센다(자소 단위 · 최대에서 멈춘다)">
      <DemoRow label="responsive">
        <div className="flex w-full max-w-[320px] flex-col gap-x6">
          <Field label="휴가 사유" maxGraphemeCount={100}>
            <Textarea placeholder="예: 가족 행사 참석" />
          </Field>
          <Field
            label="탈퇴 사유"
            invalid
            errorMessage="탈퇴 사유를 입력해 주세요."
          >
            <Textarea />
          </Field>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
