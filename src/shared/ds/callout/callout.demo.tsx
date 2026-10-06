import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Callout } from "./callout";

const TONES = [
  "neutral",
  "informative",
  "positive",
  "warning",
  "critical",
] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태 — 상자 전체를 누르는 Actionable 의 것이다
const STATES = ["hovered", "pressed", "focused"] as const;

// 톤마다 제목 · 본문 — callout.md 의 글 규칙(제목은 성격, 본문은 해요체 문장)
const COPY = {
  neutral: {
    title: "안내",
    body: "카드 결제일이 지나면 이번 달 사용액이 확정돼요.",
  },
  informative: {
    title: "안내",
    body: "가져온 데이터는 기존 거래에 더해지고 덮어쓰지 않아요.",
  },
  positive: {
    title: "혜택",
    body: "이번 달 예산을 지켜 목표에 3만 원을 더 모았어요.",
  },
  warning: { title: "주의", body: "분할 금액의 합이 거래 금액과 달라요." },
  critical: {
    title: undefined,
    body: "저장하지 못했어요. 입력한 내용은 그대로 있어요. 잠시 뒤 다시 저장해 주세요.",
  },
};

const ignore = () => {};

/** 카탈로그(/dev/ds) — 톤 × 상호작용(보이기 · 전체 누르기 · 닫기), 전체 누르기의 상태 */
export const CalloutDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="톤 — 보이기(display) · 제목 · 링크(보조 내용으로 갈 때만)">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          <Specimen spec="callout" combo={{ tone, interaction: "display" }}>
            <Callout
              tone={tone}
              title={COPY[tone].title}
              // href 면 <a>, 아니면 <button type="button"> — 둘 다 그린다(이 묶음 머리로 간다)
              link={
                tone === "informative"
                  ? { label: "자세히", href: "#feedback" }
                  : { label: "자세히", onClick: ignore }
              }
            >
              {COPY[tone].body}
            </Callout>
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="전체 누르기(actionable) — 상자 전체가 버튼 · 뒤 화살표, 링크는 두지 않는다">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          <Specimen spec="callout" combo={{ tone, interaction: "actionable" }}>
            <Callout tone={tone} interaction="actionable" onClick={ignore}>
              토스증권을 연결하면 보유 주식이 자산에 더해져요.
            </Callout>
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="닫기(dismissible) — 한 번 보면 되는 안내에만. 닫으면 바로 걷는다(다시 그리려면 새로 고침)">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          <Specimen spec="callout" combo={{ tone, interaction: "dismissible" }}>
            <Callout tone={tone} title="새 기능" interaction="dismissible">
              반복 거래를 자동으로 기록할 수 있어요.
            </Callout>
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="상태 — 전체 누르기를 올림 · 누름 · 키보드 포커스(검사기는 실제로 올리고 누른다). 닫기 버튼의 올림 · 누름은 직접 해 본다">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          {STATES.map((state) => (
            <Specimen
              key={state}
              spec="callout"
              combo={{ tone, interaction: "actionable" }}
              state={state}
            >
              <Callout tone={tone} interaction="actionable" onClick={ignore}>
                {state}
              </Callout>
            </Specimen>
          ))}
        </DemoRow>
      ))}
    </DemoBlock>
  </div>
);
