import { Fragment, useState, type FocusEvent, type FormEvent } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { Checkbox, CheckboxGroup, Checkmark } from "./checkbox";

const SIZES = ["medium", "large"] as const;
const SHAPES = ["square", "ghost"] as const;
const TONES = ["neutral", "brand"] as const;
const WEIGHTS = ["regular", "bold"] as const;
const CHECKED = ["unchecked", "checked", "indeterminate"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

type Checked = (typeof CHECKED)[number];
type State = (typeof STATES)[number];
type Combo = {
  size: (typeof SIZES)[number];
  shape: (typeof SHAPES)[number];
  tone: (typeof TONES)[number];
  weight: (typeof WEIGHTS)[number];
  checked: Checked;
};

const CHECKED_STATE: Record<Checked, CheckedState> = {
  unchecked: false,
  checked: true,
  indeterminate: "indeterminate",
};
const checkedOf = (state: CheckedState): Checked =>
  state === "indeterminate" ? state : state ? "checked" : "unchecked";

// 견본은 묶음(CheckboxGroup)에 한 줄이다 — 묶음 줄 사이(group.gap)까지 같은 견본에서 잰다. 검사기는 묶음 가운데를
// 올리고 · 누른다(가운데가 줄이다). 키보드 포커스는 묶음(div)에 주는데 묶음은 초점을 받지 않으므로, 포커스 견본에서만
// 칸으로 넘긴다(input 데모의 passFocus 와 같은 방법 — 컴포넌트는 그대로다)
const passFocus = {
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget
      .querySelector<HTMLElement>("[role=checkbox]")
      ?.focus({ preventScroll: true });
  },
};

const Sample = ({ combo, state }: { combo: Combo; state: State }) => (
  <Specimen spec="checkbox" combo={combo} state={state}>
    <CheckboxGroup
      aria-label={`${combo.size} · ${combo.shape} · ${combo.tone} · ${combo.weight} · ${combo.checked} · ${state}`}
      {...(state === "focused" ? passFocus : {})}
    >
      <Checkbox
        size={combo.size}
        shape={combo.shape}
        tone={combo.tone}
        weight={combo.weight}
        defaultChecked={CHECKED_STATE[combo.checked]}
        disabled={state === "disabled"}
        label={state}
      />
    </CheckboxGroup>
  </Specimen>
);

// ── Field 안의 묶음 — 스펙의 데이터 내보내기(부모 "전체" + 자식) ─────────────────
const EXPORT_ITEMS = [
  { value: "tx", label: "거래 내역" },
  { value: "budget", label: "예산" },
  { value: "memo", label: "메모" },
  { value: "todo", label: "할 일" },
] as const;
const ALL = EXPORT_ITEMS.map((item) => item.value as string);

// 부모는 자식에서 정한다 — 모두면 선택, 일부면 일부 선택(가로줄), 없으면 선택 안 됨. 부모를 누르면 모두 ↔ 없음.
// 견본은 첫 줄(부모)을 잰다 — 고를 때마다 조합도 따라 바뀐다
const ExportGroup = ({
  picked,
  onPickedChange,
}: {
  picked: string[];
  onPickedChange: (next: string[]) => void;
}) => {
  const parent: CheckedState =
    picked.length === ALL.length
      ? true
      : picked.length > 0
        ? "indeterminate"
        : false;
  return (
    <Specimen
      spec="checkbox"
      combo={{ weight: "bold", checked: checkedOf(parent) }}
    >
      <CheckboxGroup>
        <Checkbox
          weight="bold"
          label="전체"
          checked={parent}
          onCheckedChange={(on) => onPickedChange(on === true ? [...ALL] : [])}
        />
        {EXPORT_ITEMS.map((item) => (
          <Checkbox
            key={item.value}
            label={item.label}
            checked={picked.includes(item.value)}
            onCheckedChange={(on) =>
              onPickedChange(
                on === true
                  ? [...picked, item.value]
                  : picked.filter((v) => v !== item.value),
              )
            }
          />
        ))}
      </CheckboxGroup>
    </Specimen>
  );
};

const ExportWithDescription = () => {
  const [picked, setPicked] = useState<string[]>(["tx"]);
  return (
    <Field
      label="내보낼 데이터"
      description="고른 데이터만 한 파일로 내보내요."
    >
      <ExportGroup picked={picked} onPickedChange={setPicked} />
    </Field>
  );
};

// 오류는 내보내기를 누를 때 본다(누르는 동안 띄우지 않는다) — 한 번 누른 뒤의 모습으로 시작하고, 고르면 걷힌다
const ExportWithError = () => {
  const [picked, setPicked] = useState<string[]>([]);
  const [invalid, setInvalid] = useState(true);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInvalid(picked.length === 0);
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-x4">
      <Field
        label="내보낼 데이터"
        invalid={invalid}
        errorMessage="내보낼 데이터를 하나 이상 골라 주세요."
      >
        <ExportGroup
          picked={picked}
          onPickedChange={(next) => {
            setPicked(next);
            if (next.length > 0) setInvalid(false);
          }}
        />
      </Field>
      <Button
        type="submit"
        variant="neutralSolid"
        size="medium"
        className="self-start"
      >
        내보내기
      </Button>
    </form>
  );
};

