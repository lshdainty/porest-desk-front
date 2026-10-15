import { useState } from "react";
import { Bell, Eye, EyeOff, Settings } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

type Side = "top" | "bottom" | "left" | "right";

/**
 * 늘 열린 툴팁 견본 — 트리거 옆에 뜬다. 말풍선은 견본 안의 자리(container)로 띄운다 — body 에 뜨면 다크 판의 색을 받지 못하고
 * 검사기가 견본 안에서 찾지 못한다. 견본의 첫 요소는 그 자리다(말풍선은 Radix 가 감싼 div 안이라 첫 요소가 될 수 없다).
 * 뒤집기 · 밀기는 끈다 — 화면을 굴려도 말풍선이 무대 밖으로 나가 다른 견본을 덮지 않게. 제어하는 open 이라 마우스를 옮겨도 닫히지 않는다.
 * 수치는 Help Bubble 과 한 파일(help-bubble.json)의 opens: hover 규칙이다 — 그래서 spec 이 help-bubble 이다.
 */
function OpenTooltip({
  side = "top",
  label,
  children,
}: {
  side?: Side;
  label: string;
  children: React.ReactNode;
}) {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  return (
    <div className="w-[360px]">
      <Tooltip open>
        <div className="flex h-[96px] items-center justify-center">
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label={label}
            >
              <Eye aria-hidden />
            </Button>
          </TooltipTrigger>
        </div>
        <Specimen spec="help-bubble" combo={{ opens: "hover" }}>
          <div ref={setPlace} />
        </Specimen>
        {place && (
          <TooltipContent container={place} side={side} avoidCollisions={false}>
            {children}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}

/** 직접 올려 보는 툴바 — 마우스를 올리면 200ms 뒤, Tab 으로 가면 바로, 옆으로 옮기면 기다리지 않고 바로 */
function TryToolbar() {
  const [hidden, setHidden] = useState(false);
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  return (
    <TooltipProvider>
      <div className="flex items-center gap-x1">
        <Tooltip>
          <TooltipTrigger asChild>
            {/* 이름은 aria-label — 툴팁은 그 이름을 마우스 · 키보드 사용자에게 보여 준다. 켬은 aria-pressed 가 알린다 */}
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label="금액 가리기"
              aria-pressed={hidden}
              onClick={() => setHidden((v) => !v)}
            >
              {hidden ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </TooltipTrigger>
          {place && (
            <TooltipContent container={place}>금액 가리기</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label="알림"
            >
              <Bell aria-hidden />
            </Button>
          </TooltipTrigger>
          {place && <TooltipContent container={place}>알림</TooltipContent>}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              ghostColor="neutralSubtle"
              layout="iconOnly"
              aria-label="설정"
            >
              <Settings aria-hidden />
            </Button>
          </TooltipTrigger>
          {place && <TooltipContent container={place}>설정</TooltipContent>}
        </Tooltip>
        <div ref={setPlace} />
      </div>
    </TooltipProvider>
  );
}

/** 막힌 버튼 — 이유는 툴팁이 아니라 버튼 가까이 보이는 글(막힌 버튼은 키보드 초점을 못 받는다) */
function DisabledReason() {
  return (
    <div className="flex flex-col gap-x1_5">
      <Button
        variant="neutralWeak"
        disabled
        aria-describedby="tooltip-demo-copy-reason"
      >
        지난달 예산 복사
      </Button>
      <p
        id="tooltip-demo-copy-reason"
        className="m-0 text-t3 text-fg-neutral-subtle"
      >
        복사할 지난달 예산이 없어요.
      </p>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 글 길이 · 위치, 직접 올려 보기, 막힌 이유의 자리 */
export const TooltipDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="말풍선 — Help Bubble 과 같은 모양(위아래 10 · 좌우 12 · 모서리 12 · 최대 280 · 화살표) · 글 하나(굵게)">
      <DemoRow label="한 줄 · 위">
        <OpenTooltip label="금액 가리기">금액 가리기</OpenTooltip>
      </DemoRow>
      <DemoRow label="한 줄 · 아래">
        <OpenTooltip label="알림" side="bottom">
          알림
        </OpenTooltip>
      </DemoRow>
      <DemoRow label="280 을 넘는 글">
        <OpenTooltip label="예산 안내" side="bottom">
          이번 달 예산은 지난달에 쓴 금액을 기준으로 잡아 보여 드려요.
          카테고리별 한도는 예산 화면에서 바꿀 수 있고, 바꾼 값은 다음 달부터
          적용돼요.
        </OpenTooltip>
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="직접 올려 보기 — 마우스 200ms · 키보드 Tab 은 바로 · 옆으로 옮기면 기다리지 않고 모션 없이 · Esc · 말풍선 위로 옮겨도 남는다">
      <DemoRow label="아이콘 툴바">
        <TryToolbar />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="막힌 이유는 툴팁이 아니라 가까운 글로 — 툴팁에만 두지 않는다">
      <DemoRow label="막힌 버튼">
        <DisabledReason />
      </DemoRow>
    </DemoBlock>
  </div>
);
