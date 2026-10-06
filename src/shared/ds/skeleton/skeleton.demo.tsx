import { useEffect, useState } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  LoadingAnnouncer,
  LoadingRegion,
  Skeleton,
  type SkeletonRadius,
  type SkeletonText,
} from "./skeleton";
import { LOADING_TIMING } from "./skeleton-variants";

// 모서리마다 그 모서리를 쓰는 자리의 크기 — 화면 폭 사진 · 그림 24 · 썸네일 40 · 글 · 타일 40 · 카드 면 · 아바타
const RADII: {
  radius: SkeletonRadius;
  label: string;
  className: string;
  text?: SkeletonText;
}[] = [
  { radius: "0", label: "0 — 화면 폭 사진", className: "h-16 w-28" },
  { radius: "4", label: "4 — 그림 24 이하", className: "size-6" },
  { radius: "6", label: "6 — 썸네일 40", className: "size-10" },
  { radius: "8", label: "8 — 글(기본)", className: "w-32", text: "t4" },
  { radius: "12", label: "12 — 목록 앞 타일", className: "size-10" },
  { radius: "16", label: "16 — 카드 면", className: "h-20 w-36" },
  { radius: "full", label: "full — 아바타", className: "size-10" },
];

// 글 자리 = 글줄 높이 — 옆의 글과 높이가 같다(skeleton.yaml root.height 의 t2 · t3 · t4 · t5 · t7)
const TEXTS: {
  text: SkeletonText;
  label: string;
  sample: string;
  sampleClassName: string;
  width: string;
}[] = [
  {
    text: "t2",
    label: "t2 12 → 16",
    sample: "350,000원 / 400,000원",
    sampleClassName: "text-t2",
    width: "w-32",
  },
  {
    text: "t3",
    label: "t3 13 → 18",
    sample: "카드 · 10월 3일",
    sampleClassName: "text-t3",
    width: "w-24",
  },
  {
    text: "t4",
    label: "t4 14 → 19",
    sample: "식비 예산",
    sampleClassName: "text-t4",
    width: "w-16",
  },
  {
    text: "t5",
    label: "t5 16 → 22",
    sample: "스타벅스 역삼점",
    sampleClassName: "text-t5",
    width: "w-32",
  },
  {
    text: "t7",
    label: "t7 20 → 27",
    sample: "1,250,000원",
    sampleClassName: "text-t7",
    width: "w-36",
  },
];

const TRANSACTIONS = [
  { name: "스타벅스 역삼점", detail: "카드 · 10월 3일", amount: "6,500원" },
  { name: "GS25 선릉점", detail: "현금 · 10월 2일", amount: "3,200원" },
  { name: "교보문고", detail: "카드 · 10월 1일", amount: "15,000원" },
];

// 줄 자리 — 실제 줄과 같은 높이(제목 t5 22 · 설명 t3 18 · 금액 t5)
const TransactionRowsSkeleton = () => (
  <div className="flex flex-col">
    {TRANSACTIONS.map((t) => (
      <div key={t.name} className="flex items-center gap-x3 py-x3">
        <div className="flex min-w-0 flex-1 flex-col gap-x1">
          <Skeleton text="t5" className="w-32" />
          <Skeleton text="t3" className="w-20" />
        </div>
        <Skeleton text="t5" className="w-16" />
      </div>
    ))}
  </div>
);

const TransactionRows = () => (
  <div className="flex flex-col">
    {TRANSACTIONS.map((t) => (
      <div key={t.name} className="flex items-center gap-x3 py-x3">
        <div className="flex min-w-0 flex-1 flex-col gap-x1">
          <span className="text-t5 text-fg-neutral">{t.name}</span>
          <span className="text-t3 text-fg-neutral-subtle">{t.detail}</span>
        </div>
        <span className="text-t5 font-bold text-fg-neutral">{t.amount}</span>
      </div>
    ))}
  </div>
);

// 실패 자리 — Result Section(failure + "다시 시도")이 생기기 전까지 쓰는 데모용 글
const Failure = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-x2 py-x6 text-center">
    <p className="text-t5 font-bold text-fg-neutral">
      거래를 불러오지 못했어요
    </p>
    <p className="text-t4 text-fg-neutral-muted">잠시 후 다시 시도해 주세요.</p>
    <Button size="small" variant="neutralWeak" onClick={onRetry}>
      다시 시도
    </Button>
  </div>
);

type Status = "pending" | "failed" | "ready";

// 시간표 — 0 ~ 1초 틀만 · 1초 대체 모습 · 5초 오래 걸림 글 · 10초 실패(요청 제한). "처음부터" 를 누르면 다시 센다
const Timeline = ({ circle = false }: { circle?: boolean }) => {
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<Status>("pending");

  // 요청 제한 — 10초가 지나면 실패로 그린다(제품에서는 요청 설정이 끊는다)
  useEffect(() => {
    if (status !== "pending") return;
    const timer = window.setTimeout(
      () => setStatus("failed"),
      LOADING_TIMING.timeout,
    );
    return () => window.clearTimeout(timer);
  }, [status, run]);

  const restart = () => {
    setStatus("pending");
    setRun((n) => n + 1);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-x3">
      <div className="flex gap-x2">
        <Button size="xsmall" variant="neutralWeak" onClick={restart}>
          처음부터
        </Button>
        <Button
          size="xsmall"
          variant="neutralWeak"
          onClick={() => setStatus("ready")}
        >
          다 옴
        </Button>
      </div>
      <div className="flex min-h-56 flex-col rounded-r3 border border-stroke-neutral-subtle px-x4 py-x3">
        {/* 틀 — 처음부터 그린다 */}
        <p className="text-t5 font-bold text-fg-neutral">
          {circle ? "검색 결과" : "최근 거래"}
        </p>
        <LoadingRegion
          key={run}
          pending={status === "pending"}
          failed={status === "failed"}
          fallback={circle ? "circle" : <TransactionRowsSkeleton />}
          failure={<Failure onRetry={restart} />}
        >
          <TransactionRows />
        </LoadingRegion>
      </div>
    </div>
  );
};

/** 카탈로그(/dev/ds) — 모서리 일곱, 글 자리 = 글줄 높이, 기다리는 영역의 시간표 */
export const SkeletonDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="모서리 — 곧 올 내용의 모양대로(흰 면 위에만 둔다)">
      {RADII.map(({ radius, label, className, text }) => (
        <DemoRow key={radius} label={label}>
          <Specimen spec="skeleton" combo={{ radius }}>
            <Skeleton radius={radius} text={text} className={className} />
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="글 자리 = 글줄 높이 — 글로 바뀌어도 줄이 밀리지 않는다">
      {TEXTS.map(({ text, label, sample, sampleClassName, width }) => (
        <DemoRow key={text} label={label}>
          <span className={`${sampleClassName} text-fg-neutral`}>{sample}</span>
          <Specimen spec="skeleton" combo={{ radius: "8" }}>
            <Skeleton text={text} className={width} />
          </Specimen>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="기다리는 영역 — 0 ~ 1초 틀만 · 1초 스켈레톤(원) · 5초 오래 걸림 글 · 10초 실패. 모션 줄이기면 띠가 멈춘다(운영체제 설정으로 본다)">
      <LoadingAnnouncer>
        <div className="flex flex-wrap gap-x4">
          <Timeline />
          <Timeline circle />
        </div>
      </LoadingAnnouncer>
    </DemoBlock>
  </div>
);
