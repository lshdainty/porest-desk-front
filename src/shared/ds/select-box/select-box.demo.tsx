import { Fragment, useState } from "react";
import { Braces, FileText, Palette, Sheet } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";
import { Input } from "@/shared/ds/input";

import {
  CheckSelectBox,
  CheckSelectBoxGroup,
  RadioSelectBox,
  RadioSelectBoxGroup,
} from "./select-box";

const LAYOUTS = ["horizontal", "vertical"] as const;
const SELECTED = ["unselected", "selected"] as const;
// 검사기가 올리고 · 누르고 · 키보드 포커스를 주는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "focused",
  "pressed",
  "disabled",
] as const;
type Layout = (typeof LAYOUTS)[number];
type Selected = (typeof SELECTED)[number];
type State = (typeof STATES)[number];
const KINDS = ["radio", "check"] as const;
type Kind = (typeof KINDS)[number];

// ── 견본 — 틀(div)이 견본의 첫 요소다. 묶음에 상자 하나(상자가 틀 가운데라 검사기가 올리고 · 누른다). 키보드 포커스는 틀에 주면
// 컨트롤로 넘긴다(Tab 으로 들어올 때와 같다). 묶음 사이(group.gap)는 묶음의 row-gap 으로 잰다 — 상자가 하나여도 값은 있다.
// 세로형은 열 수가 아니라 상자의 layout 으로 정한다(1열 묶음 — 상자가 틀 폭을 채워 가운데가 상자다)
function Sample({
  layout,
  selected,
  state,
  kind,
}: {
  layout: Layout;
  selected: Selected;
  state: State;
  kind: Kind;
}) {
  const disabled = state === "disabled";
  const checked = selected === "selected";
  const props = {
    layout,
    label: "횟수 지정",
    description: "정한 횟수만큼 반복",
    prefix: <Palette />,
    disabled,
    footer: <Input aria-label="반복 횟수" defaultValue={12} />,
  };
  return (
    <Specimen spec="select-box" combo={{ layout, selected }} state={state}>
      <div
        className="w-[360px]"
        tabIndex={state === "focused" ? -1 : undefined}
        onFocus={(e) => {
          if (state === "focused" && e.target === e.currentTarget)
            e.currentTarget
              .querySelector<HTMLElement>("[data-select-box-control]")
              ?.focus({ preventScroll: true });
        }}
      >
        {kind === "radio" ? (
          <RadioSelectBoxGroup
            aria-label={`${layout} · ${selected} · ${state}`}
            defaultValue={checked ? "count" : undefined}
          >
            <RadioSelectBox value="count" {...props} />
          </RadioSelectBoxGroup>
        ) : (
          <CheckSelectBoxGroup
            aria-label={`${layout} · ${selected} · ${state}`}
          >
            <CheckSelectBox defaultChecked={checked} {...props} />
          </CheckSelectBoxGroup>
        )}
      </div>
    </Specimen>
  );
}

// ── 직접 눌러 보는 견본 ───────────────────────────────────────
function TryRadio() {
  const [end, setEnd] = useState("none");
  const [count, setCount] = useState(12);
  return (
    <div className="w-[360px]">
      <Field
        label="종료"
        description="화살표로 옮기며 고르고, Tab 은 고른 상자로 들어와요."
      >
        <RadioSelectBoxGroup value={end} onValueChange={setEnd}>
          <RadioSelectBox
            value="none"
            label="무기한"
            description="중지할 때까지 계속 반복"
          />
          <RadioSelectBox
            value="count"
            label="횟수 지정"
            description="정한 횟수만큼 반복"
            footer={
              <Input
                aria-label="반복 횟수"
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            }
          />
          <RadioSelectBox
            value="date"
            label="종료일 지정"
            description="정한 날까지 반복"
          />
        </RadioSelectBoxGroup>
      </Field>
    </div>
  );
}

const ROLES = [
  {
    code: "ADMIN",
    name: "관리자",
    description:
      "관리자 권한으로 시스템 운영에 필요한 전체 권한이 부여되어 있습니다.",
  },
  {
    code: "USER",
    name: "일반 사용자",
    description:
      "일반 사용자 권한으로 시스템 관리에 필요한 권한을 제외한 일반적인 읽기, 쓰기 권한이 부여되어 있습니다.",
  },
  {
    code: "APPROVER",
    name: "승인권자",
    description:
      "휴가 신청 항목에 대해 승인/반려를 할 수 있는 권한이 부여되어 있습니다.",
  },
];

