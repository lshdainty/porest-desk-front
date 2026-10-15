import { useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { QuantityPicker } from "./quantity-picker";

type Size = "small" | "medium" | "large";
type Edge = "none" | "min" | "max";
type State =
  | "enabled"
  | "hovered"
  | "pressed"
  | "focused"
  | "loading"
  | "invalid"
  | "disabled";

const SIZES: Size[] = ["small", "medium", "large"];
const STATES: State[] = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "loading",
  "invalid",
  "disabled",
];
// 끝 견본은 막힌 버튼(최소 → 줄이기, 최대 → 늘리기)을 올리고 누른다. 로딩 · 오류는 끝과 겹치지 않는다
const EDGE_STATES: State[] = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
];
const BUTTON_PX: Record<Size, number> = { small: 36, medium: 40, large: 52 };
// 0 ~ 3 — 가운데 값 2 는 어느 끝도 아니고, 끝은 min 0 · max 3
const RANGE = { min: 0, max: 3 } as const;
const VALUE_AT: Record<Edge, number> = { none: 2, min: 0, max: 3 };

const unit = (v: number) => `${v}회`;

// 검사기는 견본의 첫 요소 가운데를 올리고 · 누르고 · 초점을 준다. 컨트롤 가운데는 누르지 못하는 값 칸이라, 틀을 버튼 하나 크기로
// 좁혀 컨트롤이 틀 밖으로 넘치게 둔다 — 틀의 가운데가 곧 시험할 버튼이다. 그 버튼에 data-probe(normal · blocked)를 단다
// (quantity-picker.measure.mjs 머리). 틀은 초점을 받아 시험 버튼으로 넘긴다
const Probe = ({
  size,
  target,
  blocked,
  children,
}: {
  size: Size;
  target: "decrement" | "increment";
  blocked: boolean;
  children: React.ReactNode;
}) => (
  <div
    tabIndex={-1}
    className="relative shrink-0"
    style={{
      width: BUTTON_PX[size],
      height: BUTTON_PX[size],
      // 컨트롤이 틀 밖으로 넘치는 만큼 자리를 비워 둔다(이웃 견본과 겹치지 않게)
      marginRight: target === "decrement" ? 112 : 0,
      marginLeft: target === "increment" ? 112 : 0,
    }}
    ref={(frame) => {
      const button = frame?.querySelector<HTMLElement>(
        `[data-slot=quantity-picker-${target}]`,
      );
      if (!frame || !button) return;
      button.dataset.probe = blocked ? "blocked" : "normal";
      frame.onfocus = (e) => {
        if (e.target === frame) button.focus({ preventScroll: true });
      };
    }}
  >
    <div
      className={
        target === "decrement"
          ? "absolute left-0 top-0"
          : "absolute right-0 top-0"
      }
    >
      {children}
    </div>
  </div>
);

const Sample = ({
  size,
  edge = "none",
  removable = false,
  state = "enabled",
  caption,
}: {
  size: Size;
  edge?: Edge;
  removable?: boolean;
  state?: State;
  caption: string;
}) => {
  const [value, setValue] = useState(VALUE_AT[edge]);
  // 끝에서는 막힌 버튼을 시험한다. 지우기는 최소의 줄이기 자리가 시험 버튼이다
  const target = edge === "max" ? "increment" : "decrement";
  const blocked = edge !== "none";
  const common = {
    size,
    ...RANGE,
    value,
    onValueChange: setValue,
    getValueText: unit,
    "aria-label": "승인 필요 횟수",
    loading: state === "loading",
    invalid: state === "invalid",
    disabled: state === "disabled",
  };
  return (
    <div className="flex flex-col gap-x1">
      <Specimen
        spec="quantity-picker"
        combo={{
          size,
          edge,
          removable: removable ? "on" : "off",
        }}
        state={state}
      >
        <Probe size={size} target={target} blocked={blocked}>
          {removable ? (
            <QuantityPicker
              {...common}
              removable
              onRemove={() => {}}
              removeAriaLabel="점심 도시락 지우기"
            />
          ) : (
            <QuantityPicker {...common} />
          )}
        </Probe>
      </Specimen>
      <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
    </div>
  );
};

// 폼 안 — Field 가 라벨 · 설명 · 오류를 대 준다
const FieldExample = (props: { readOnly?: boolean }) => {
  const [value, setValue] = useState(0);
  return (
    <div className="w-[280px]">
      <Field label="승인 필요 횟수" description="0 이면 승인 없이 바로 써요.">
        <QuantityPicker
          {...RANGE}
          value={value}
          onValueChange={setValue}
          getValueText={unit}
          name="approvalCount"
          {...props}
        />
      </Field>
    </div>
  );
};

