import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { ScrollArea } from "./scroll-area";

const CONTEXTS = ["page", "overlay", "row"] as const;
const FOCUSABLE = ["inside", "none"] as const;

const DAY = Array.from({ length: 16 }, (_, i) => ({
  time: `${String(8 + i).padStart(2, "0")}:00`,
  title:
    i % 3 === 0
      ? "팀 주간 회의 · 분기 목표 점검과 휴가 일정 공유"
      : "개인 일정",
}));

const Timeline = () => (
  <ul className="m-0 flex list-none flex-col p-0">
    {DAY.map((e) => (
      <li
        key={e.time}
        className="flex gap-x3 border-b border-solid border-stroke-neutral-subtle px-x4 py-x3 text-t4 text-fg-neutral"
      >
        <span className="w-12 shrink-0 text-fg-neutral-subtle">{e.time}</span>
        <span>{e.title}</span>
      </li>
    ))}
  </ul>
);

// 안에 초점 가는 것이 있는 상자 — 그것에 초점이 가면 브라우저가 스크롤한다(상자 자신은 초점을 받지 않는다)
const WithButtons = () => (
  <div className="flex flex-col gap-x2 p-x4">
    {Array.from({ length: 12 }, (_, i) => (
      <button
        key={i}
        type="button"
        className="rounded-r2 bg-bg-neutral-weak px-x3 py-x2 text-left text-t4 text-fg-neutral"
      >
        카테고리 {i + 1}
      </button>
    ))}
  </div>
);

const Chips = () => (
  <div className="flex w-max gap-x2 p-x3">
    {[
      "식비",
      "교통",
      "쇼핑",
      "의료",
      "문화",
      "교육",
      "통신",
      "보험",
      "저축",
    ].map((c) => (
      <span
        key={c}
        className="shrink-0 rounded-full bg-bg-neutral-weak px-x3 py-x1_5 text-t4 text-fg-neutral"
      >
        {c}
      </span>
    ))}
  </div>
);

const BOX =
  "w-[320px] max-w-full rounded-r3 border border-solid border-stroke-neutral-weak bg-bg-layer-default";

type Context = (typeof CONTEXTS)[number];
type Focusable = (typeof FOCUSABLE)[number];

// 견본 하나 — 놓인 자리 × 초점 가는 것의 유무. 뿌리가 곧 스크롤 상자다(검사기가 뿌리에 키보드 포커스를 준다)
const Sample = ({
  context,
  focusable,
  state = "enabled",
}: {
  context: Context;
  focusable: Focusable;
  state?: "enabled" | "focused";
}) => {
  const label = focusable === "none" ? "10월 9일 일정" : undefined;
  return (
    <Specimen spec="scroll-area" combo={{ context, focusable }} state={state}>
      {context === "row" ? (
        // 가로 줄 — 스크롤바를 숨긴다(끝은 Scroll Fog row 흐림이 알린다)
        <ScrollArea
          orientation="both"
          label={label}
          className={`${BOX} scrollbar-hide`}
        >
          <Chips />
        </ScrollArea>
      ) : (
        <ScrollArea
          label={label}
          contain={context === "overlay"}
          className={`${BOX} h-[200px]`}
        >
          {focusable === "none" ? <Timeline /> : <WithButtons />}
        </ScrollArea>
      )}
    </Specimen>
  );
};

// 가장 나쁜 값 — 시트 안 상자 안의 중첩 스크롤 · 상자 끝에서 뒤 화면이 따라오지 않는다
const NestedExample = () => (
  <ScrollArea
    contain
    className="h-[260px] w-[360px] max-w-full rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-floating p-x4"
  >
    <p className="m-0 mb-x3 text-t5 font-bold text-fg-neutral">휴가 신청</p>
    <ScrollArea
      label="휴가 정책"
      contain
      className="h-[120px] rounded-r2 border border-solid border-stroke-neutral-subtle"
    >
      <p className="m-0 p-x3 text-t4 text-fg-neutral-muted">
        {Array.from(
          { length: 12 },
          () =>
            "연차는 입사일 기준으로 발생하며 사용하지 않은 연차는 정산해요.",
        ).join(" ")}
      </p>
    </ScrollArea>
    <div className="mt-x3 h-[240px] text-t4 text-fg-neutral-subtle">
      정책 상자 끝까지 내리면 바깥 본문이 따라 움직이지 않아요. 바깥 본문도
      끝에서 뒤 화면을 끌지 않아요.
    </div>
  </ScrollArea>
);

/** 카탈로그(/dev/ds) — 놓인 자리(화면 · 시트 안 · 가로 줄) × 초점 가는 것의 유무, 초점, 중첩 스크롤 */
export const ScrollAreaDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="놓인 자리 × 초점 가는 것 — 스크롤바는 전역 6px 알약(넘치면 늘 보인다). 초점 가는 것이 없는 상자는 상자가 초점과 이름(region)을 받고, 시트 안(overlay)은 끝에서 뒤 화면을 끌지 않고, 가로 줄(row)은 스크롤바를 숨긴다">
      {CONTEXTS.map((context) => (
        <DemoRow key={context} label={context}>
          {FOCUSABLE.map((focusable) => (
            <Sample key={focusable} context={context} focusable={focusable} />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="초점 — 키보드 포커스 링은 상자 안쪽 2px. Tab 으로 상자에 서고 ↑ ↓ · PageUp · PageDown · Home · End 로 스크롤한다">
      <DemoRow label="focused">
        <Sample context="page" focusable="none" state="focused" />
        <Sample context="overlay" focusable="none" state="focused" />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 시트 안 상자 안의 상자(중첩 스크롤). 안쪽 끝에서 바깥이, 바깥 끝에서 뒤 화면이 따라오지 않는다">
      <NestedExample />
    </DemoBlock>
  </div>
);