// 여럿 고르고 저장 — 고르기만 하고 반영은 버튼(바뀐 것이 없으면 막힌다)
function TryRoles() {
  const [saved, setSaved] = useState<string[]>(["USER", "APPROVER"]);
  const [picked, setPicked] = useState<string[]>(saved);
  const added = picked.filter((c) => !saved.includes(c)).length;
  const removed = saved.filter((c) => !picked.includes(c)).length;
  const toggle = (code: string, on: boolean) =>
    setPicked((list) =>
      on ? [...list, code] : list.filter((c) => c !== code),
    );
  return (
    <div className="flex w-[360px] flex-col gap-x4">
      <Field
        label="역할"
        description="여럿 고를 수 있어요. 저장을 눌러야 바뀌어요."
      >
        <CheckSelectBoxGroup>
          {ROLES.map((r) => (
            <CheckSelectBox
              key={r.code}
              label={r.name}
              description={r.description}
              checked={picked.includes(r.code)}
              onCheckedChange={(on) => toggle(r.code, on)}
            />
          ))}
        </CheckSelectBoxGroup>
      </Field>
      <div className="flex items-center justify-end gap-x3">
        <span className="text-t4 text-fg-neutral-subtle">
          {added + removed > 0
            ? `더함 ${added} · 뺌 ${removed} — 아직 저장 안 됨`
            : "바뀐 것 없음"}
        </span>
        <Button
          disabled={added + removed === 0}
          onClick={() => setSaved(picked)}
        >
          저장
        </Button>
      </div>
    </div>
  );
}

function TryColumns() {
  return (
    <div className="w-[360px]">
      <Field label="파일 형식">
        <RadioSelectBoxGroup columns={3} defaultValue="csv">
          <RadioSelectBox
            value="csv"
            control="none"
            prefix={<FileText />}
            label="CSV"
            description="구글시트"
          />
          <RadioSelectBox
            value="xlsx"
            control="none"
            prefix={<Sheet />}
            label="Excel"
            description="엑셀"
          />
          <RadioSelectBox
            value="json"
            control="none"
            prefix={<Braces />}
            label="JSON"
            description="백업용"
          />
        </RadioSelectBoxGroup>
      </Field>
    </div>
  );
}

function TryTwoColumns() {
  return (
    <div className="w-[360px]">
      <Field
        label="분배 방식"
        description="2열은 상자 높이를 가장 긴 상자에 맞춰요."
      >
        <RadioSelectBoxGroup columns={2} defaultValue="equal">
          <RadioSelectBox
            value="equal"
            prefix={<Palette />}
            label="균등 분배"
            description="모두 같은 금액"
          />
          <RadioSelectBox
            value="ratio"
            prefix={<Palette />}
            label="비율로 나누기"
            description="사람마다 비율을 정해 합계가 100% 가 되게 나눠요"
          />
          <RadioSelectBox
            value="amount"
            prefix={<Palette />}
            label="금액 직접 입력"
            description="사람마다 낸 금액을 직접 적어요"
          />
          <RadioSelectBox
            value="item"
            prefix={<Palette />}
            label="항목별"
            description="항목마다 낸 사람을 골라요"
          />
        </RadioSelectBoxGroup>
      </Field>
    </div>
  );
}

function TryStates() {
  return (
    <div className="flex w-[360px] flex-col gap-x6">
      <Field label="가변 부여 여부">
        <RadioSelectBoxGroup defaultValue="fixed" disabled>
          <RadioSelectBox
            value="fixed"
            label="고정 시간"
            description="정책에 등록된 부여 시간을 사용합니다."
          />
          <RadioSelectBox
            value="flex"
            label="가변 시간"
            description="사용자 또는 관리자가 입력한 시간 값으로 부여합니다."
          />
        </RadioSelectBoxGroup>
      </Field>
      <Field label="권한" invalid errorMessage="권한을 하나 이상 골라주세요.">
        <CheckSelectBoxGroup>
          <CheckSelectBox
            label="휴가 조회"
            description="본인 휴가 내역을 조회할 수 있는 권한입니다."
          />
          <CheckSelectBox
            label="휴가 신청"
            description="OT, 경조 휴가 등 휴가를 신청할 수 있는 권한입니다."
          />
        </CheckSelectBoxGroup>
      </Field>
    </div>
  );
}

