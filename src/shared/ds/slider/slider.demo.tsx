import { useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { RangeSlider, Slider, SliderValue } from "./slider";

const MODES = ["single", "range"] as const;
const TICKS = ["none", "discrete"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "focused",
  "pressed",
  "disabled",
] as const;
type Mode = (typeof MODES)[number];
type Ticks = (typeof TICKS)[number];
type State = (typeof STATES)[number];

// 눈금 없음 — 10 구간 이상(50 ~ 100 · 5 단위, 0 ~ 100 · 10 단위), 있음 — 4 구간(별점 1 ~ 5 · 0 ~ 100 · 25 단위)
// 값은 가운데 — 검사기가 견본 가운데를 올리고 누르므로 손잡이가 그 자리에 있어야 손잡이를 잰다
const RANGE = {
  none: { min: 0, max: 100, step: 10, value: [50, 80] as [number, number] },
  discrete: { min: 0, max: 100, step: 25, value: [50, 75] as [number, number] },
};
const SINGLE = {
  none: { min: 50, max: 100, step: 5, value: 75 },
  discrete: { min: 1, max: 5, step: 1, value: 3 },
};
const unit = (mode: Mode, ticks: Ticks) =>
  mode === "single" && ticks === "discrete" ? "점" : "%";

// 검사기는 견본의 첫 요소(틀)에 초점을 준다 — 틀은 초점을 받지 않으므로 손잡이로 넘긴다(input 데모와 같은 방법).
// 틀이 놓인 자리 가운데를 올리고 누르는 것도 검사기다
function passFocus(frame: HTMLDivElement | null) {
  if (!frame) return;
  frame.tabIndex = -1;
  frame.onfocus = () =>
    frame.querySelector<HTMLElement>("[role=slider]")?.focus({
      preventScroll: true,
    });
}

const Sample = ({
  mode,
  ticks,
  state = "enabled",
}: {
  mode: Mode;
  ticks: Ticks;
  state?: State;
}) => {
  const suffix = unit(mode, ticks);
  const format = (v: number) => `${v}${suffix}`;
  const disabled = state === "disabled";
  return (
    <Specimen spec="slider" combo={{ mode, ticks }} state={state}>
      <div
        ref={state === "focused" ? passFocus : undefined}
        className="w-[320px]"
      >
        {mode === "single" ? (
          <Slider
            aria-label="견본"
            {...SINGLE[ticks]}
            defaultValue={SINGLE[ticks].value}
            formatValue={format}
            disabled={disabled}
          />
        ) : (
          <RangeSlider
            aria-label="견본"
            {...RANGE[ticks]}
            defaultValue={RANGE[ticks].value}
            formatValue={format}
            disabled={disabled}
          />
        )}
      </div>
    </Specimen>
  );
};

// 설정 — 예산 알림 임계값. 끄는 동안은 화면만, 손을 뗄 때 한 번 저장한다(onValueCommit)
const ThresholdExample = () => {
  const [threshold, setThreshold] = useState(80);
  const [saves, setSaves] = useState(0);
  return (
    <div className="w-[320px]">
      <Field
        label="예산 알림 임계값"
        headerAction={<SliderValue>{threshold}%</SliderValue>}
        description={`예산 사용률이 이 값을 넘으면 알려줘요. (저장 요청 ${saves}번)`}
      >
        <Slider
          min={50}
          max={100}
          step={5}
          value={threshold}
          onValueChange={setThreshold}
          onValueCommit={() => setSaves((n) => n + 1)}
          formatValue={(v) => `${v}%`}
        />
      </Field>
    </div>
  );
};

const ScoreExample = ({ disabled = false }: { disabled?: boolean }) => {
  const [score, setScore] = useState(4);
  return (
    <div className="w-[320px]">
      <Field
        label="만족도"
        headerAction={<SliderValue>{score}점</SliderValue>}
        disabled={disabled}
      >
        <Slider
          min={1}
          max={5}
          value={score}
          onValueChange={setScore}
          formatValue={(v) => `${v}점`}
        />
      </Field>
    </div>
  );
};

const RangeExample = () => {
  const [usage, setUsage] = useState<[number, number]>([30, 70]);
  return (
    <div className="w-[320px]">
      <Field
        label="예산 사용률"
        headerAction={
          <SliderValue>
            {usage[0]}% ~ {usage[1]}%
          </SliderValue>
        }
      >
        <RangeSlider
          min={0}
          max={100}
          step={10}
          value={usage}
          onValueChange={setUsage}
          formatValue={(v) => `${v}%`}
        />
      </Field>
    </div>
  );
};

// 머리 값 견본 — 슬라이더가 아니라 머리 값(SliderValue)만 잰다. 틀은 Field 머리 오른쪽 자리
const HeaderValueSample = ({ disabled }: { disabled: boolean }) => (
  <Specimen
    spec="slider"
    combo={{ mode: "single", ticks: "none" }}
    state={disabled ? "disabled" : "enabled"}
  >
    <div className="flex">
      <SliderValue disabled={disabled}>80%</SliderValue>
    </div>
  </Specimen>
);

/** 카탈로그(/dev/ds) — 값 하나 · 둘 × 눈금 없음 · 있음 × 상태, 머리 값, Field 안 예시(끌어 보기 · 키보드) */
export const SliderDemo = () => (
  <div className="flex flex-col gap-x8">
    {MODES.map((mode) =>
      TICKS.map((ticks) => (
        <DemoBlock
          key={`${mode}-${ticks}`}
          title={`${mode === "single" ? "값 하나" : "값 둘"} · ${ticks === "none" ? "눈금 없음 — 양 끝 표식" : "눈금 있음 — 굵은 틈 · 단계 표식"} · 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다)`}
        >
          {STATES.map((state) => (
            <DemoRow key={state} label={state}>
              <Sample mode={mode} ticks={ticks} state={state} />
            </DemoRow>
          ))}
        </DemoBlock>
      )),
    )}

    <DemoBlock title="머리 값 — Field 머리 오른쪽(16 / 22 · 700 · 고정폭 숫자)">
      <DemoRow label="enabled">
        <HeaderValueSample disabled={false} />
      </DemoRow>
      <DemoRow label="disabled">
        <HeaderValueSample disabled />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="Field 안 — 예산 알림 임계값(손을 뗄 때 한 번 저장) · 별점(폼의 값) · 범위 · 막힘">
      <DemoRow label="임계값">
        <ThresholdExample />
      </DemoRow>
      <DemoRow label="별점 1 ~ 5">
        <ScoreExample />
      </DemoRow>
      <DemoRow label="범위">
        <RangeExample />
      </DemoRow>
      <DemoRow label="막힘(Field)">
        <ScoreExample disabled />
      </DemoRow>
    </DemoBlock>
  </div>
);
