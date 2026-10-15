import { useState } from "react";
import { Eye, EyeOff, Pin, Star } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Toggle } from "./toggle";

const TOGGLED = ["off", "on"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

const ToggleSpecimen = ({
  tone,
  toggled,
  state,
}: {
  tone: "default" | "inverted";
  toggled: (typeof TOGGLED)[number];
  state: (typeof STATES)[number];
}) => (
  <Specimen spec="toggle" combo={{ tone, toggled }} state={state}>
    <Toggle
      tone={tone}
      aria-label="금액 가리기"
      defaultPressed={toggled === "on"}
      disabled={state === "disabled"}
      icon={<Eye />}
      pressedIcon={<EyeOff />}
    />
  </Specimen>
);

/** 카탈로그(/dev/ds) — 끔 · 켬 × 상태 × 표면(흰 표면 · 브랜드 채움 위), 모으기 단추 · 기능 단추, 눌러 보는 예 */
export const ToggleDemo = () => {
  const [watched, setWatched] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pinned, setPinned] = useState(true);
  return (
    <div className="flex flex-col gap-x8">
      <DemoBlock title="끔 · 켬 × 상태 — 흰 표면 위(default). 끔은 흐린 색 + 선 2, 켬은 진한 색 + 선 2.5, 바탕은 칠하지 않는다. 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다)">
        {STATES.map((state) => (
          <DemoRow key={state} label={state}>
            {TOGGLED.map((toggled) => (
              <ToggleSpecimen
                key={toggled}
                tone="default"
                toggled={toggled}
                state={state}
              />
            ))}
          </DemoRow>
        ))}
      </DemoBlock>

      <DemoBlock title="브랜드 채움 위(inverted — 순자산 카드) — 켬 · 끔 모두 흰 아이콘, 바탕은 칠하지 않고 축소만, 링도 흰색">
        <div className="flex flex-col gap-x2 rounded-r3 bg-bg-brand-solid p-x4">
          {STATES.map((state) => (
            <DemoRow key={state} label={state}>
              {TOGGLED.map((toggled) => (
                <ToggleSpecimen
                  key={toggled}
                  tone="inverted"
                  toggled={toggled}
                  state={state}
                />
              ))}
            </DemoRow>
          ))}
        </div>
      </DemoBlock>

      <DemoBlock title="단추 넷 — 모으기 단추(관심 · 고정)는 같은 아이콘, 기능 단추(눈)는 지금 상태의 아이콘. 이름은 고정 · 켬은 aria-pressed">
        <DemoRow label="관심 등록">
          <Toggle
            aria-label="관심 등록"
            pressed={watched}
            onPressedChange={setWatched}
            icon={<Star />}
          />
        </DemoRow>
        <DemoRow label="메모 고정">
          <Toggle
            aria-label="장보기 목록 고정"
            pressed={pinned}
            onPressedChange={setPinned}
            icon={<Pin />}
          />
        </DemoRow>
        <DemoRow label="금액 가리기">
          <Toggle
            aria-label="금액 가리기"
            pressed={hidden}
            onPressedChange={setHidden}
            icon={<Eye />}
            pressedIcon={<EyeOff />}
          />
        </DemoRow>
        <DemoRow label="App Key 보기">
          <Toggle
            aria-label="App Key 보기"
            defaultPressed={false}
            icon={<EyeOff />}
            pressedIcon={<Eye />}
          />
        </DemoRow>
      </DemoBlock>
    </div>
  );
};
