import { Fragment, useState } from "react";
import {
  Banknote,
  CircleSlash,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import { Select, SelectGroup, SelectItem } from "./select";

const SIZES = ["large", "medium"] as const;
type Size = (typeof SIZES)[number];
const TRIGGER_STATES = [
  "enabled",
  "pressed",
  "focused",
  "invalid",
  "disabled",
  "readonly",
] as const;
type TriggerState = (typeof TRIGGER_STATES)[number];
const LIST_STATES = [
  "enabled",
  "open",
  "pressed",
  "selected",
  "disabled",
] as const;
type ListState = (typeof LIST_STATES)[number];

const PAY = [
  { value: "cash", label: "현금", icon: <Banknote /> },
  {
    value: "kb",
    label: "국민 주계좌",
    description: "123-45-6789",
    icon: <Landmark />,
  },
  { value: "hyundai", label: "현대카드 M", icon: <CreditCard /> },
  { value: "shinhan", label: "신한카드 Deep", icon: <CreditCard /> },
  { value: "wallet", label: "간편결제", icon: <Wallet /> },
] as const;

// 견본의 목록 안 — 첫 묶음(제목 없음)의 첫 선택지는 아이콘이 있고 설명이 없다(높이 46 · 39 를 잰다), 둘째 선택지는 설명이 있다.
// 둘째 묶음에는 제목이 있다(묶음 사이 선 · 제목). 막힌 견본은 모든 선택지가 막힌다
function PayItems({ disabled = false }: { disabled?: boolean }) {
  return (
    <>
      <SelectGroup>
        {PAY.slice(0, 3).map((p) => (
          <SelectItem
            key={p.value}
            value={p.value}
            label={p.label}
            description={"description" in p ? p.description : undefined}
            prefixIcon={p.icon}
            disabled={disabled}
          />
        ))}
      </SelectGroup>
      <SelectGroup label="그 밖">
        {PAY.slice(3).map((p) => (
          <SelectItem
            key={p.value}
            value={p.value}
            label={p.label}
            prefixIcon={p.icon}
            disabled={disabled}
          />
        ))}
      </SelectGroup>
    </>
  );
}

// ── 트리거 견본 — 틀(div)이 견본의 첫 요소다. 검사기가 틀을 올리고 · 누르므로 가운데가 트리거여야 한다.
// 키보드 포커스는 틀에 주면 트리거로 넘긴다(Tab 으로 들어올 때와 같다)
function TriggerSample({
  size,
  state,
  filled,
}: {
  size: Size;
  state: TriggerState;
  filled: boolean;
}) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  return (
    <Specimen spec="select" combo={{ size }} state={state}>
      <div
        className="w-[360px]"
        tabIndex={state === "focused" ? -1 : undefined}
        onFocus={(e) => {
          if (state === "focused" && e.target === e.currentTarget)
            trigger?.focus({ preventScroll: true });
        }}
      >
        <Select
          ref={setTrigger}
          size={size}
          aria-label={`${size} · ${state} · ${filled ? "값" : "placeholder"}`}
          placeholder="결제 수단 선택"
          prefixIcon={<CreditCard />}
          defaultValue={filled ? "hyundai" : ""}
          disabled={state === "disabled"}
          readOnly={state === "readonly"}
          aria-invalid={state === "invalid" ? true : undefined}
        >
          <PayItems />
        </Select>
      </div>
    </Specimen>
  );
}

// ── 목록 견본 — 열린 목록. 목록은 견본 안의 자리(container)로 띄운다 — body 에 뜨면 다크 판의 색을 받지 못하고 검사기가 견본
// 안에서 찾지 못한다. 틀의 높이는 트리거 + 8 + 목록 위 여백 8 + 첫 선택지의 절반의 두 배라 틀의 가운데가 첫 선택지다(검사기가
// 가운데를 눌러 선택지의 누름을 잰다). 뒤집기 · 밀기는 끈다 — 화면을 굴려도 목록이 이웃 견본을 덮지 않게.
// 제어하는 open 이라 바깥을 눌러도 닫히지 않는다
const LIST_FRAME: Record<Size, string> = {
  large: "h-[182px]",
  medium: "h-[151px]",
};

function ListSample({ size, state }: { size: Size; state: ListState }) {
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const disabled = state === "disabled";
  return (
    <div className="flex w-[360px] flex-col">
      <Specimen spec="select" combo={{ size }} state={state}>
        <div data-measure="list" className={LIST_FRAME[size]}>
          <Select
            open
            container={place}
            avoidCollisions={false}
            size={size}
            aria-label={`${size} · ${state} · 목록`}
            placeholder="결제 수단 선택"
            defaultValue={state === "selected" ? "kb" : disabled ? "cash" : ""}
          >
            <PayItems disabled={disabled} />
          </Select>
          <div ref={setPlace} />
        </div>
      </Specimen>
      <div className="h-[330px]" aria-hidden />
    </div>
  );
}

// ── 직접 눌러 보는 견본 ───────────────────────────────────────
const CURRENCIES = [
  ["KRW", "원"],
  ["USD", "미국 달러"],
  ["JPY", "일본 엔"],
  ["EUR", "유로"],
  ["CNY", "중국 위안"],
] as const;

