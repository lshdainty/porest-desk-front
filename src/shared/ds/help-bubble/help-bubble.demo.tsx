import { useState } from "react";
import { EyeOff, Info } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  HelpBubble,
  HelpBubbleAnchor,
  HelpBubbleContent,
  HelpBubbleTrigger,
} from "./help-bubble";

const LEAVE = {
  title: "연차 사용 규정",
  description:
    "입사 1년 미만은 한 달에 1일씩 생기고, 1년이 지나면 15일이 생겨요.",
};
const HIDE = {
  title: "금액을 가릴 수 있어요",
  description: "누르면 화면의 금액이 모두 가려져요.",
};

// 검사기가 견본 자리에 준 초점을 말풍선으로 넘긴다 — 닫기 버튼이 있으면 그것, 없으면 말풍선(열린 동안 트리거에서 Tab 을 누른 자리)
function passFocus(place: HTMLElement) {
  const bubble = place.querySelector<HTMLElement>(
    "[data-slot=help-bubble-content]",
  );
  const target =
    bubble?.querySelector<HTMLElement>("[data-slot=help-bubble-close]") ??
    bubble;
  target?.focus({ preventScroll: true });
}

/**
 * 늘 열린 말풍선 견본 — ⓘ 위에 뜬다. 말풍선은 견본 안의 자리(container)로 띄운다 — body 에 뜨면 다크 판의 색을 받지 못하고
 * 검사기가 견본 안에서 찾지 못한다. 견본의 첫 요소는 그 자리다(말풍선은 Radix 가 감싼 div 안이라 첫 요소가 될 수 없다).
 * 뒤집기 · 밀기는 끈다 — 화면을 굴려도 말풍선이 무대(높이 160) 밖으로 나가 다른 견본을 덮지 않게.
 * focused 견본은 자리에 온 초점을 말풍선으로 넘긴다(passFocus). 제어하는 open 이라 바깥을 눌러도 닫히지 않는다.
 */
function OpenBubble({
  closeButton,
  state = "enabled",
  label,
  title,
  description,
}: {
  closeButton: "hidden" | "shown";
  state?: "enabled" | "focused";
  label: string;
  title: string;
  description?: string;
}) {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const focused = state === "focused";
  return (
    <div className="w-[300px]">
      <HelpBubble open>
        <div className="flex h-[160px] items-end justify-center">
          <HelpBubbleTrigger asChild>
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label={`${label} 안내`}
            >
              <Info aria-hidden />
            </Button>
          </HelpBubbleTrigger>
        </div>
        <Specimen
          spec="help-bubble"
          combo={{ opens: "press", closeButton }}
          state={state}
        >
          <div
            ref={setPlace}
            tabIndex={focused ? -1 : undefined}
            onFocus={(e) => {
              if (focused && e.target === e.currentTarget)
                passFocus(e.currentTarget);
            }}
          />
        </Specimen>
        {place && (
          <HelpBubbleContent
            container={place}
            avoidCollisions={false}
            title={title}
            description={description}
            showCloseButton={closeButton === "shown"}
          />
        )}
      </HelpBubble>
    </div>
  );
}

/** 직접 눌러 여는 ⓘ — 처음엔 닫혀 있다. 열리면 판 안의 자리로 띄운다(다크 판의 색) */
function TryInfo() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  return (
    <div className="w-[300px]">
      <HelpBubble>
        <div className="flex h-[160px] items-end justify-center">
          <div className="flex items-center gap-x1 text-t5 font-medium text-fg-neutral">
            <span>남은 연차 8.5일</span>
            <HelpBubbleTrigger asChild>
              <Button
                variant="ghost"
                ghostColor="neutralSubtle"
                layout="iconOnly"
                aria-label="연차 사용 규정 안내"
              >
                <Info aria-hidden />
              </Button>
            </HelpBubbleTrigger>
          </div>
        </div>
        <div ref={setPlace} />
        {place && <HelpBubbleContent container={place} {...LEAVE} />}
      </HelpBubble>
    </div>
  );
}

/**
 * 처음부터 열어 두는 안내 — 다른 버튼(금액 가리기)에 자리만 붙이고(Anchor) 닫기 버튼 · Esc · Tab 으로만 닫는다.
 * 카탈로그가 처음부터 열어 두면 다른 견본을 덮을 수 있어 "안내 열기" 로 연다(실제 화면은 defaultOpen).
 */
function TryAnchor() {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div className="w-[300px]">
      <HelpBubble open={open} onOpenChange={setOpen}>
        <div className="flex h-[180px] items-start justify-between">
          <Button
            variant="neutralWeak"
            size="small"
            onClick={() => setOpen(true)}
          >
            안내 열기
          </Button>
          <HelpBubbleAnchor asChild>
            <Button variant="ghost" layout="iconOnly" aria-label="금액 가리기">
              <EyeOff aria-hidden />
            </Button>
          </HelpBubbleAnchor>
        </div>
        <div ref={setPlace} />
        {place && (
          <HelpBubbleContent
            container={place}
            {...HIDE}
            showCloseButton
            closeOnInteractOutside={false}
            side="bottom"
          />
        )}
      </HelpBubble>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 열린 말풍선(제목만 · 제목 + 설명 · 닫기 버튼), 키보드 초점, 직접 열어 보기. 툴팁(opens: hover)은 Tooltip 데모 */
export const HelpBubbleDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="말풍선 — 화살표 끝 ↔ ⓘ 4, 최대 280 · 닫기 버튼은 남겨 둘 안내에만">
      <DemoRow label="제목만">
        <OpenBubble
          closeButton="hidden"
          label="금액 가리기"
          title="금액 가리기"
        />
      </DemoRow>
      <DemoRow label="제목 + 설명">
        <OpenBubble closeButton="hidden" label="연차 사용 규정" {...LEAVE} />
      </DemoRow>
      <DemoRow label="닫기 버튼">
        <OpenBubble closeButton="shown" label="금액 가리기" {...HIDE} />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="키보드 초점 — 닫기 버튼이 없으면 말풍선 둘레 바깥 링(브랜드), 있으면 닫기 버튼 안쪽 링(글자색)">
      <DemoRow label="말풍선">
        <OpenBubble
          closeButton="hidden"
          state="focused"
          label="연차 사용 규정"
          {...LEAVE}
        />
      </DemoRow>
      <DemoRow label="닫기 버튼">
        <OpenBubble
          closeButton="shown"
          state="focused"
          label="금액 가리기"
          {...HIDE}
        />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — ⓘ 누르기 · Tab 으로 들어가고 나가기 · Esc · 바깥 누르기, 닫기 버튼은 누르면 2px 준다">
      <DemoRow label="ⓘ 규정 안내">
        <TryInfo />
      </DemoRow>
      <DemoRow label="처음 쓰는 안내">
        <TryAnchor />
      </DemoRow>
    </DemoBlock>
  </div>
);
