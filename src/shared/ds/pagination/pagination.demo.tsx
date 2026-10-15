import { useRef, useState, type FocusEvent, type ReactNode } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Pagination } from "./pagination";

type Cell = "item" | "arrow" | "current";

// 폭을 정해 둔 칸 — 줄은 9칸 360(480 미만 화면에서는 7칸 280)
const Strip = ({
  children,
  width = 440,
}: {
  children: ReactNode;
  width?: number;
}) => (
  <div
    className="shrink-0 rounded-r3 bg-bg-layer-default p-x4"
    style={{ width }}
  >
    {children}
  </div>
);

// 호버 · 누름 · 포커스 견본 — 검사기가 틀 가운데를 올리고 누른다. 40 × 40 틀 안에서 보려는 칸이 틀 가운데에 오게 줄을 놓는다
// (번호 칸 · 지금 쪽 칸은 줄의 둘째 칸이라 왼쪽으로 40, 이전 화살표는 첫 칸이라 0 — 줄 위 24(목록 끝 간격)는 위로 당긴다).
// 키보드 포커스는 틀이 그 칸으로 넘긴다. 줄에 data-measure 로 어느 칸을 재는지 알린다(pagination.measure.mjs)
const OnCell = ({
  cell,
  focus,
  children,
}: {
  cell: Cell;
  focus?: boolean;
  children: ReactNode;
}) => (
  <div
    data-measure={cell}
    className={`relative size-10 ${cell === "arrow" ? "" : "ml-10"}`}
    {...(focus
      ? {
          tabIndex: -1,
          onFocus: (e: FocusEvent<HTMLElement>) => {
            if (e.target !== e.currentTarget) return;
            e.currentTarget
              .querySelector<HTMLElement>(
                cell === "arrow"
                  ? "[data-slot=pagination-previous]"
                  : "[data-slot=pagination-item]",
              )
              ?.focus({ preventScroll: true });
          },
        }
      : {})}
  >
    <div
      className={`absolute -top-x6 ${cell === "arrow" ? "left-0" : "-left-10"}`}
    >
      {children}
    </div>
  </div>
);

// 값이 직접 움직이는 줄 — 주소에 쪽이 있는 줄(칸이 링크) · 누르면 목록 맨 위로
const Live = () => {
  const [page, setPage] = useState(5);
  const boxRef = useRef<HTMLDivElement>(null);
  return (
    <div className="flex flex-col gap-x2">
      <div
        ref={boxRef}
        className="rounded-r3 border border-stroke-neutral-weak p-x4 text-t4"
      >
        카드 혜택 목록 — {page}쪽
      </div>
      <Pagination
        totalPages={12}
        page={page}
        onPageChange={setPage}
        scrollTarget={boxRef}
        aria-label="카드 혜택 페이지 탐색"
      />
    </div>
  );
};

