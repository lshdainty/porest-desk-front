import { Eye, Split } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { TagGroup, TagGroupItem } from "./tag-group";

const SIZES = ["t2", "t3", "t4"] as const;
const TONES = ["neutralSubtle", "neutral", "brand"] as const;
const WEIGHTS = ["regular", "bold"] as const;

// 이름표 — 보조 기술이 읽는 글(데모 덧칠)
const Reading = ({ text }: { text: string }) => (
  <span className="text-t2 text-fg-neutral-subtle">읽는 글 — “{text}”</span>
);

/** 카탈로그(/dev/ds) — 크기 × 톤 × 굵기, 항목마다 앞세우기, 아이콘, 줄바꿈 · 한 줄 말줄임. 상태는 enabled 하나다 */
export const TagGroupDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 톤 × 굵기 — 묶음의 톤 · 굵기는 항목의 기본값, 구분 “ · ” 는 늘 fg-disabled · 400">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          {TONES.map((tone) =>
            WEIGHTS.map((weight) => (
              <Specimen
                key={`${tone}-${weight}`}
                spec="tag-group"
                combo={{ size, tone, weight, overflow: "wrap" }}
              >
                <TagGroup size={size} tone={tone} weight={weight}>
                  <TagGroupItem>인사팀</TagGroupItem>
                  <TagGroupItem>10월 2일</TagGroupItem>
                  <TagGroupItem prefixIcon={<Eye />} srLabel="조회 12">
                    12
                  </TagGroupItem>
                </TagGroup>
              </Specimen>
            )),
          )}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="항목마다 — 앞세울 항목 하나만 neutral · bold, brand 는 아껴서">
      <DemoRow label="neutral · bold">
        <Specimen spec="tag-group" combo={{ tone: "neutral", weight: "bold" }}>
          <TagGroup>
            <TagGroupItem tone="neutral" weight="bold">
              전월 30만원 이상
            </TagGroupItem>
            <TagGroupItem>할인형</TagGroupItem>
            <TagGroupItem>연회비 2만원</TagGroupItem>
          </TagGroup>
        </Specimen>
        <Reading text="전월 30만원 이상, 할인형, 연회비 2만원" />
      </DemoRow>
      <DemoRow label="brand">
        <Specimen spec="tag-group" combo={{ tone: "brand" }}>
          <TagGroup>
            <TagGroupItem tone="brand">내가 씀</TagGroupItem>
            <TagGroupItem>인사팀</TagGroupItem>
            <TagGroupItem>3분 전</TagGroupItem>
          </TagGroup>
        </Specimen>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="아이콘 — 항목의 앞 또는 뒤 하나, 글자색을 따른다(12 · 13 · 14 · 글과 2). 뜻이 있으면 srLabel">
      {SIZES.map((size) => (
        <DemoRow key={size} label={size}>
          <Specimen spec="tag-group" combo={{ size }}>
            <TagGroup size={size}>
              <TagGroupItem>식비</TagGroupItem>
              <TagGroupItem>신한카드</TagGroupItem>
              <TagGroupItem suffixIcon={<Split />} srLabel="분할 2건">
                2
              </TagGroupItem>
            </TagGroup>
          </Specimen>
          <Specimen spec="tag-group" combo={{ size }}>
            <TagGroup size={size}>
              <TagGroupItem>인사팀</TagGroupItem>
              <TagGroupItem prefixIcon={<Eye />} srLabel="조회 12">
                12
              </TagGroupItem>
            </TagGroup>
          </Specimen>
        </DemoRow>
      ))}
      <DemoRow label="읽는 글">
        <Reading text="식비, 신한카드, 분할 2건" />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="줄바꿈(기본) — 낱말 단위, 구분은 앞 줄 끝에 남고 다음 줄은 항목으로 시작한다(폭 200)">
      <DemoRow label="wrap">
        <div className="max-w-[200px]">
          <Specimen spec="tag-group" combo={{ overflow: "wrap" }}>
            <TagGroup>
              <TagGroupItem>서울 서초구 서초4동</TagGroupItem>
              <TagGroupItem>500m</TagGroupItem>
              <TagGroupItem>어제</TagGroupItem>
              <TagGroupItem>조회수 128</TagGroupItem>
            </TagGroup>
          </Specimen>
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="한 줄 말줄임(truncate) — 항목 글이 각자 말줄임, 구분은 줄지 않는다(폭 240)">
      <DemoRow label="shrink 1(기본)">
        <div className="flex w-[240px]">
          <Specimen
            spec="tag-group"
            combo={{ size: "t3", overflow: "truncate" }}
          >
            <TagGroup size="t3" truncate>
              <TagGroupItem>교통</TagGroupItem>
              <TagGroupItem>신한카드 Deep Dream 체크(1234)</TagGroupItem>
              <TagGroupItem>오후 2:10</TagGroupItem>
            </TagGroup>
          </Specimen>
        </div>
      </DemoRow>
      <DemoRow label="shrink 0 · 2 · 0">
        <div className="flex w-[240px]">
          <TagGroup size="t3" truncate>
            <TagGroupItem shrink={0}>교통</TagGroupItem>
            <TagGroupItem shrink={2}>
              신한카드 Deep Dream 체크(1234)
            </TagGroupItem>
            <TagGroupItem shrink={0}>오후 2:10</TagGroupItem>
          </TagGroup>
        </div>
      </DemoRow>
      <DemoRow label="앞 아이콘 · t2">
        <div className="flex w-[200px]">
          <Specimen spec="tag-group" combo={{ overflow: "truncate" }}>
            <TagGroup truncate>
              <TagGroupItem>인사팀 공지사항 게시판</TagGroupItem>
              <TagGroupItem>10월 2일</TagGroupItem>
              <TagGroupItem prefixIcon={<Eye />} srLabel="조회 12">
                12
              </TagGroupItem>
            </TagGroup>
          </Specimen>
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="목록 줄의 설명 — t3 · truncate, 꼭 보일 항목(시각)은 줄지 않게">
      <div className="flex max-w-[360px] items-center gap-x2_5 py-x3">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-x0_5">
          <span className="text-t5 text-fg-neutral">스타벅스 강남역점</span>
          <Specimen
            spec="tag-group"
            combo={{ size: "t3", overflow: "truncate" }}
          >
            <TagGroup size="t3" truncate>
              <TagGroupItem>식비</TagGroupItem>
              <TagGroupItem>신한카드</TagGroupItem>
              <TagGroupItem shrink={0}>오후 2:10</TagGroupItem>
            </TagGroup>
          </Specimen>
        </div>
        <span className="shrink-0 text-t5 font-bold text-fg-neutral">
          5,600원
        </span>
      </div>
      <Reading text="식비, 신한카드, 오후 2:10" />
    </DemoBlock>
  </div>
);
