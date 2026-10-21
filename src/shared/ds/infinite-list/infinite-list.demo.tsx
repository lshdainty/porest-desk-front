import { useState } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { List, ListItem } from "@/shared/ds/list";

import { InfiniteListEnd } from "./infinite-list";
import type { InfiniteListStatus } from "./infinite-list-variants";

const noop = () => {};

// 견본 — 상태마다 목록 끝 자리 하나. 받는 중 원은 1초가 지나야 보인다(useWaitPhase) — 검사기는 원의 크기를 잰다(보이지 않아도 상자는 있다)
const STATUSES: { status: InfiniteListStatus; label: string }[] = [
  { status: "loading", label: "받는 중 — 원 24 · neutral(1초 뒤에 보인다)" },
  { status: "error", label: "못 불러옴 — 글 + 다시 시도(neutralWeak small)" },
  { status: "end", label: "끝 — 모두 봤어요." },
];

const ROWS = ["하나카드 모아", "가람 체크", "숲길 신용", "다온 플러스"];

// 직접 눌러 보기 — 목록 끝이 상자 아래 300 안으로 오면 다음 쪽을 받는다(IntersectionObserver). 못 불러오는 쪽을 골라 다시 시도를 본다
const LiveDemo = () => {
  const [count, setCount] = useState(8);
  const [failNext, setFailNext] = useState(true);
  const [status, setStatus] = useState<InfiniteListStatus>("loading");
  const load = () => {
    window.setTimeout(() => {
      if (failNext) {
        setFailNext(false);
        setStatus("error");
        return;
      }
      setCount((c) => {
        const next = c + 8;
        if (next >= 32) setStatus("end");
        else setStatus("loading");
        return next;
      });
    }, 600);
  };
  return (
    <DemoBlock title="직접 — 아래로 밀면 끝 300 앞에서 받는다. 첫 시도는 못 불러온다(다시 시도로 이어 받는다). 32 줄에서 끝">
      <div className="h-[360px] w-[320px] overflow-y-auto rounded-r2 bg-bg-layer-default">
        <List aria-busy={status === "loading"} aria-label="받는 중인 목록">
          {Array.from({ length: count }, (_, i) => (
            <ListItem key={i} title={`${ROWS[i % ROWS.length]} ${i + 1}`} />
          ))}
        </List>
        <InfiniteListEnd
          status={status}
          onReachEnd={load}
          onRetry={() => {
            setStatus("loading");
            load();
          }}
          endText="카드를 모두 봤어요."
        />
      </div>
      <Button
        variant="neutralWeak"
        size="small"
        onClick={() => {
          setCount(8);
          setFailNext(true);
          setStatus("loading");
        }}
      >
        처음부터
      </Button>
    </DemoBlock>
  );
};

/** 카탈로그(/dev/ds) — 목록 끝 자리 세 상태 · 직접 밀어 보기. 폰 폭(320)에 놓는다 */
export const InfiniteListDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="목록 끝 자리 — 목록 마지막 줄 아래 24 · 가운데. 폭 320">
      {STATUSES.map(({ status, label }) => (
        <DemoRow key={status} label={label}>
          <div className="w-[320px] rounded-r2 bg-bg-layer-default">
            <Specimen spec="infinite-list" combo={{ status }}>
              <InfiniteListEnd
                status={status}
                onRetry={noop}
                endText={status === "end" ? "카드를 모두 봤어요." : undefined}
              />
            </Specimen>
          </div>
        </DemoRow>
      ))}
    </DemoBlock>
    <LiveDemo />
  </div>
);
