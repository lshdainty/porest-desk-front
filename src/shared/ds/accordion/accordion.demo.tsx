import { useState, type FocusEvent, type ReactNode } from "react";
import { Coffee, Fuel, ShoppingBag } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/shared/ds/card";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  Accordion,
  AccordionContent,
  AccordionExpandAll,
  AccordionHeader,
  AccordionItem,
  AccordionPlainItem,
  AccordionTrigger,
} from "./accordion";

const VARIANTS = ["inline", "separated"] as const;
const OPEN = ["collapsed", "expanded"] as const;
const DESCRIPTION = ["none", "shown"] as const;
const DETAIL = ["expandable", "none"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

const DETAIL_TEXT =
  "■ 월 최대 3만원 할인\n■ 전월 실적 30만원 이상\n■ 1회 결제 5만원 이상, 하루 한 번";

type Benefit = {
  id: string;
  title: string;
  summary?: string;
  detail?: string;
  icon: ReactNode;
};
const BENEFITS: Benefit[] = [
  {
    id: "coffee",
    title: "커피",
    summary: "스타벅스 · 투썸플레이스 · 이디야 50% 할인",
    detail: DETAIL_TEXT,
    icon: <Coffee />,
  },
  {
    id: "fuel",
    title: "주유",
    summary: "리터당 60원 할인",
    detail: DETAIL_TEXT,
    icon: <Fuel />,
  },
  {
    id: "transit",
    title: "대중교통",
    summary: "10% 할인",
    icon: <ShoppingBag />,
  },
];

// 검사기가 견본 뿌리에 준 키보드 포커스를 트리거로 넘긴다 — 뿌리는 초점을 받지 않는다(List 데모의 passFocus 와 같은 방법, 컴포넌트는 그대로다)
const passFocus = (selector: string) => ({
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget
      .querySelector<HTMLElement>(selector)
      ?.focus({ preventScroll: true });
  },
});

// 견본의 뿌리 — 폰 폭 390 의 면. 검사기는 이 가운데를 올리고 누른다(항목이 하나면 트리거 가운데)
const Frame = ({
  children,
  focus,
}: {
  children: ReactNode;
  focus?: string;
}) => (
  <div
    className="w-[390px] max-w-full bg-bg-layer-default py-x2"
    {...(focus ? passFocus(focus) : {})}
  >
    {children}
  </div>
);

const ids = (count: number) => BENEFITS.slice(0, count).map((b) => b.id);

type SampleProps = {
  variant: (typeof VARIANTS)[number];
  open?: (typeof OPEN)[number];
  description?: (typeof DESCRIPTION)[number];
  detail?: (typeof DETAIL)[number];
  state?: (typeof STATES)[number];
  count?: number;
};

// 견본 하나 — 변형 × 펼침 × 설명 × 상세 × 상태. 항목이 하나면 가운데가 트리거라 올림 · 누름이 닿고, 둘이면 사이 선 · 간격을 잰다
const Sample = ({
  variant,
  open = "collapsed",
  description = "none",
  detail = "expandable",
  state = "enabled",
  count = 2,
}: SampleProps) => {
  const shown = description === "shown";
  const items = BENEFITS.filter((b) => b.detail).slice(0, count);
  return (
    <Specimen
      spec="accordion"
      combo={{ variant, open, description, detail }}
      state={state}
    >
      <Frame
        focus={
          state === "focused" ? "[data-slot=accordion-trigger]" : undefined
        }
      >
        <Accordion
          variant={variant}
          defaultValues={open === "expanded" ? ids(count) : []}
          disabled={state === "disabled"}
        >
          {items.map((b) =>
            detail === "none" ? (
              <AccordionPlainItem
                key={b.id}
                title={b.title}
                description={shown ? b.summary : undefined}
                prefixIcon={shown ? b.icon : undefined}
              />
            ) : (
              <AccordionItem key={b.id} value={b.id}>
                <AccordionTrigger
                  title={b.title}
                  description={shown ? b.summary : undefined}
                  prefixIcon={shown ? b.icon : undefined}
                />
                <AccordionContent>{b.detail}</AccordionContent>
              </AccordionItem>
            ),
          )}
        </Accordion>
      </Frame>
    </Specimen>
  );
};

// ── 목록 머리 · 모두 펼치기 ────────────────────────────────────

const HeaderSpecimen = () => {
  const [open, setOpen] = useState<string[]>([]);
  return (
    <Specimen spec="accordion" combo={{}}>
      <div className="w-[390px] max-w-full bg-bg-layer-default px-x6 py-x2">
        <AccordionHeader title="혜택 상세 · 12건">
          <AccordionExpandAll
            controls="demo-header"
            values={open}
            expandable={["coffee", "fuel"]}
            onValuesChange={setOpen}
          />
        </AccordionHeader>
      </div>
    </Specimen>
  );
};

// 모두 펼치기 단추만 — 검사기가 단추 가운데를 올리고 누른다
const ExpandAllSpecimen = ({
  allOpen,
  state,
}: {
  allOpen: boolean;
  state: (typeof STATES)[number];
}) => (
  <Specimen spec="accordion" combo={{}} state={state}>
    <div
      className="inline-flex bg-bg-layer-default p-x4"
      {...(state === "focused"
        ? passFocus("[data-slot=accordion-expand-all]")
        : {})}
    >
      <AccordionExpandAll
        controls="demo-expand-all"
        values={allOpen ? ["coffee", "fuel"] : []}
        expandable={["coffee", "fuel"]}
        onValuesChange={() => {}}
        disabled={state === "disabled"}
      />
    </div>
  </Specimen>
);

