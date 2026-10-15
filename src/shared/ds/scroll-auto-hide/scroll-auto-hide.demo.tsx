import { useEffect, useRef, type ReactNode } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { ScrollAutoHide } from "./scroll-auto-hide";

const BOX =
  "relative h-[360px] w-[320px] max-w-full overflow-y-auto rounded-r3 border border-solid border-stroke-neutral-weak bg-bg-layer-default";

const Header = ({ children }: { children?: ReactNode }) => (
  <div className="flex flex-col gap-x2 border-b border-solid border-stroke-neutral-subtle p-x4">
    <div className="text-t3 text-fg-neutral-subtle">10월 · 지출</div>
    <div className="text-t7 font-bold text-fg-neutral">−1,234,567원</div>
    {children}
  </div>
);

const Rows = ({ count = 30 }: { count?: number }) => (
  <ul className="m-0 flex list-none flex-col p-0">
    {Array.from({ length: count }, (_, i) => (
      <li
        key={i}
        className="flex justify-between border-b border-solid border-stroke-neutral-subtle px-x4 py-x3 text-t4 text-fg-neutral"
      >
        <span>거래 {i + 1}</span>
        <span className="text-fg-neutral-subtle">−{(i + 1) * 1234}원</span>
      </li>
    ))}
  </ul>
);

// 견본 하나 — 스크롤 상자가 뿌리다. 다 드러남(shown)은 맨 위, 다 숨음(hidden)은 머리 높이 넘게 내린 모습. 상태는 스크롤 위치라
// 검사기는 올림 · 누름 · 포커스를 하지 않고, 그대로 그린 위치에서 sticky · top · 바탕 · 겹침 값을 잰다
const Sample = ({ hidden }: { hidden: boolean }) => {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hidden && box.current) box.current.scrollTop = 600;
  }, [hidden]);
  return (
    <Specimen
      spec="scroll-auto-hide"
      combo={{ motionSetting: "normal" }}
      state={hidden ? "hidden" : "shown"}
    >
      <div ref={box} className={BOX}>
        <ScrollAutoHide
          scrollContainerRef={box}
          className="z-2 bg-bg-layer-default"
        >
          <Header />
        </ScrollAutoHide>
        <Rows />
      </div>
    </Specimen>
  );
};

// 직접 해 본다 — 내리면 머리가 따라 숨고, 올리면 드러나고, 멈추면 50% 에서 스냅한다. 머리 안 단추에 Tab 으로 초점을 주면 바로 드러난다
const Playground = () => {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="flex flex-col gap-x2">
      <div ref={box} className={BOX}>
        <ScrollAutoHide
          scrollContainerRef={box}
          className="z-2 bg-bg-layer-default"
        >
          <Header>
            <button
              type="button"
              className="self-start rounded-r2 bg-bg-neutral-weak px-x3 py-x2 text-t4 text-fg-neutral"
            >
              소비 요약
            </button>
          </Header>
        </ScrollAutoHide>
        <Rows count={40} />
      </div>
      <div className="flex gap-x2">
        <button
          type="button"
          className="rounded-r2 bg-bg-neutral-weak px-x3 py-x2 text-t4 text-fg-neutral"
          onClick={() => {
            const el = box.current;
            if (!el) return;
            el.scrollTo({ top: 900 });
            window.setTimeout(() => el.scrollBy({ top: -60 }), 600);
          }}
        >
          내렸다 조금 올리기
        </button>
        <button
          type="button"
          className="rounded-r2 bg-bg-neutral-weak px-x3 py-x2 text-t4 text-fg-neutral"
          onClick={() => box.current?.scrollTo({ top: 0 })}
        >
          맨 위로
        </button>
      </div>
    </div>
  );
};

// 가장 나쁜 값 — 머리가 키가 큰 영역(필터 칩 줄 포함)이고 목록이 짧아 스크롤이 거의 없다
const ShortList = () => {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className={BOX}>
      <ScrollAutoHide
        scrollContainerRef={box}
        className="z-2 bg-bg-layer-default"
      >
        <Header>
          <div className="flex w-max gap-x2">
            {["식비", "교통", "쇼핑", "의료", "문화"].map((c) => (
              <span
                key={c}
                className="rounded-full bg-bg-neutral-weak px-x3 py-x1_5 text-t4 text-fg-neutral"
              >
                {c}
              </span>
            ))}
          </div>
        </Header>
      </ScrollAutoHide>
      <Rows count={6} />
    </div>
  );
};

/** 카탈로그(/dev/ds) — 다 드러남 · 다 숨음, 직접 스크롤해 보기(1:1 · 50% 스냅 · 초점이 오면 드러남), 가장 나쁜 값 */
export const ScrollAutoHideDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="다 드러남(맨 위) · 다 숨음(머리 높이 넘게 내림) — 머리는 sticky · top 0, 높이는 그대로 두고 위로 옮기기만 한다. 모션 줄이기면 자동 숨김이 꺼져 늘 보인다(OS 설정으로 해 본다)">
      <DemoRow label="shown · hidden">
        <Sample hidden={false} />
        <Sample hidden />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="직접 스크롤 — 내린 만큼 숨고 올린 만큼 드러나며 멈추면 절반 기준으로 200ms 스냅. 머리의 단추에 Tab 으로 초점을 주면 바로 드러난다">
      <Playground />
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 키 큰 머리 + 짧은 목록(스크롤이 거의 없다)">
      <ShortList />
    </DemoBlock>
  </div>
);
