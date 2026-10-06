import type { ReactNode } from "react";
import { Bell, ReceiptText, SearchX } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { ResultSection } from "./result-section";

const ignore = () => {};

// 놓인 자리 — 결과는 이 안에서 가로 · 세로 가운데에 서고 남는 높이를 채운다(부모가 세로 flex). 카탈로그 틀이다
const Place = ({
  size,
  children,
}: {
  size: "large" | "medium";
  children: ReactNode;
}) => (
  <div
    className={`flex w-full flex-col rounded-r3 border border-dashed border-stroke-neutral-weak ${size === "large" ? "min-h-[360px]" : "min-h-[240px]"}`}
  >
    {children}
  </div>
);

/** 카탈로그(/dev/ds) — 결과(비어 있음 · 실패 · 완료) × 크기(large · medium), 다시 시도 로딩, 찾을 수 없는 페이지 */
export const ResultSectionDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="large — 화면 전체를 차지하는 결과(제목 22 · 설명 16)">
      <DemoRow label="empty">
        <Place size="large">
          <Specimen
            spec="result-section"
            combo={{ size: "large", kind: "empty" }}
          >
            <ResultSection
              kind="empty"
              icon={<ReceiptText />}
              title="이번 달 거래가 없어요"
              description="거래를 기록하면 여기에 모여요."
              primaryAction={{ label: "거래 추가", onClick: ignore }}
            />
          </Specimen>
        </Place>
      </DemoRow>
      <DemoRow label="failure">
        <Place size="large">
          <Specimen
            spec="result-section"
            combo={{ size: "large", kind: "failure" }}
          >
            <ResultSection
              kind="failure"
              title="문제가 생겼어요"
              description="잠시 뒤 다시 시도해 주세요."
              primaryAction={{ label: "다시 시도", onClick: ignore }}
              secondaryAction={{ label: "홈으로", onClick: ignore }}
            />
          </Specimen>
        </Place>
      </DemoRow>
      <DemoRow label="done">
        <Place size="large">
          <Specimen
            spec="result-section"
            combo={{ size: "large", kind: "done" }}
          >
            <ResultSection
              kind="done"
              title="1,204건을 가져왔어요"
              description="건너뛴 줄 3 · 실패 0"
              primaryAction={{ label: "가계부로 가기", onClick: ignore }}
              secondaryAction={{ label: "다른 파일 가져오기", onClick: ignore }}
            />
          </Specimen>
        </Place>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="medium — 카드 · 섹션 · 시트 안의 결과(제목 16 · 설명 14)">
      <DemoRow label="empty">
        <Place size="medium">
          <Specimen
            spec="result-section"
            combo={{ size: "medium", kind: "empty" }}
          >
            <ResultSection
              kind="empty"
              size="medium"
              icon={<Bell />}
              title="새 알림이 없어요"
              description="예산을 넘거나 결제일이 다가오면 알려 드려요."
            />
          </Specimen>
        </Place>
      </DemoRow>
      <DemoRow label="failure">
        <Place size="medium">
          <Specimen
            spec="result-section"
            combo={{ size: "medium", kind: "failure" }}
          >
            <ResultSection
              kind="failure"
              size="medium"
              title="거래를 불러오지 못했어요"
              description="잠시 뒤 다시 시도해 주세요."
              primaryAction={{ label: "다시 시도", onClick: ignore }}
            />
          </Specimen>
        </Place>
      </DemoRow>
      <DemoRow label="done">
        <Place size="medium">
          <Specimen
            spec="result-section"
            combo={{ size: "medium", kind: "done" }}
          >
            <ResultSection
              kind="done"
              size="medium"
              title="모두 분류했어요"
              description="분류할 거래가 남아 있지 않아요."
              primaryAction={{ label: "가계부로 가기", onClick: ignore }}
            />
          </Specimen>
        </Place>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="다시 시도 하는 동안 · 찾을 수 없는 페이지 — 버튼 로딩(primaryAction.loading) · 링크 버튼(href)">
      <DemoRow label="failure 로딩">
        <Place size="medium">
          <Specimen
            spec="result-section"
            combo={{ size: "medium", kind: "failure" }}
          >
            <ResultSection
              kind="failure"
              size="medium"
              title="거래를 불러오지 못했어요"
              description="잠시 뒤 다시 시도해 주세요."
              primaryAction={{ label: "다시 시도", loading: true }}
            />
          </Specimen>
        </Place>
      </DemoRow>
      <DemoRow label="404">
        <Place size="large">
          <Specimen
            spec="result-section"
            combo={{ size: "large", kind: "empty" }}
          >
            <ResultSection
              kind="empty"
              icon={<SearchX />}
              title="페이지를 찾을 수 없어요"
              // 이 묶음 머리로 간다 — 제품에서는 "/"
              primaryAction={{ label: "홈으로", href: "#feedback" }}
            />
          </Specimen>
        </Place>
      </DemoRow>
    </DemoBlock>
  </div>
);
