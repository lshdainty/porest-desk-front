import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { PageBanner } from "./page-banner";

const TONES = [
  "neutral",
  "informative",
  "positive",
  "warning",
  "critical",
] as const;
const VARIANTS = ["weak", "solid"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태 — 띠 전체를 누르는 Actionable 의 것이다
const STATES = ["hovered", "pressed", "focused"] as const;

// 톤마다 제목 · 본문 · 버튼 — page-banner.md 의 글 규칙(제목은 상태, 버튼은 동작 이름)
const COPY = {
  neutral: {
    title: undefined,
    body: "이 화면의 시세는 하루에 한 번 새로 고쳐져요.",
    button: "새로 고침",
  },
  informative: {
    title: "새 버전",
    body: "더 빨라진 가계부를 쓸 수 있어요.",
    button: "업데이트",
  },
  positive: {
    title: "연결됨",
    body: "토스증권과 다시 연결됐어요.",
    button: "보기",
  },
  warning: {
    title: "곧 만료",
    body: "Pro 이용이 10월 31일에 끝나요.",
    button: "구독 보기",
  },
  critical: {
    title: "연결 끊김",
    body: "토스증권 키가 만료돼 시세를 받지 못해요.",
    button: "다시 연결",
  },
};

const ignore = () => {};

/** 카탈로그(/dev/ds) — 바탕 × 톤 × 상호작용(보이기 · 전체 누르기 · 닫기), 전체 누르기의 상태 */
export const PageBannerDemo = () => (
  <div className="flex flex-col gap-x8">
    {VARIANTS.map((variant) => (
      <DemoBlock
        key={variant}
        title={`${variant === "weak" ? "옅은 바탕(weak · 기본)" : "짙은 바탕(solid) — 무거운 상태에만"} — 보이기 · 글 버튼 하나`}
      >
        {TONES.map((tone) => (
          <DemoRow key={tone} label={tone}>
            <Specimen
              spec="page-banner"
              combo={{ tone, variant, interaction: "display" }}
            >
              <PageBanner
                tone={tone}
                variant={variant}
                title={COPY[tone].title}
                button={{ label: COPY[tone].button, onClick: ignore }}
              >
                {COPY[tone].body}
              </PageBanner>
            </Specimen>
          </DemoRow>
        ))}
      </DemoBlock>
    ))}

    <DemoBlock title="전체 누르기(actionable) — 띠 전체가 버튼 · 뒤 화살표, 누르면 안의 내용만 준다">
      {VARIANTS.map((variant) =>
        TONES.map((tone) => (
          <DemoRow key={`${variant}-${tone}`} label={`${variant} ${tone}`}>
            <Specimen
              spec="page-banner"
              combo={{ tone, variant, interaction: "actionable" }}
            >
              <PageBanner
                tone={tone}
                variant={variant}
                interaction="actionable"
                title={COPY[tone].title}
                onClick={ignore}
              >
                {COPY[tone].body}
              </PageBanner>
            </Specimen>
          </DemoRow>
        )),
      )}
    </DemoBlock>

    <DemoBlock title="닫기(dismissible) — 한 번 보면 되는 안내에만. 닫으면 바로 걷는다(다시 그리려면 새로 고침)">
      {VARIANTS.map((variant) =>
        TONES.map((tone) => (
          <DemoRow key={`${variant}-${tone}`} label={`${variant} ${tone}`}>
            <Specimen
              spec="page-banner"
              combo={{ tone, variant, interaction: "dismissible" }}
            >
              <PageBanner
                tone={tone}
                variant={variant}
                interaction="dismissible"
                title="새 기능"
              >
                반복 거래를 자동으로 기록할 수 있어요.
              </PageBanner>
            </Specimen>
          </DemoRow>
        )),
      )}
    </DemoBlock>

    <DemoBlock title="상태 — 전체 누르기를 올림 · 누름 · 키보드 포커스(검사기는 실제로 올리고 누른다). 글 버튼 · 닫기의 누름은 직접 해 본다">
      {VARIANTS.map((variant) =>
        TONES.map((tone) => (
          <DemoRow key={`${variant}-${tone}`} label={`${variant} ${tone}`}>
            {STATES.map((state) => (
              <Specimen
                key={state}
                spec="page-banner"
                combo={{ tone, variant, interaction: "actionable" }}
                state={state}
              >
                <PageBanner
                  tone={tone}
                  variant={variant}
                  interaction="actionable"
                  onClick={ignore}
                >
                  {state}
                </PageBanner>
              </Specimen>
            ))}
          </DemoRow>
        )),
      )}
    </DemoBlock>
  </div>
);
