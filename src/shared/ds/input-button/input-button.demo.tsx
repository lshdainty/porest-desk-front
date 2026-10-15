import { useState } from "react";
import { CalendarDays, ChevronDown, Clock, Utensils } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
} from "@/shared/ds/bottom-sheet";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
} from "@/shared/ds/popover";
import { ListRadioGroup, ListRadioItem } from "@/shared/ds/list";

import { InputButton, type InputButtonProps } from "./input-button";
import { useInputButtonSurface } from "./use-input-button-surface";

// 크기는 정해 둔다 — 카탈로그는 1440 폭이라 responsive(기본)는 medium 으로만 그려진다(반응형은 맨 아래 직접 골라 보는 칸에서)
const SIZES = ["large", "medium"] as const;
// 검사기가 눌러서(pressed) · 탭해서(focused) 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "pressed",
  "focused",
  "invalid",
  "disabled",
  "readonly",
] as const;
type State = (typeof STATES)[number];
type Size = (typeof SIZES)[number];

// 검사기는 견본의 첫 요소(상자)에 초점을 준다 — 상자는 초점을 받지 않으므로 배경 층 버튼으로 넘긴다(textarea 데모와 같은 방법).
// 포커스 링은 키보드 포커스에만 보이므로, 검사기가 먼저 누른 Shift 뒤의 초점이 키보드 초점으로 읽힌다
function passFocus(box: HTMLDivElement | null) {
  if (!box) return;
  box.tabIndex = -1;
  box.onfocus = () =>
    box.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
}

/** 견본 하나 — 크기 · 상태를 InputButton 에 그대로 준다. 오류는 aria-invalid(Field 안이면 Field 의 invalid). 아래에 이름표 */
const Sample = ({
  size,
  state = "enabled",
  caption,
  ...props
}: {
  size: Size;
  state?: State;
  caption: string;
} & Omit<InputButtonProps, "size">) => (
  <div className="flex w-[240px] flex-col gap-x1">
    <Specimen spec="input-button" combo={{ size }} state={state}>
      <InputButton
        rootRef={state === "focused" ? passFocus : undefined}
        size={size}
        aria-invalid={state === "invalid" || undefined}
        disabled={state === "disabled"}
        readOnly={state === "readonly"}
        {...props}
      />
    </Specimen>
    <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
  </div>
);

const CATEGORIES = ["식비", "교통", "카페 · 간식", "쇼핑", "문화 · 여가"];

/**
 * 고르는 자리 — 폭으로 시트(1280 미만) · 팝오버(1280 이상)를 가른다. 목록은 누르면 바로 고르고 닫는다 · 날짜처럼 "완료" 로 넣는 것은
 * 고르는 동안 칸의 값이 바뀌지 않는다(draft). 직접 눌러 본다 — 창 폭을 바꾸면 여는 자리가 바뀐다.
 */
function Pick({ confirm }: { confirm: boolean }) {
  const surface = useInputButtonSurface();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const label = confirm ? "시각" : "카테고리";
  const trigger = (
    <InputButton
      placeholder={`${label} 선택`}
      value={value}
      prefixIcon={!confirm && value ? <Utensils /> : undefined}
      suffixIcon={confirm ? <Clock /> : <ChevronDown />}
      onClear={confirm ? undefined : () => setValue(undefined)}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setDraft(value);
        setOpen(true);
      }}
    />
  );
  const choose = (v: string) => {
    if (confirm) setDraft(v);
    else {
      setValue(v);
      setOpen(false);
    }
  };
  const list = (
    <ListRadioGroup
      aria-label={label}
      value={confirm ? draft : value}
      onValueChange={choose}
    >
      {CATEGORIES.map((c) => (
        <ListRadioItem key={c} value={c} title={c} />
      ))}
    </ListRadioGroup>
  );
  const done = (
    <Button
      disabled={!draft}
      onClick={() => {
        setValue(draft);
        setOpen(false);
      }}
    >
      완료
    </Button>
  );
  return (
    <div className="flex w-[300px] flex-col gap-x2">
      <Field label={label} indicator={confirm ? undefined : "선택"}>
        {surface === "sheet" ? (
          <BottomSheet open={open} onOpenChange={setOpen} container={place}>
            {trigger}
            <BottomSheetContent title={`${label} 선택`}>
              <BottomSheetBody className="px-0">{list}</BottomSheetBody>
              {confirm && <BottomSheetFooter>{done}</BottomSheetFooter>}
            </BottomSheetContent>
          </BottomSheet>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            {place && (
              <PopoverContent
                container={place}
                aria-label={`${label} 선택`}
                align="start"
              >
                <PopoverBody>{list}</PopoverBody>
                {confirm && <PopoverFooter>{done}</PopoverFooter>}
              </PopoverContent>
            )}
          </Popover>
        )}
      </Field>
      <div ref={setPlace} />
    </div>
  );
}