// ── 화면 예시 ──────────────────────────────────────────────

const SheetExample = () => {
  const [open, setOpen] = useState<string[]>([]);
  const expandable = BENEFITS.filter((b) => b.detail).map((b) => b.id);
  return (
    <div className="w-[390px] max-w-full bg-bg-layer-floating px-x4 py-x4">
      <AccordionHeader title={`혜택 상세 · ${BENEFITS.length}건`}>
        <AccordionExpandAll
          controls="benefit-detail"
          values={open}
          expandable={expandable}
          onValuesChange={setOpen}
        />
      </AccordionHeader>
      <Accordion
        id="benefit-detail"
        variant="separated"
        values={open}
        onValuesChange={setOpen}
      >
        {BENEFITS.map((b) =>
          b.detail ? (
            <AccordionItem key={b.id} value={b.id}>
              <AccordionTrigger title={b.title} description={b.summary} />
              <AccordionContent>{b.detail}</AccordionContent>
            </AccordionItem>
          ) : (
            <AccordionPlainItem
              key={b.id}
              title={b.title}
              description={b.summary}
            />
          ),
        )}
      </Accordion>
    </div>
  );
};

const CardExample = () => {
  const [open, setOpen] = useState<string[]>([]);
  const expandable = BENEFITS.filter((b) => b.detail).map((b) => b.id);
  return (
    <div className="w-[390px] max-w-full bg-bg-layer-basement p-x4">
      <Card body="accordion">
        <CardHeader>
          <CardTitle>혜택 · {BENEFITS.length}건</CardTitle>
          <AccordionExpandAll
            controls="card-benefits"
            values={open}
            expandable={expandable}
            onValuesChange={setOpen}
          />
        </CardHeader>
        <Accordion id="card-benefits" values={open} onValuesChange={setOpen}>
          {BENEFITS.map((b) =>
            b.detail ? (
              <AccordionItem key={b.id} value={b.id}>
                <AccordionTrigger title={b.title} description={b.summary} />
                <AccordionContent>{b.detail}</AccordionContent>
              </AccordionItem>
            ) : (
              <AccordionPlainItem
                key={b.id}
                title={b.title}
                description={b.summary}
              />
            ),
          )}
        </Accordion>
      </Card>
    </div>
  );
};

// 가장 나쁜 값 — 84자 제목 · 20개 항목 · 열 개 펼침
const LONG_TITLE =
  "연회비 · 카드 발급 후 첫 달 실적 기준으로 산정하며 전월 이용 실적이 기준에 못 미치면 청구 할인이 적용되지 않을 수 있습니다";
const WorstExample = () => {
  const [open, setOpen] = useState<string[]>(["n3", "n4"]);
  const items = Array.from({ length: 20 }, (_, i) => `n${i + 1}`);
  return (
    <div className="w-[390px] max-w-full bg-bg-layer-default">
      <Accordion values={open} onValuesChange={setOpen}>
        {items.map((id, i) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger
              title={i === 0 ? LONG_TITLE : `유의사항 ${i + 1}`}
              description={i === 1 ? "합계 −123,456,789원" : undefined}
            />
            <AccordionContent>{DETAIL_TEXT}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

/** 카탈로그(/dev/ds) — 변형 × 펼침 × 설명 × 상세, 상태, 목록 머리 · 모두 펼치기, 화면 예시(시트 · 카드), 가장 나쁜 값 */
export const AccordionDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="변형 × 펼침 × 설명 × 상세 — 항목 둘(사이 선 · 간격). 상세 없음은 그냥 줄(꺾쇠 · 바탕 없음)">
      {VARIANTS.map((variant) =>
        DETAIL.map((detail) =>
          OPEN.filter(
            (open) => detail === "expandable" || open === "collapsed",
          ).map((open) => (
            <DemoRow
              key={`${variant}-${detail}-${open}`}
              label={`${variant} · ${detail} · ${open}`}
            >
              {DESCRIPTION.map((description) => (
                <Sample
                  key={description}
                  variant={variant}
                  open={open}
                  description={description}
                  detail={detail}
                />
              ))}
            </DemoRow>
          )),
        ),
      )}
    </DemoBlock>

    <DemoBlock title="상태 — 항목 하나. 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다). 막힘은 전용 색(흐리게 하지 않는다)">
      {VARIANTS.map((variant) => (
        <DemoRow key={variant} label={variant}>
          {STATES.map((state) => (
            <Sample
              key={state}
              variant={variant}
              state={state}
              count={1}
              description={state === "enabled" ? "shown" : "none"}
            />
          ))}
          <Sample
            variant={variant}
            open="expanded"
            state="disabled"
            count={1}
          />
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="목록 머리 · 모두 펼치기 — 보이는 32 · 누르는 44, 모두 펼치면 글이 모두 접기로">
      <DemoRow label="header">
        <HeaderSpecimen />
      </DemoRow>
      {[false, true].map((allOpen) => (
        <DemoRow
          key={String(allOpen)}
          label={allOpen ? "모두 접기" : "모두 펼치기"}
        >
          {STATES.map((state) => (
            <ExpandAllSpecimen key={state} allOpen={allOpen} state={state} />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="화면 예시 — 혜택 상세 시트(separated) · 카드 상세 혜택(inline, Card body=accordion)">
      <div className="flex flex-wrap items-start gap-x6">
        <SheetExample />
        <CardExample />
      </div>
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 항목 20개 · 84자 제목은 줄을 바꿔 다 보인다 · 열린 항목이 여럿 · 키보드(↓ ↑ Home End)로 돌며 다닌다">
      <WorstExample />
    </DemoBlock>
  </div>
);