/** 카탈로그(/dev/ds) — 앞쪽 · 가운데 · 뒤쪽 · 적은 쪽(번호만) · 1쪽, 지금 쪽 · 호버 · 누름 · 포커스 · 막힘, 링크, 가장 나쁜 값 */
export const PaginationDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="9칸(480 이상) — 칸 40 을 사이 없이 · 지금 쪽은 짙은 채움 · 칸 자리는 그대로이고 생략만 옮겨 간다">
      <DemoRow label="가운데 5/12">
        <Strip>
          <Specimen spec="pagination" combo={{}}>
            <div>
              <Pagination totalPages={12} defaultPage={5} />
            </div>
          </Specimen>
        </Strip>
      </DemoRow>
      <DemoRow label="첫 쪽 — 이전 빈 칸">
        <Strip>
          <Specimen spec="pagination" combo={{}}>
            <div>
              <Pagination totalPages={12} defaultPage={1} />
            </div>
          </Specimen>
        </Strip>
      </DemoRow>
      <DemoRow label="뒤쪽 · 마지막">
        <Strip>
          <Pagination totalPages={12} defaultPage={10} />
        </Strip>
        <Strip>
          <Pagination totalPages={12} defaultPage={12} />
        </Strip>
      </DemoRow>
      <DemoRow label="쪽이 적을 때">
        <Strip>
          <Pagination totalPages={3} defaultPage={2} />
        </Strip>
        <Strip>
          <Pagination totalPages={7} defaultPage={4} />
        </Strip>
      </DemoRow>
      <DemoRow label="1쪽 이하">
        <Strip>
          <span className="text-t3 text-fg-neutral-subtle">
            totalPages 1 — 그리지 않는다
          </span>
          <Pagination totalPages={1} />
        </Strip>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="지금 쪽 — 짙은 채움(bg-neutral-inverted) + 반전 글자, 브랜드 색이 아니다">
      <DemoRow label="current">
        <Strip>
          <Specimen spec="pagination" combo={{ current: "current" }}>
            <div data-measure="current">
              <Pagination totalPages={12} defaultPage={1} />
            </div>
          </Specimen>
        </Strip>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="상태 — 호버(누름과 같은 바탕, 축소 없음) · 누름(+ 2px 거리 축소) · 키보드 포커스 링 · 막힘(목록을 다시 받는 동안)">
      <DemoRow label="번호 칸">
        {(["hovered", "pressed", "focused"] as const).map((state) => (
          <Strip key={state} width={120}>
            <Specimen spec="pagination" combo={{}} state={state}>
              <OnCell cell="item" focus={state === "focused"}>
                <Pagination totalPages={12} defaultPage={5} />
              </OnCell>
            </Specimen>
          </Strip>
        ))}
      </DemoRow>
      <DemoRow label="화살표">
        {(["hovered", "pressed", "focused"] as const).map((state) => (
          <Strip key={state} width={120}>
            <Specimen spec="pagination" combo={{}} state={state}>
              <OnCell cell="arrow" focus={state === "focused"}>
                <Pagination totalPages={12} defaultPage={5} />
              </OnCell>
            </Specimen>
          </Strip>
        ))}
      </DemoRow>
      <DemoRow label="지금 쪽">
        {(["hovered", "pressed"] as const).map((state) => (
          <Strip key={state} width={120}>
            <Specimen
              spec="pagination"
              combo={{ current: "current" }}
              state={state}
            >
              <OnCell cell="current">
                <Pagination totalPages={12} defaultPage={1} />
              </OnCell>
            </Specimen>
          </Strip>
        ))}
      </DemoRow>
      <DemoRow label="disabled">
        <Strip>
          <Specimen spec="pagination" combo={{}} state="disabled">
            <div>
              <Pagination totalPages={12} defaultPage={5} disabled />
            </div>
          </Specimen>
        </Strip>
        <Strip>
          <Specimen
            spec="pagination"
            combo={{ current: "current" }}
            state="disabled"
          >
            <div data-measure="current">
              <Pagination totalPages={12} defaultPage={5} disabled />
            </div>
          </Specimen>
        </Strip>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="링크 — 쪽이 주소에 있으면 칸이 링크(<a>)·새 탭에서 열 수 있다 · 가장 나쁜 값(네 자리 이상 쪽 · 1만 쪽)">
      <DemoRow label="getHref">
        <Strip>
          <Pagination
            totalPages={12}
            defaultPage={5}
            getHref={(p) => `#page-${p}`}
            onPageChange={() => {}}
          />
        </Strip>
      </DemoRow>
      <DemoRow label="worst">
        <Strip>
          <Pagination totalPages={12_345} defaultPage={6_172} />
        </Strip>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="직접 눌러 보기 — 누르면 목록 맨 위 + 숨은 상태 글 · 초점은 누른 칸에 남는다">
      <DemoRow label="live">
        <Strip width={520}>
          <Live />
        </Strip>
      </DemoRow>
    </DemoBlock>
  </div>
);