function TryBasic() {
  const [value, setValue] = useState("");
  return (
    <div className="w-[320px]">
      <Field label="통화" description={value ? `고른 값 ${value}` : undefined}>
        <Select placeholder="통화 선택" value={value} onValueChange={setValue}>
          {CURRENCIES.map(([code, name]) => (
            <SelectItem
              key={code}
              value={code}
              label={name}
              description={code}
            />
          ))}
        </Select>
      </Field>
    </div>
  );
}

function TryNone() {
  const [value, setValue] = useState("");
  return (
    <div className="w-[320px]">
      <Field label="결제 수단">
        <Select
          placeholder="결제 수단 선택"
          value={value}
          onValueChange={setValue}
        >
          <SelectGroup>
            <SelectItem
              value="none"
              label="결제 수단 없음"
              prefixIcon={<CircleSlash />}
            />
          </SelectGroup>
          <SelectGroup label="카드 · 계좌">
            {PAY.map((p) => (
              <SelectItem
                key={p.value}
                value={p.value}
                label={p.label}
                prefixIcon={p.icon}
              />
            ))}
          </SelectGroup>
        </Select>
      </Field>
    </div>
  );
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function TryMultiple() {
  const [days, setDays] = useState<string[]>(["월", "수", "금"]);
  return (
    <div className="w-[320px]">
      <Field label="반복 요일" description="고른 요일마다 거래를 만들어요.">
        <Select
          multiple
          placeholder="요일 선택"
          value={days}
          onValueChange={setDays}
        >
          {DAYS.map((d) => (
            <SelectItem key={d} value={d} label={`${d}요일`} />
          ))}
        </Select>
      </Field>
    </div>
  );
}

function TryStates() {
  return (
    <div className="flex w-[320px] flex-col gap-x6">
      <Field label="휴가 정책" invalid errorMessage="휴가 정책을 골라주세요.">
        <Select placeholder="휴가 정책 선택">
          <SelectItem value="annual" label="연차" />
          <SelectItem value="sick" label="병가" />
        </Select>
      </Field>
      <Field label="통화" disabled>
        <Select defaultValue="KRW">
          <SelectItem value="KRW" label="원" />
        </Select>
      </Field>
      <Field label="부서" readOnly>
        <Select defaultValue="design">
          <SelectItem value="design" label="디자인팀" />
        </Select>
      </Field>
    </div>
  );
}

// 가장 나쁜 값 — 긴 선택지 이름(트리거는 한 줄 말줄임 · 목록은 줄바꿈), 선택지 20개(목록 안 스크롤), 좁은 폭(240)
const LONG =
  "주식회사 포레스트 디자인 시스템 운영팀 서울 본사 3층 공용 회의실 예약 정산용 법인카드";
function TryWorst() {
  const [value, setValue] = useState("long");
  const [many, setMany] = useState("n12");
  return (
    <div className="flex w-[240px] flex-col gap-x6">
      <Field label="긴 선택지 이름">
        <Select value={value} onValueChange={setValue}>
          <SelectItem
            value="long"
            label={LONG}
            description="설명도 아주 길면 목록 안에서 줄바꿈돼요 — 한 줄이라고 자르지 않아요"
          />
          <SelectItem value="short" label="짧은 이름" />
        </Select>
      </Field>
      <Field label="선택지 20개">
        <Select value={many} onValueChange={setMany}>
          {Array.from({ length: 20 }, (_, i) => (
            <SelectItem
              key={i}
              value={`n${i + 1}`}
              label={`${i + 1}번째 선택지`}
            />
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** 카탈로그(/dev/ds) — 크기 × 트리거 상태(값 · placeholder), 열린 목록 × 상태, 직접 열어 보기 */
export const SelectDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="트리거 — 크기 × 상태 × (고른 값 · placeholder). 트리거 52 · 40, 앞 아이콘 20 · 16, 셰브론 20 · 16">
      {SIZES.map((size) => (
        <Fragment key={size}>
          {[true, false].map((filled) => (
            <DemoRow
              key={String(filled)}
              label={`${size} · ${filled ? "고른 값" : "placeholder"}`}
            >
              {TRIGGER_STATES.map((state) => (
                <TriggerSample
                  key={state}
                  size={size}
                  state={state}
                  filled={filled}
                />
              ))}
            </DemoRow>
          ))}
        </Fragment>
      ))}
    </DemoBlock>
    <DemoBlock title="열린 목록 — 크기 × 상태(열림 · 누름 · 고름 · 막힘). 선택지 46 · 39, 알약 · 체크 · 묶음 제목 · 묶음 사이 선">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {LIST_STATES.map((state) => (
            <ListSample key={state} size={size} state={state} />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="직접 열어 보기 — 누르기 · ↓ ↑ Enter Space · 글자 키 · Esc · Tab. 폰 폭에서도 목록은 칸 아래에 붙는다">
      <DemoRow label="기본 · Field">
        <TryBasic />
      </DemoRow>
      <DemoRow label="없음 · 묶음 · 아이콘">
        <TryNone />
      </DemoRow>
      <DemoRow label="여럿 고르기">
        <TryMultiple />
      </DemoRow>
      <DemoRow label="오류 · 비활성 · 읽기 전용">
        <TryStates />
      </DemoRow>
      <DemoRow label="가장 나쁜 값 · 폭 240">
        <TryWorst />
      </DemoRow>
    </DemoBlock>
  </div>
);