// 가장 나쁜 값 — 긴 선택지 이름 · 설명(두 줄을 넘는다), 선택지 20개, 좁은 폭 240 의 3열
const LONG =
  "주식회사 포레스트 디자인 시스템 운영팀 서울 본사 3층 공용 회의실 예약 정산용 법인카드";
function TryWorst() {
  return (
    <div className="flex w-[240px] flex-col gap-x6">
      <Field label="긴 이름 · 설명 — 폭 240">
        <RadioSelectBoxGroup defaultValue="long">
          <RadioSelectBox
            value="long"
            prefix={<Palette />}
            label={LONG}
            description="설명도 아주 길어서 두 줄을 넘기면 줄바꿈으로 상자가 늘어나요. 선택지를 빠르게 견주는 자리라 설명은 두 줄까지만 쓰는 것이 좋아요."
            footer={<Input aria-label="메모" defaultValue="딸린 입력" />}
          />
          <RadioSelectBox value="short" label="짧은 이름" />
        </RadioSelectBoxGroup>
      </Field>
      <Field label="3열 — 폭 240">
        <RadioSelectBoxGroup columns={3} defaultValue="a">
          {["가", "나", "다", "라", "마", "바"].map((x) => (
            <RadioSelectBox
              key={x}
              value={x}
              control="none"
              label={`${x} 선택지`}
              description={x === "가" ? "설명이 있는 상자" : undefined}
            />
          ))}
        </RadioSelectBoxGroup>
      </Field>
    </div>
  );
}

function TryMany() {
  return (
    <div className="w-[360px]">
      <Field label="선택지 20개">
        <CheckSelectBoxGroup>
          {Array.from({ length: 20 }, (_, i) => (
            <CheckSelectBox
              key={i}
              label={`${i + 1}번째 선택지`}
              description="상자를 쌓는다 — 검색 시트 · 팝오버를 두지 않는다"
              defaultChecked={i % 7 === 0}
            />
          ))}
        </CheckSelectBoxGroup>
      </Field>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 배치 × 고름 × 상태(하나 · 여럿), 컨트롤 · 열 수 · 펼침 · 묶음, 직접 눌러 보기 */
export const SelectBoxDemo = () => (
  <div className="flex flex-col gap-x8">
    {KINDS.map((kind) => (
      <DemoBlock
        key={kind}
        title={`${kind === "radio" ? "하나 고르기(라디오)" : "여럿 고르기(칸 없는 체크)"} — 배치 × 고름 × 상태. 테두리 1px → 고르면 2px 짙게, 호버 · 누름은 바탕, 포커스는 바깥 링`}
      >
        {LAYOUTS.map((layout) => (
          <Fragment key={layout}>
            {SELECTED.map((selected) => (
              <DemoRow key={selected} label={`${layout} · ${selected}`}>
                {STATES.map((state) => (
                  <Sample
                    key={state}
                    layout={layout}
                    selected={selected}
                    state={state}
                    kind={kind}
                  />
                ))}
              </DemoRow>
            ))}
          </Fragment>
        ))}
      </DemoBlock>
    ))}
    <DemoBlock title="직접 눌러 보기 — 하나 고르기: ← ↑ ↓ → · Tab 은 고른 상자로 · Space · Enter 는 폼 제출. 여럿: 상자마다 Tab · Space">
      <DemoRow label="하나 · 펼침">
        <TryRadio />
      </DemoRow>
      <DemoRow label="여럿 · 저장">
        <TryRoles />
      </DemoRow>
      <DemoRow label="3열 · 컨트롤 없음">
        <TryColumns />
      </DemoRow>
      <DemoRow label="2열 · 같은 높이">
        <TryTwoColumns />
      </DemoRow>
      <DemoRow label="막힘 · 오류">
        <TryStates />
      </DemoRow>
    </DemoBlock>
    <DemoBlock title="가장 나쁜 값 — 긴 이름 · 설명, 좁은 폭 3열, 선택지 20개">
      <DemoRow label="폭 240">
        <TryWorst />
      </DemoRow>
      <DemoRow label="20개">
        <TryMany />
      </DemoRow>
    </DemoBlock>
  </div>
);