// 범위가 데이터로 바뀌어 지금 값(3)이 밖이 됐다 — 값을 고치지 않고 invalid + Field 오류로 알린다
const OutOfRange = () => (
  <div className="w-[280px]">
    <Field
      label="승인 필요 횟수"
      description="0 이면 승인 없이 바로 써요."
      invalid
      errorMessage="승인자는 2명이에요. 횟수를 2회 이하로 줄여주세요."
    >
      <QuantityPicker min={0} max={2} defaultValue={3} getValueText={unit} />
    </Field>
  </div>
);

// 서버에 바로 반영하는 수량 — 누른 쪽만 기다린다
const ServerExample = () => {
  const [count, setCount] = useState(2);
  const [pending, setPending] = useState<"decrement" | "increment" | null>(
    null,
  );
  const change = (next: number) => {
    setPending(next > count ? "increment" : "decrement");
    window.setTimeout(() => {
      setCount(next);
      setPending(null);
    }, 1200);
  };
  return (
    <QuantityPicker
      min={1}
      max={9}
      value={count}
      onValueChange={change}
      getValueText={(v) => `${v}개`}
      loading={{
        decrement: pending === "decrement",
        increment: pending === "increment",
      }}
      removable
      onRemove={() => setCount(1)}
      removeAriaLabel="점심 도시락 지우기"
      aria-label="수량"
    />
  );
};

/** 카탈로그(/dev/ds) — 크기 × 상태, 끝(최소 · 최대) × 상태, 지우기, 폭(fill), 가장 나쁜 값 */
export const QuantityPickerDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 상태 — 값 2(0 ~ 3). 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다). 컨트롤은 견본 틀 밖으로 넘친다">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {STATES.map((state) => (
            <Sample key={state} size={size} state={state} caption={state} />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="끝 — 최소 0 은 줄이기, 최대 3 은 늘리기가 막힌 모습(aria-disabled — 초점이 남는다). 올려도 눌러도 바탕이 생기지 않는다">
      {(["min", "max"] as const).map((edge) => (
        <DemoRow key={edge} label={edge === "min" ? "최소 0" : "최대 3"}>
          {EDGE_STATES.map((state) => (
            <Sample
              key={state}
              size="medium"
              edge={edge}
              state={state}
              caption={state}
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="지우기(removable) — 최소에서 줄이기 자리가 휴지통 · 이름 '점심 도시락 지우기'. 막히지 않는다">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {(["enabled", "hovered", "pressed", "disabled"] as const).map(
            (state) => (
              <Sample
                key={state}
                size={size}
                edge="min"
                removable
                state={state}
                caption={state}
              />
            ),
          )}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="폭 — fill 은 부모 Flex 의 남은 폭(늘어나는 것은 값 칸뿐), hug 는 가장 긴 값의 폭">
      <DemoRow label="fill · large">
        <Specimen
          spec="quantity-picker"
          combo={{ size: "large", layout: "fill" }}
        >
          <div className="flex w-[320px]">
            <QuantityPicker
              size="large"
              layout="fill"
              {...RANGE}
              defaultValue={1}
              getValueText={unit}
              aria-label="승인 필요 횟수"
            />
          </div>
        </Specimen>
      </DemoRow>
      <DemoRow label="hug · 99회">
        <QuantityPicker
          size="large"
          min={0}
          max={99}
          defaultValue={1}
          getValueText={unit}
          aria-label="횟수"
        />
        <QuantityPicker
          size="small"
          min={0}
          max={24}
          defaultValue={8}
          getValueText={(v) => `${v}h`}
          aria-label="소요시간"
        />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="Field 안 — 라벨이 묶음의 이름, 설명 · 오류가 묶음의 설명. Field 의 막힘 · 읽기 전용 · 오류를 받는다">
      <DemoRow label="기본">
        <FieldExample />
      </DemoRow>
      <DemoRow label="읽기 전용">
        <FieldExample readOnly />
      </DemoRow>
      <DemoRow label="범위 밖(오류)">
        <OutOfRange />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="서버에 바로 반영 · 지우기 — 누른 쪽 버튼만 기다린다(1.2초)">
      <DemoRow label="로딩 + 지우기">
        <ServerExample />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 아주 큰 수(max 없음) · 0 · 긴 단위 · 간격(step)">
      <DemoRow label="큰 수 · max 없음">
        <QuantityPicker
          defaultValue={9007199254740990}
          getValueText={(v) => `${v.toLocaleString("ko-KR")}회`}
          aria-label="큰 수"
        />
      </DemoRow>
      <DemoRow label="0 · 긴 단위">
        <QuantityPicker
          defaultValue={0}
          max={10}
          getValueText={(v) => `${v}명의 승인자`}
          aria-label="승인자"
        />
      </DemoRow>
      <DemoRow label="step 5">
        <QuantityPicker
          defaultValue={0}
          max={30}
          step={5}
          getValueText={(v) => `${v}분`}
          aria-label="분"
        />
      </DemoRow>
    </DemoBlock>
  </div>
);
