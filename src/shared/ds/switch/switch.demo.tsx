import { useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Switch, Switchmark } from "./switch";

const SIZES = ["16", "24", "32"] as const;
const TONES = ["neutral", "brand"] as const;
const CHECKED = ["unchecked", "checked"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태. 포커스는 검사기가 줄(<label>)에 주면 브라우저가 스위치로 넘긴다
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

// 스위치만(Switchmark) — 줄을 <label> 로 감싸 줄 어디를 눌러도 바뀌고, 줄의 글자가 스위치의 이름이 된다(switch.md 코드)
const SwitchmarkRow = () => {
  const [on, setOn] = useState(true);
  return (
    <label className="flex w-full max-w-[360px] cursor-pointer items-center gap-x3 px-x6 py-x3">
      <span className="flex-1 text-t5 text-fg-neutral">결제 알림</span>
      <Switchmark checked={on} onCheckedChange={setOn} />
    </label>
  );
};

/** 카탈로그(/dev/ds) — 크기 × 톤 × 끔 · 켬, 상태(올림 · 누름 · 포커스 · 비활성), 스위치만(Switchmark) */
export const SwitchDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 톤 × 끔 · 켬 — 크기 이름은 트랙 높이">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          {SIZES.map((size) =>
            CHECKED.map((checked) => (
              <Specimen
                key={`${size}-${checked}`}
                spec="switch"
                combo={{ size, tone, checked }}
              >
                <Switch
                  size={size}
                  tone={tone}
                  defaultChecked={checked === "checked"}
                  label={size}
                />
              </Specimen>
            )),
          )}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="상태 — 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다). 올림 · 누름은 색이 바뀌지 않는다">
      {TONES.map((tone) =>
        CHECKED.map((checked) => (
          <DemoRow key={`${tone}-${checked}`} label={`${tone} · ${checked}`}>
            {STATES.map((state) => (
              <Specimen
                key={state}
                spec="switch"
                combo={{ size: "24", tone, checked }}
                state={state}
              >
                <Switch
                  tone={tone}
                  defaultChecked={checked === "checked"}
                  disabled={state === "disabled"}
                  label={state}
                />
              </Specimen>
            ))}
          </DemoRow>
        )),
      )}
    </DemoBlock>

    <DemoBlock title="스위치만(Switchmark) — 설정 줄은 줄 전체가 누르는 영역, 줄의 글자가 스위치의 이름">
      <DemoRow label="Switchmark">
        <SwitchmarkRow />
      </DemoRow>
    </DemoBlock>
  </div>
);
