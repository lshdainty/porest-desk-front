import { useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { ColorSwatchGroup, type ColorSwatchValue } from "./color-swatch";
import {
  COLOR_SWATCH_ORDER,
  firstUnusedColor,
  type ChartColor,
} from "./color-swatch-variants";

// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "focused",
  "pressed",
  "disabled",
] as const;
const SELECTED = ["unselected", "selected"] as const;
type State = (typeof STATES)[number];
type Selected = (typeof SELECTED)[number];
type Current = "custom" | "auto";

// 검사기는 견본의 첫 요소(틀)에 초점을 준다 — 틀은 초점을 받지 않으므로 묶음의 탭 자리 칸으로 넘긴다(input 데모와 같은 방법)
function passFocus(frame: HTMLDivElement | null) {
  if (!frame) return;
  frame.tabIndex = -1;
  frame.onfocus = () =>
    frame
      .querySelector<HTMLElement>("[role=radio][tabindex='0']")
      ?.focus({ preventScroll: true });
}

// 견본 하나 — 고른 칸이 있으면 그 색이 고른 칸이다(검사기는 고른 칸을 [aria-checked=true] 로 찾는다).
// 지금 색 · 자동 칸이 있는 견본은 격자의 빨강을 고른 채 둔다 — 스펙의 색(기본 red)이 고른 칸에 칠해진다
const Sample = ({
  color = "red",
  selected = "selected",
  state = "enabled",
  current,
}: {
  color?: ChartColor;
  selected?: Selected;
  state?: State;
  current?: Current;
}) => (
  <Specimen
    spec="color-swatch"
    combo={{ color, selected, current: current ?? "none" }}
    state={state}
  >
    <div
      ref={state === "focused" ? passFocus : undefined}
      className="w-[360px]"
    >
      <ColorSwatchGroup
        aria-label="색상"
        defaultValue={selected === "selected" ? color : null}
        disabled={state === "disabled"}
        currentColor={current === "custom" ? "#9E9E9E" : undefined}
        autoColor={current === "auto" ? "brown" : undefined}
      />
    </div>
  </Specimen>
);

// 새 카테고리 — 같은 목록이 쓰지 않은 첫 색으로 시작한다(기본 지출 카테고리 여덟이 쓰고 있다)
const USED: ChartColor[] = [
  "blue",
  "green",
  "orange",
  "violet",
  "pink",
  "indigo",
  "red",
  "yellow",
];
const NewExample = () => {
  const [color, setColor] = useState<ColorSwatchValue>(() =>
    firstUnusedColor(USED),
  );
  return (
    <div className="w-[320px]">
      <Field label="색상">
        <ColorSwatchGroup value={color} onValueChange={setColor} />
      </Field>
    </div>
  );
};

// 고치기 — 팔레트 밖 색(가져오기의 #9E9E9E)은 지금 색 칸이 골라져 있다. 고르지 않고 저장하면 "current"
const EditExample = ({ width }: { width: number }) => {
  const [picked, setPicked] = useState<ColorSwatchValue>("current");
  return (
    <div style={{ width }}>
      <Field label="색상">
        <ColorSwatchGroup
          value={picked}
          onValueChange={setPicked}
          currentColor="#9E9E9E"
        />
      </Field>
      <p className="mt-x2 text-t2 text-fg-neutral-subtle">
        저장 값: {picked === "current" ? "그대로(#9E9E9E)" : picked}
      </p>
    </div>
  );
};

const AutoExample = () => {
  const [picked, setPicked] = useState<ColorSwatchValue>("current");
  return (
    <div className="w-[360px]">
      <Field label="색상">
        <ColorSwatchGroup
          value={picked}
          onValueChange={setPicked}
          autoColor="brown"
        />
      </Field>
    </div>
  );
};

// 글자 · 정렬을 한 그림에 — 막힘 · 오류 Field
const FieldStates = () => (
  <div className="flex w-[320px] flex-col gap-x6">
    <Field label="색상" disabled>
      <ColorSwatchGroup defaultValue="blue" />
    </Field>
    <Field label="색상" invalid errorMessage="색을 골라주세요.">
      <ColorSwatchGroup defaultValue={null} />
    </Field>
  </div>
);

/** 카탈로그(/dev/ds) — 색 10 × 고름, 상태(올림 · 누름 · 포커스 · 막힘) × 안 고름 · 고름, 지금 색 · 자동(옆 · 위), 새 항목 첫 색 */
export const ColorSwatchDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="색 10 — 라이트 700 · 다크 800-dark, 고르면 고리(띄움 2) + 체크(라이트 흰 · 다크 짙은 글자)">
      <DemoRow label="고름">
        <div className="flex flex-wrap gap-x4" data-scene="swatch-colors">
          {COLOR_SWATCH_ORDER.map((color) => (
            <Sample key={color} color={color} />
          ))}
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="상태 — 올림은 모양이 바뀌지 않는다 · 누름은 2px 축소 · 포커스는 고리 바깥 링(키보드) · 막힘은 색 그대로 + 회색 고리. 직접 눌러 본다">
      {SELECTED.map((selected) => (
        <DemoRow key={selected} label={selected}>
          <div className="flex flex-wrap gap-x4">
            {STATES.map((state) => (
              <Sample
                key={state}
                color="blue"
                selected={selected}
                state={state}
              />
            ))}
          </div>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="지금 색 · 자동 — 격자 앞 칸 + 세로 선(321 이상 옆으로)">
      <DemoRow label="지금 색">
        <Sample current="custom" />
      </DemoRow>
      <DemoRow label="자동">
        <Sample current="auto" />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="지금 색을 격자 위 줄에 — 321 보다 좁은 자리(360 폰 본문 312)는 가로 선으로 가른다 · 고치기 · 자동 · 새 항목 첫 색 · Field 막힘 · 오류">
      <DemoRow label="좁은 자리 312">
        <EditExample width={312} />
      </DemoRow>
      <DemoRow label="옆 342">
        <EditExample width={342} />
      </DemoRow>
      <DemoRow label="자동 고치기">
        <AutoExample />
      </DemoRow>
      <DemoRow label="새 항목">
        <NewExample />
      </DemoRow>
      <DemoRow label="Field">
        <FieldStates />
      </DemoRow>
    </DemoBlock>
  </div>
);