/** 카탈로그(/dev/ds) — 크기 × 상태, 값 · 붙이개 · 지우기, Field 안 · 여는 자리 */
export const InputButtonDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 상태 — 값이 있는 칸. 누름 · 포커스는 검사기가 실제로 눌러 잰다(포커스 링은 키보드 포커스에만)">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {STATES.map((state) => (
            <Sample
              key={state}
              size={size}
              state={state}
              caption={state}
              aria-label={`날짜 ${size} ${state}`}
              placeholder="날짜 선택"
              value="2026년 10월 1일 (목)"
              suffixIcon={<CalendarDays />}
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="빈 칸(placeholder) · 앞 아이콘 · 앞 · 뒤 글자 · 지우기 — 지우기는 값이 있을 때만(막히거나 읽기 전용이면 없다)">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          <Sample
            size={size}
            caption="빈 칸 — placeholder"
            aria-label={`날짜 ${size} 빈 칸`}
            placeholder="날짜 선택"
            suffixIcon={<CalendarDays />}
          />
          <Sample
            size={size}
            state="disabled"
            caption="disabled · 빈 칸"
            aria-label={`날짜 ${size} 빈 칸 비활성`}
            placeholder="날짜 선택"
            suffixIcon={<CalendarDays />}
          />
          <Sample
            size={size}
            caption="앞 아이콘 · 값"
            aria-label={`카테고리 ${size}`}
            value="식비 · 점심"
            prefixIcon={<Utensils />}
            suffixIcon={<ChevronDown />}
          />
          <Sample
            size={size}
            caption="앞 · 뒤 글자"
            aria-label={`나이 ${size}`}
            prefix="만"
            value="29"
            suffix="세"
            suffixIcon={<ChevronDown />}
          />
          <Sample
            size={size}
            caption="지우기"
            aria-label={`참조자 ${size}`}
            value="김하나"
            suffixIcon={<ChevronDown />}
            onClear={() => {}}
          />
          <Sample
            size={size}
            caption="긴 값 — 말줄임"
            aria-label={`참조자 ${size} 긴 값`}
            value="가나다라마바사아자차카타파하 가나다라마바사아자차카타파하 가나다라마바사아자차카타파하"
            suffixIcon={<ChevronDown />}
            onClear={() => {}}
          />
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="Field 안 — 라벨 · 설명 · 오류 · 읽기 전용. 라벨을 눌러도 열리지 않는다(포커스만)">
      <div className="flex flex-wrap items-start gap-x4">
        <div className="w-[260px]">
          <Field label="날짜" description="휴가를 시작하는 날이에요.">
            <InputButton
              placeholder="날짜 선택"
              suffixIcon={<CalendarDays />}
            />
          </Field>
        </div>
        <div className="w-[260px]">
          <Field label="날짜" invalid errorMessage="날짜를 골라주세요.">
            <InputButton
              placeholder="날짜 선택"
              suffixIcon={<CalendarDays />}
            />
          </Field>
        </div>
        <div className="w-[260px]">
          <Field label="입사일" readOnly>
            <InputButton
              value="2024년 3월 4일 (월)"
              suffixIcon={<CalendarDays />}
            />
          </Field>
        </div>
        <div className="w-[260px]">
          <Field label="날짜" disabled>
            <InputButton
              value="2026년 10월 1일 (목)"
              suffixIcon={<CalendarDays />}
            />
          </Field>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock title="직접 눌러 본다 — 1280 미만은 시트, 이상은 팝오버. 목록은 누르면 바로 고르고 닫힌다 · 시각은 고르는 동안 칸이 안 바뀌고 “완료” 로 넣는다">
      <div className="flex flex-wrap items-start gap-x6">
        <Pick confirm={false} />
        <Pick confirm />
      </div>
    </DemoBlock>
  </div>
);
