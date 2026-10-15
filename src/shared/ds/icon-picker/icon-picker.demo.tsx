import { useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { CATEGORY_ICONS, findCategoryIcon } from "./category-icons";
import { IconPicker, IconPickerCell, IconPickerPanel } from "./icon-picker";

const SURFACES = ["sheet", "popover"] as const;
const SELECTED = ["unselected", "selected"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태
const STATES = ["enabled", "hovered", "focused", "pressed"] as const;
type Surface = (typeof SURFACES)[number];
type Selected = (typeof SELECTED)[number];
type State = (typeof STATES)[number];

const FIRST = CATEGORY_ICONS[0]!;

// 검사기는 견본의 첫 요소(틀)에 초점을 준다 — 틀은 초점을 받지 않으므로 칸으로 넘긴다(input 데모와 같은 방법)
function passFocus(frame: HTMLDivElement | null) {
  if (!frame) return;
  frame.tabIndex = -1;
  frame.onfocus = () =>
    frame
      .querySelector<HTMLElement>("[role=option]")
      ?.focus({ preventScroll: true });
}

// 칸 하나 — 틀이 칸과 같은 48 이라 검사기가 올리고 누르는 틀 가운데가 칸 가운데다
const CellSample = ({
  selected,
  state,
}: {
  selected: Selected;
  state: State;
}) => (
  <Specimen
    spec="icon-picker"
    combo={{ selected, surface: "sheet" }}
    state={state}
  >
    <div ref={state === "focused" ? passFocus : undefined} className="size-12">
      <IconPickerCell
        icon={FIRST}
        selected={selected === "selected"}
        tabIndex={0}
        onSelect={() => undefined}
      />
    </div>
  </Specimen>
);

// 여는 자리 안 — 틀이 시트 본문(390) · 팝오버(408)의 폭이다. 고른 칸은 첫 칸(검사기가 첫 칸을 잰다)
const PanelSample = ({
  surface,
  selected,
  query: initial = "",
}: {
  surface: Surface;
  selected: Selected;
  query?: string;
}) => {
  const [query, setQuery] = useState(initial);
  const [picked, setPicked] = useState<string | null>(
    selected === "selected" ? FIRST.id : null,
  );
  return (
    <Specimen spec="icon-picker" combo={{ selected, surface }}>
      <div
        className={
          (surface === "sheet" ? "w-[390px]" : "w-[408px]") +
          " flex h-[480px] flex-col overflow-hidden rounded-r4 bg-bg-layer-floating"
        }
      >
        <IconPickerPanel
          surface={surface}
          selectedId={picked}
          query={query}
          onQueryChange={setQuery}
          onSelect={setPicked}
        />
      </div>
    </Specimen>
  );
};

// 트리거 — 열어 본다(1280 미만 시트 · 이상 팝오버). 새 카테고리는 태그로, 세트 밖 저장 값은 "지금 아이콘"
const TriggerExample = ({
  initial,
  disabled = false,
}: {
  initial: string | null;
  disabled?: boolean;
}) => {
  const [icon, setIcon] = useState<string | null>(initial);
  return (
    <div className="w-[240px]">
      <Field label="아이콘" disabled={disabled}>
        <IconPicker value={icon} onValueChange={setIcon} />
      </Field>
      <p className="mt-x2 text-t2 text-fg-neutral-subtle">
        저장 값: {icon === null ? "(없음)" : icon === "" ? '""' : icon}
        {findCategoryIcon(icon) ? "" : " — 세트 밖 또는 빈 값"}
      </p>
    </div>
  );
};

/** 카탈로그(/dev/ds) — 칸 상태 × 안 고름 · 고름, 여는 자리 안(시트 6열 · 팝오버 7열), 찾기(월세 · 유니콘), 트리거(눌러서 연다) */
export const IconPickerDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="칸 — 48 · 아이콘 24. 올림 · 누름은 바탕, 포커스는 바깥 링(키보드), 고른 칸은 안쪽 2px 짙은 테두리 + 선 2.5. 직접 올려 · 눌러 본다">
      {SELECTED.map((selected) => (
        <DemoRow key={selected} label={selected}>
          <div className="flex flex-wrap gap-x6">
            {STATES.map((state) => (
              <CellSample key={state} selected={selected} state={state} />
            ))}
          </div>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="여는 자리 안 — 시트 6열(폰) · 팝오버 7열(1280 이상), 묶음 머리 · 끝 흐림 · 스크롤. 고른 칸은 첫 칸">
      {SURFACES.map((surface) => (
        <DemoRow key={surface} label={surface}>
          <div className="flex flex-wrap gap-x6">
            {SELECTED.map((selected) => (
              <PanelSample
                key={selected}
                surface={surface}
                selected={selected}
              />
            ))}
          </div>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title='찾기 — 한국어 이름 · 찾는 말("월세" → 집 · "coffee" → 커피) · 0건은 Result Section'>
      <DemoRow label="월세">
        <div className="flex flex-wrap gap-x6">
          <PanelSample surface="sheet" selected="unselected" query="월세" />
        </div>
      </DemoRow>
      <DemoRow label="커피 · 원두">
        <div className="flex flex-wrap gap-x6">
          <PanelSample surface="popover" selected="unselected" query="커피" />
        </div>
      </DemoRow>
      <DemoRow label="유니콘 0건">
        <div className="flex flex-wrap gap-x6">
          <PanelSample surface="sheet" selected="unselected" query="유니콘" />
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title='트리거 — Input Button(지금 아이콘 + 이름). 눌러 열고, 고르면 바로 닫힌다. 빈 값은 태그, 세트 밖 저장 값은 "지금 아이콘"'>
      <DemoRow label="커피">
        <TriggerExample initial="coffee" />
      </DemoRow>
      <DemoRow label="새 카테고리">
        <TriggerExample initial="tag" />
      </DemoRow>
      <DemoRow label="세트 밖">
        <TriggerExample initial="a-arrow-down" />
      </DemoRow>
      <DemoRow label="막힘">
        <TriggerExample initial="coffee" disabled />
      </DemoRow>
    </DemoBlock>
  </div>
);
