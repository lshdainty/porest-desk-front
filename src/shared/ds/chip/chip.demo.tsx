import { useState, type ReactNode } from "react";
import { ChevronDown, Plus, RotateCcw, Tag } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";

import {
  Chip,
  ChipGroup,
  ChipRadio,
  ChipRadioGroup,
  ChipToggle,
  InputChip,
} from "./chip";

const VARIANTS = ["solid", "outlineStrong", "outlineWeak"] as const;
const SIZES = ["small", "medium", "large"] as const;
const SELECTED = ["unselected", "selected"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

// 견본의 뿌리 — 칩 하나를 감싸는 inline-flex 상자. 검사기는 이 상자의 가운데를 올리고 · 누르고, 이 상자에 포커스를 주면
// 안의 첫 칩(입력값 칩은 지우기 버튼)이 받는다(검사기는 견본 뿌리에 포커스를 준다 — 뿌리가 칩이 아니라 선택자로 재기 때문)
const FOCUS_TARGET = "[data-slot=chip], [data-slot=input-chip-remove]";
const forwardFocus = (el: HTMLElement | null) => {
  if (el) {
    el.focus = (options) =>
      el.querySelector<HTMLElement>(FOCUS_TARGET)?.focus(options);
  }
};
const Frame = ({ children }: { children: ReactNode }) => (
  <span ref={forwardFocus} className="inline-flex">
    {children}
  </span>
);

const NAMES = [
  "식비",
  "교통",
  "쇼핑",
  "의료",
  "문화",
  "교육",
  "통신",
  "주거",
  "보험",
  "여행",
  "취미",
  "육아",
  "경조사",
  "반려동물",
  "구독",
  "세금",
  "저축",
  "투자",
  "기부",
  "기타",
];

/** 카탈로그(/dev/ds) — 변형 × 고름 × 상태, 크기, 아이콘, 고르기 · 필터 바 · 입력값, 묶음(줄바꿈 · 가로 스크롤 · 빈 묶음 · 칩 20개) */
export const ChipDemo = () => {
  const [type, setType] = useState("expense");
  const [alarms, setAlarms] = useState(["당일"]);
  const [people, setPeople] = useState(["김하나", "이둘", "박셋"]);
  const [period, setPeriod] = useState(false);
  return (
    <div className="flex flex-col gap-x8">
      <DemoBlock title="변형 × 고름 × 상태 — medium 36. 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다). Solid 는 흰 표면 위에서만">
        {VARIANTS.map((variant) =>
          STATES.map((state) => (
            <DemoRow
              key={`${variant}-${state}`}
              label={`${variant} · ${state}`}
            >
              {SELECTED.map((selected) => (
                <Specimen
                  key={selected}
                  spec="chip"
                  combo={{ variant, selected }}
                  state={state}
                >
                  <Frame>
                    <Chip
                      variant={variant}
                      selected={selected === "selected"}
                      disabled={state === "disabled"}
                    >
                      {selected === "selected" ? "식비" : "교통"}
                    </Chip>
                  </Frame>
                </Specimen>
              ))}
            </DemoRow>
          )),
        )}
      </DemoBlock>

      <DemoBlock title="크기 × 변형 × 고름 — small 32 · medium 36 · large 40, 글은 모두 14 · 500">
        {SIZES.map((size) => (
          <DemoRow key={size} label={size}>
            {VARIANTS.map((variant) =>
              SELECTED.map((selected) => (
                <Specimen
                  key={`${variant}-${selected}`}
                  spec="chip"
                  combo={{ size, variant, selected }}
                >
                  <Frame>
                    <Chip
                      size={size}
                      variant={variant}
                      selected={selected === "selected"}
                    >
                      {selected === "selected" ? "고름" : "안 고름"}
                    </Chip>
                  </Frame>
                </Specimen>
              )),
            )}
          </DemoRow>
        ))}
      </DemoBlock>

      <DemoBlock title="앞 · 뒤 아이콘 · 아이콘만 있는 칩(원 · 이름 필수) — 크기마다 14 · 16 · 16 / 14 · 14 · 16">
        {SIZES.map((size) => (
          <DemoRow key={size} label={size}>
            <Specimen spec="chip" combo={{ size }}>
              <Frame>
                <Chip size={size} prefixIcon={<Tag />}>
                  태그
                </Chip>
              </Frame>
            </Specimen>
            <Specimen spec="chip" combo={{ size, variant: "solid" }}>
              <Frame>
                <Chip
                  size={size}
                  variant="solid"
                  suffixIcon={<ChevronDown />}
                  aria-haspopup="dialog"
                >
                  기간
                </Chip>
              </Frame>
            </Specimen>
            <Specimen
              spec="chip"
              combo={{ size, variant: "outlineStrong", layout: "iconOnly" }}
            >
              <Frame>
                <Chip
                  size={size}
                  variant="outlineStrong"
                  layout="iconOnly"
                  aria-label="필터 지우기"
                >
                  <RotateCcw />
                </Chip>
              </Frame>
            </Specimen>
          </DemoRow>
        ))}
      </DemoBlock>

      <DemoBlock title="하나 고르기(라디오 · ← → 로 옮기면 고른다) · 여럿 고르기(체크박스) — Field 가 이름을 단다">
        <DemoRow label="하나 · outlineStrong">
          <div className="w-full max-w-[360px]">
            <Field label="거래 종류">
              <ChipRadioGroup value={type} onValueChange={setType}>
                <ChipRadio variant="outlineStrong" value="expense">
                  지출
                </ChipRadio>
                <ChipRadio variant="outlineStrong" value="income">
                  수입
                </ChipRadio>
                <ChipRadio variant="outlineStrong" value="transfer">
                  이체
                </ChipRadio>
              </ChipRadioGroup>
            </Field>
          </div>
        </DemoRow>
        <DemoRow label="견본 · 라디오">
          {SELECTED.map((selected) => (
            <Specimen
              key={selected}
              spec="chip"
              combo={{ variant: "outlineStrong", selected }}
            >
              <Frame>
                <ChipRadioGroup
                  aria-label="거래 종류"
                  defaultValue={selected === "selected" ? "a" : "b"}
                >
                  <ChipRadio variant="outlineStrong" value="a">
                    지출
                  </ChipRadio>
                  <ChipRadio variant="outlineStrong" value="b">
                    수입
                  </ChipRadio>
                </ChipRadioGroup>
              </Frame>
            </Specimen>
          ))}
        </DemoRow>
        <DemoRow label="여럿 · 체크박스">
          <div className="w-full max-w-[360px]">
            <Field label="알림" description="고른 때마다 알려줘요.">
              <ChipGroup>
                {["당일", "1일 전", "3일 전", "1주 전"].map((t) => (
                  <ChipToggle
                    key={t}
                    checked={alarms.includes(t)}
                    onCheckedChange={(on) =>
                      setAlarms((now) =>
                        on ? [...now, t] : now.filter((x) => x !== t),
                      )
                    }
                  >
                    {t}
                  </ChipToggle>
                ))}
              </ChipGroup>
            </Field>
          </div>
        </DemoRow>
        <DemoRow label="견본 · 체크박스">
          {VARIANTS.map((variant) =>
            SELECTED.map((selected) => (
              <Specimen
                key={`${variant}-${selected}`}
                spec="chip"
                combo={{ variant, selected }}
              >
                <Frame>
                  <ChipToggle
                    variant={variant}
                    defaultChecked={selected === "selected"}
                  >
                    {selected === "selected" ? "고름" : "안 고름"}
                  </ChipToggle>
                </Frame>
              </Specimen>
            )),
          )}
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="입력값 칩 — 넣은 값(Outline Weak 고른 모습) + 지우기. 지우면 다음 칩의 지우기로 포커스, 다 지우면 묶음으로(묶음도 링)">
        {SIZES.map((size) => (
          <DemoRow key={size} label={size}>
            {STATES.filter((s) => s === "enabled" || s === "disabled").map(
              (state) => (
                <Specimen
                  key={state}
                  spec="chip"
                  combo={{ size, variant: "outlineWeak", selected: "selected" }}
                  state={state}
                >
                  <Frame>
                    <InputChip
                      size={size}
                      disabled={state === "disabled"}
                      onRemove={() => {}}
                    >
                      김하나
                    </InputChip>
                  </Frame>
                </Specimen>
              ),
            )}
          </DemoRow>
        ))}
        <DemoRow label="키보드 포커스">
          <Specimen
            spec="chip"
            combo={{ variant: "outlineWeak", selected: "selected" }}
            state="focused"
          >
            <Frame>
              <InputChip onRemove={() => {}}>김하나</InputChip>
            </Frame>
          </Specimen>
        </DemoRow>
        <DemoRow label="묶음">
          <div className="w-full max-w-[360px]">
            <Field label="참여자">
              <ChipGroup>
                {people.map((p) => (
                  <InputChip
                    key={p}
                    onRemove={() =>
                      setPeople((now) => now.filter((x) => x !== p))
                    }
                  >
                    {p}
                  </InputChip>
                ))}
              </ChipGroup>
            </Field>
          </div>
        </DemoRow>
        <DemoRow label="빈 묶음 — 칩 한 줄(36) 높이를 남긴다">
          <Specimen spec="chip" combo={{}}>
            <div className="w-full max-w-[360px]">
              <ChipGroup aria-label="참여자 없음" />
            </div>
          </Specimen>
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="필터 바 — 조건마다 칩(뒤 화살표 · 걸린 조건은 고른 모습 + 값 요약), 걸리면 맨 앞에 지우기(↺). 한 줄 가로 스크롤 · 양 끝 흐림 · 첫 칩은 화면 여백 24 에서">
        <DemoRow label="폰 360">
          <Specimen spec="chip" combo={{ variant: "solid" }}>
            <div className="w-[360px] bg-bg-layer-default px-global-gutter">
              <ChipGroup layout="scroll" bleed aria-label="거래 거르기">
                {period && (
                  <Chip
                    variant="outlineStrong"
                    layout="iconOnly"
                    aria-label="필터 지우기"
                    onClick={() => setPeriod(false)}
                  >
                    <RotateCcw />
                  </Chip>
                )}
                <Chip
                  variant="solid"
                  selected={period}
                  suffixIcon={<ChevronDown />}
                  aria-haspopup="dialog"
                  onClick={() => setPeriod((on) => !on)}
                >
                  {period ? "이번 달" : "기간"}
                </Chip>
                <Chip
                  variant="solid"
                  selected
                  suffixIcon={<ChevronDown />}
                  aria-haspopup="dialog"
                >
                  식비 외 2개
                </Chip>
                <Chip
                  variant="solid"
                  suffixIcon={<ChevronDown />}
                  aria-haspopup="dialog"
                >
                  계좌
                </Chip>
                <Chip
                  variant="solid"
                  suffixIcon={<ChevronDown />}
                  aria-haspopup="dialog"
                >
                  금액
                </Chip>
                <Chip
                  variant="solid"
                  suffixIcon={<ChevronDown />}
                  aria-haspopup="dialog"
                >
                  결제 수단
                </Chip>
              </ChipGroup>
            </div>
          </Specimen>
        </DemoRow>
        <DemoRow label="칩 20개 · 가로 스크롤">
          <div className="w-[360px] bg-bg-layer-default px-global-gutter">
            <ChipGroup layout="scroll" bleed aria-label="카테고리 20개">
              {NAMES.map((name) => (
                <Chip key={name} variant="solid">
                  {name}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="제안 — 고른 표시가 없다. 누르면 칸에 값을 넣는 버튼">
        <DemoRow label="빠른 금액">
          <ChipGroup aria-label="빠른 금액">
            {["10만", "30만", "50만"].map((t) => (
              <Chip key={t} variant="solid" prefixIcon={<Plus />}>
                {t}
              </Chip>
            ))}
          </ChipGroup>
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="묶음 — 줄바꿈(칩 사이 · 줄 사이 8), 가장 나쁜 값: 칩 20개 · 긴 칩 이름(줄바꿈 · 말줄임 없이 글만큼 넓어진다)">
        <DemoRow label="줄바꿈 · 20개">
          <Specimen spec="chip" combo={{ variant: "outlineWeak" }}>
            <div className="w-full max-w-[360px]">
              <ChipGroup aria-label="카테고리 20개">
                {NAMES.map((name, i) => (
                  <Chip key={name} selected={i % 4 === 1}>
                    {name}
                  </Chip>
                ))}
              </ChipGroup>
            </div>
          </Specimen>
        </DemoRow>
        <DemoRow label="긴 이름">
          <div className="w-full max-w-[360px]">
            <ChipGroup aria-label="긴 이름">
              <Chip>신한카드 마이 포인트 플러스 체크카드</Chip>
              <Chip selected>월 구독료와 정기 결제 모음</Chip>
              <Chip>외식</Chip>
            </ChipGroup>
          </div>
        </DemoRow>
        <DemoRow label="긴 이름 · 스크롤">
          <div className="w-[360px] bg-bg-layer-default px-global-gutter">
            <ChipGroup layout="scroll" bleed aria-label="긴 이름 스크롤">
              <Chip variant="solid">신한카드 마이 포인트 플러스 체크카드</Chip>
              <Chip variant="solid" selected>
                월 구독료와 정기 결제 모음
              </Chip>
              <Chip variant="solid">외식</Chip>
            </ChipGroup>
          </div>
        </DemoRow>
      </DemoBlock>
    </div>
  );
};