// 가벼운 보기 옵션 — 필수가 아니고 셋 이하면 Ghost(checkbox.md 의 모양 고르기)
const ViewOptions = () => {
  const [hidePast, setHidePast] = useState<CheckedState>(true);
  const [hideAmount, setHideAmount] = useState<CheckedState>(false);
  return (
    <Field label="보기">
      <Specimen
        spec="checkbox"
        combo={{ shape: "ghost", checked: checkedOf(hidePast) }}
      >
        <CheckboxGroup>
          <Checkbox
            shape="ghost"
            label="지난 달 거래 숨기기"
            checked={hidePast}
            onCheckedChange={setHidePast}
          />
          <Checkbox
            shape="ghost"
            label="금액 가리기"
            checked={hideAmount}
            onCheckedChange={setHideAmount}
          />
        </CheckboxGroup>
      </Specimen>
    </Field>
  );
};

// ── 칸만(Checkmark) — 표처럼 행을 따로 짤 때. 행 전체가 <label> 이라 행 어디를 눌러도 고르고, group/checkbox 로 칸이 반응한다
const PAYMENTS = [
  { id: "salary", date: "9월 25일", name: "월급", amount: "+3,200,000원" },
  { id: "lunch", date: "9월 25일", name: "점심 식사", amount: "-12,000원" },
  { id: "bus", date: "9월 26일", name: "버스", amount: "-1,500원" },
] as const;

const PaymentRows = () => {
  const [selected, setSelected] = useState<string[]>(["salary", "bus"]);
  return (
    <div className="flex w-full max-w-[360px] flex-col">
      {PAYMENTS.map((row) => (
        <label
          key={row.id}
          className="group/checkbox flex cursor-pointer items-center gap-x3 px-x6 py-x3"
        >
          <Checkmark
            checked={selected.includes(row.id)}
            onCheckedChange={(on) =>
              setSelected((prev) =>
                on === true
                  ? [...prev, row.id]
                  : prev.filter((id) => id !== row.id),
              )
            }
            aria-label={`${row.date} ${row.name} 선택`}
          />
          <span className="flex-1 text-t5 text-fg-neutral">{row.name}</span>
          <span className="text-t5 font-bold tabular-nums text-fg-neutral">
            {row.amount}
          </span>
        </label>
      ))}
    </div>
  );
};

/** 카탈로그(/dev/ds) — 크기 × 모양 × 톤 × 굵기 × 체크 × 상태, Field 안의 묶음(라벨 · 설명 · 오류), 묶음 없는 한 줄, 칸만(Checkmark) */
export const CheckboxDemo = () => (
  <div className="flex flex-col gap-x8">
    {SHAPES.map((shape) =>
      TONES.map((tone) => (
        <DemoBlock
          key={`${shape}-${tone}`}
          title={`${shape} · ${tone} — 크기 × 굵기 × 체크 × 상태. 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다)`}
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
                        combo={{ size, shape, tone, weight, checked }}
                        state={state}
                      />
                    ))}
                  </DemoRow>
                ))}
              </Fragment>
            )),
          )}
        </DemoBlock>
      )),
    )}

    <DemoBlock title="Field 안의 묶음 — 라벨은 묶음의 이름, 설명 · 오류는 묶음의 설명. 오류는 칸을 바꾸지 않고 묶음 아래 글로 알린다(직접 눌러 본다)">
      <DemoRow label="설명">
        <div className="w-full max-w-[320px]">
          <ExportWithDescription />
        </div>
      </DemoRow>
      <DemoRow label="오류">
        <div className="w-full max-w-[320px]">
          <ExportWithError />
        </div>
      </DemoRow>
      <DemoRow label="ghost">
        <div className="w-full max-w-[320px]">
          <ViewOptions />
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="묶음 없이 한 줄 — 기본 · 비활성(checkbox.md 코드). 묶음 밖에서도 줄은 칸 + 라벨만큼만 차지한다">
      <DemoRow label="한 줄">
        <Checkbox label="단종된 카드도 보기" />
        <Checkbox disabled label="이 카드 기억하기" />
        <Checkbox disabled defaultChecked label="이 카드 기억하기" />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="칸만(Checkmark) — 표처럼 행을 따로 짤 때. 행 전체가 누르는 영역이고 칸의 이름은 aria-label">
      <DemoRow label="Checkmark">
        <PaymentRows />
      </DemoRow>
    </DemoBlock>
  </div>
);
