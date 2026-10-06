import { Fragment, useState, type FormEvent } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { Radio, RadioGroup, Radiomark } from "./radio-group";

const SIZES = ["medium", "large"] as const;
const TONES = ["neutral", "brand"] as const;
const WEIGHTS = ["regular", "bold"] as const;
const CHECKED = ["unchecked", "checked"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

type State = (typeof STATES)[number];
type Combo = {
  size: (typeof SIZES)[number];
  tone: (typeof TONES)[number];
  weight: (typeof WEIGHTS)[number];
  checked: (typeof CHECKED)[number];
};

// 견본은 묶음(RadioGroup)에 한 줄이다 — Radio 는 묶음 안에서만 서고, 묶음 줄 사이(group.gap)까지 같은 견본에서 잰다.
// 검사기는 묶음 가운데를 올리고 · 누른다(가운데가 줄이다). 키보드 포커스는 묶음에 주면 Radix 가 고른 선택지(없으면 첫
// 선택지)로 옮긴다 — Tab 으로 들어갈 때와 같다. 그래서 고른 것이 없는 묶음의 포커스는 안 고른 선택지에 선다
const Sample = ({ combo, state }: { combo: Combo; state: State }) => (
  <Specimen spec="radio-group" combo={combo} state={state}>
    <RadioGroup
      aria-label={`${combo.size} · ${combo.tone} · ${combo.weight} · ${combo.checked} · ${state}`}
      defaultValue={combo.checked === "checked" ? state : undefined}
    >
      <Radio
        value={state}
        size={combo.size}
        tone={combo.tone}
        weight={combo.weight}
        disabled={state === "disabled"}
        label={state}
      />
    </RadioGroup>
  </Specimen>
);

// ── Field 안의 묶음 — 스펙의 반복 선택지 ─────────────────────────────
const REPEAT = [
  { value: "none", label: "반복 없음" },
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
  { value: "yearly", label: "매년" },
] as const;
const FIRST = REPEAT[0].value;

// 견본은 첫 줄(반복 없음)을 잰다 — 값을 쥐고 있어 고를 때마다 조합도 따라 바뀐다
const RepeatGroup = ({
  value,
  onValueChange,
}: {
  value: string | undefined;
  onValueChange: (next: string) => void;
}) => (
  <Specimen
    spec="radio-group"
    combo={{ checked: value === FIRST ? "checked" : "unchecked" }}
  >
    <RadioGroup value={value ?? null} onValueChange={onValueChange}>
      {REPEAT.map((item) => (
        <Radio key={item.value} value={item.value} label={item.label} />
      ))}
    </RadioGroup>
  </Specimen>
);

// 처음부터 가장 흔한 것을 골라 둔다(radio-group.md 의 묶음 쓰기)
const RepeatWithDescription = () => {
  const [repeat, setRepeat] = useState<string>(FIRST);
  return (
    <Field label="반복" description="고른 주기로 일정을 다시 만들어요.">
      <RepeatGroup value={repeat} onValueChange={setRepeat} />
    </Field>
  );
};

// 골라 둘 수 없는 선택 — 오류는 저장을 누를 때 본다(누르는 동안 띄우지 않는다). 한 번 누른 뒤의 모습으로 시작하고, 고르면 걷힌다
const RepeatWithError = () => {
  const [repeat, setRepeat] = useState<string>();
  const [invalid, setInvalid] = useState(true);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInvalid(repeat === undefined);
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-x4">
      <Field label="반복" invalid={invalid} errorMessage="반복을 골라 주세요.">
        <RepeatGroup
          value={repeat}
          onValueChange={(next) => {
            setRepeat(next);
            setInvalid(false);
          }}
        />
      </Field>
      <Button
        type="submit"
        variant="neutralSolid"
        size="medium"
        className="self-start"
      >
        저장
      </Button>
    </form>
  );
};

// ── 동그라미만(Radiomark) — 라벨을 따로 짤 때. 줄 전체가 <label> 이라 줄 어디를 눌러도 고르고, group/radio 로 동그라미가 반응한다
const RadiomarkRows = () => (
  <RadioGroup
    defaultValue="none"
    aria-label="반복"
    className="w-full max-w-[360px]"
  >
    {REPEAT.slice(0, 3).map((item) => (
      <label
        key={item.value}
        className="group/radio flex cursor-pointer items-center gap-x3 px-x6 py-x3"
      >
        <span className="flex-1 text-t5 text-fg-neutral">{item.label}</span>
        <Radiomark value={item.value} />
      </label>
    ))}
  </RadioGroup>
);

/** 카탈로그(/dev/ds) — 크기 × 톤 × 굵기 × 선택 × 상태, Field 안의 묶음(라벨 · 설명 · 오류), 막힌 선택지 · 묶음, 동그라미만(Radiomark) */
export const RadioGroupDemo = () => (
  <div className="flex flex-col gap-x8">
    {TONES.map((tone) => (
      <DemoBlock
        key={tone}
        title={`${tone} — 크기 × 굵기 × 선택 × 상태. 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다)`}
      >
        {SIZES.map((size) =>
          WEIGHTS.map((weight) => (
            <Fragment key={`${size}-${weight}`}>
              {CHECKED.map((checked) => (
                <DemoRow
                  key={checked}
                  label={`${size} · ${weight} · ${checked}`}
                >
                  {STATES.map((state) => (
                    <Sample
                      key={state}
                      combo={{ size, tone, weight, checked }}
                      state={state}
                    />
                  ))}
                </DemoRow>
              ))}
            </Fragment>
          )),
        )}
      </DemoBlock>
    ))}

    <DemoBlock title="Field 안의 묶음 — 라벨은 묶음의 이름, 설명 · 오류는 묶음의 설명. 오류는 동그라미를 바꾸지 않고 묶음 아래 글로 알린다(직접 눌러 본다)">
      <DemoRow label="설명">
        <div className="w-full max-w-[320px]">
          <RepeatWithDescription />
        </div>
      </DemoRow>
      <DemoRow label="오류">
        <div className="w-full max-w-[320px]">
          <RepeatWithError />
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="막힘 — 선택지 하나만 막거나(골라 둔 채로도 막을 수 있다) 묶음째 막는다. 고른 선택지는 채운 원 그대로 색만 바뀐다">
      <DemoRow label="선택지 하나">
        <RadioGroup
          defaultValue="monthly"
          aria-label="반복 — 선택지 하나가 막힘"
        >
          <Radio value="none" label="반복 없음" />
          <Radio value="monthly" label="매월" />
          <Radio value="yearly" label="매년" disabled />
        </RadioGroup>
      </DemoRow>
      <DemoRow label="묶음 전체">
        <RadioGroup
          defaultValue="monthly"
          aria-label="반복 — 묶음 전체가 막힘"
          disabled
        >
          <Radio value="none" label="반복 없음" />
          <Radio value="monthly" label="매월" />
          <Radio value="yearly" label="매년" />
        </RadioGroup>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="동그라미만(Radiomark) — 라벨을 따로 짤 때. 줄 전체가 누르는 영역이고 줄의 글자가 동그라미의 이름">
      <DemoRow label="Radiomark">
        <RadiomarkRows />
      </DemoRow>
    </DemoBlock>
  </div>
);
