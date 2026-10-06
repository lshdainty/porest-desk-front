import { Fragment } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Divider } from "./divider";

// 통계 세 칸 — 칸 사이 세로선
const STATS = [
  ["수입", "3,200,000원"],
  ["지출", "1,284,500원"],
  ["남은 돈", "1,915,500원"],
] as const;

/** 카탈로그(/dev/ds) — 방향 × 들임, 세 가지 나누기, 장식 · 의미 있는 구분선. 상태가 없다(정적인 선) */
export const DividerDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="가로 — 같은 묶음 안은 들인 선(양끝 16), 묶음 사이는 끝까지 선. 위아래 간격은 쓰는 자리가 정한다">
      <div className="max-w-[360px] text-t4 text-fg-neutral">
        <p className="flex justify-between py-x3">
          결제 수단<span>신한카드</span>
        </p>
        <Specimen
          spec="divider"
          combo={{ orientation: "horizontal", inset: "inset" }}
        >
          <Divider inset />
        </Specimen>
        <p className="flex justify-between py-x3">
          할부<span>3개월</span>
        </p>
        <Specimen
          spec="divider"
          combo={{ orientation: "horizontal", inset: "full" }}
        >
          <Divider />
        </Specimen>
        <p className="py-x3">메모</p>
      </div>
    </DemoBlock>

    <DemoBlock title="세로 — 가로로 놓인 칸 사이. 높이는 부모(flex)가 정하고, 들임이면 위아래 16">
      <div className="flex max-w-[360px] items-stretch text-t4 text-fg-neutral">
        {STATS.map(([label, value], i) => (
          <Fragment key={label}>
            {i > 0 && (
              <Specimen
                spec="divider"
                combo={{ orientation: "vertical", inset: "inset" }}
              >
                <Divider orientation="vertical" inset />
              </Specimen>
            )}
            <p className="flex-1 py-x4 text-center">
              {label}
              <br />
              {value}
            </p>
          </Fragment>
        ))}
      </div>
      <div className="flex h-x12 items-center gap-x3 text-t4 text-fg-neutral">
        <span>편집</span>
        <Specimen
          spec="divider"
          combo={{ orientation: "vertical", inset: "full" }}
        >
          <Divider orientation="vertical" />
        </Specimen>
        <span>삭제</span>
      </div>
    </DemoBlock>

    <DemoBlock title="세 가지 나누기 — 들인 선 · 끝까지 선 · 8 간격(크게 다른 내용 사이는 선이 아니라 바탕 층 사이 간격)">
      <div className="flex max-w-[360px] flex-col gap-x2 overflow-hidden rounded-r3 bg-bg-layer-basement text-t4 text-fg-neutral">
        <section className="bg-bg-layer-default px-x6">
          <p className="py-x3">결제 수단 · 신한카드</p>
          <Divider inset />
          <p className="py-x3">할부 · 일시불</p>
          <Divider />
          <p className="py-x3">메모</p>
        </section>
        <section className="bg-bg-layer-default px-x6">
          <p className="py-x3">이번 달 통계</p>
        </section>
      </div>
    </DemoBlock>

    <DemoBlock title="장식 · 의미 있는 구분선 — 기본은 보조 기술에 숨긴다(aria-hidden), 의미 있는 자리만 role=separator. 모습은 같다">
      <DemoRow label="aria-hidden">
        <div className="w-40 py-x3">
          <Specimen
            spec="divider"
            combo={{ orientation: "horizontal", inset: "full" }}
          >
            <Divider />
          </Specimen>
        </div>
      </DemoRow>
      <DemoRow label="role=separator">
        <div className="w-40 py-x3">
          <Specimen
            spec="divider"
            combo={{ orientation: "horizontal", inset: "full" }}
          >
            <Divider decorative={false} />
          </Specimen>
        </div>
        <div className="flex h-x12 px-x6">
          <Specimen
            spec="divider"
            combo={{ orientation: "vertical", inset: "full" }}
          >
            <Divider orientation="vertical" decorative={false} />
          </Specimen>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
