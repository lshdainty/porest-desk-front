import { useState } from "react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { Progress, ProgressBar } from "./progress";

// 막대의 폭은 놓인 자리가 정한다 — 카탈로그에서는 한 폭으로 맞춘다
const WIDTH = "w-72";

/** 카탈로그(/dev/ds) — 한도 · 목표 × 보통 · 넘침 · 달성, 막대만, 값이 바뀔 때 */
export const ProgressDemo = () => {
  const [spent, setSpent] = useState(250000);
  const budget = 400000;
  const step = 50000;

  return (
    <div className="flex flex-col gap-x6">
      <DemoBlock title="한도(limit) — 쓸수록 찬다. 넘으면 끝까지 위험 색 + 'N원 초과'">
        <DemoRow label="enabled">
          <Specimen spec="progress" combo={{ meaning: "limit" }}>
            <Progress
              label="식비 예산"
              value={350000}
              max={400000}
              className={WIDTH}
            />
          </Specimen>
          <Specimen spec="progress" combo={{ meaning: "limit" }}>
            <Progress
              label="문화 예산"
              value={0}
              max={100000}
              className={WIDTH}
            />
          </Specimen>
        </DemoRow>
        <DemoRow label="over">
          <Specimen spec="progress" combo={{ meaning: "limit" }} state="over">
            <Progress
              label="교통 예산"
              value={120000}
              max={100000}
              className={WIDTH}
            />
          </Specimen>
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="목표(goal) — 모을수록 찬다. 닿으면 글 '달성' 만(색은 그대로)">
        <DemoRow label="enabled">
          <Specimen spec="progress" combo={{ meaning: "goal" }}>
            <Progress
              meaning="goal"
              label="여행 자금"
              value={1200000}
              max={2000000}
              className={WIDTH}
            />
          </Specimen>
          <Specimen spec="progress" combo={{ meaning: "goal" }}>
            <Progress
              meaning="goal"
              label="오늘 근무"
              value={6}
              max={8}
              formatValue={(h) => `${h}시간`}
              className={WIDTH}
            />
          </Specimen>
        </DemoRow>
        <DemoRow label="reached">
          <Specimen spec="progress" combo={{ meaning: "goal" }} state="reached">
            <Progress
              meaning="goal"
              label="현대카드 M 전월 실적"
              value={390000}
              max={300000}
              className={WIDTH}
            />
          </Specimen>
          <Specimen spec="progress" combo={{ meaning: "goal" }} state="reached">
            <Progress
              meaning="goal"
              label="비상금"
              value={300000}
              max={300000}
              className={WIDTH}
            />
          </Specimen>
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="막대만(ProgressBar) — 이름 · 글을 직접 그릴 때. 이름과 값 글을 꼭 준다">
        <DemoRow label="limit · goal">
          <ProgressBar
            value={88}
            max={100}
            aria-label="식비 예산 100% 중 88%"
            aria-valuetext="88%"
            className={WIDTH}
          />
          <ProgressBar
            meaning="goal"
            value={130}
            max={100}
            aria-label="카드 실적 100% 중 130%"
            aria-valuetext="달성"
            className={WIDTH}
          />
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="값이 바뀌면 채움이 300ms 로 따라 찬다(처음 그릴 때는 움직이지 않는다 · 모션 줄이기면 바로)">
        <DemoRow label="limit">
          <Progress
            label="생활비 예산"
            value={spent}
            max={budget}
            className={WIDTH}
          />
          <Button
            size="small"
            variant="neutralWeak"
            onClick={() => setSpent((v) => Math.max(v - step, 0))}
          >
            5만원 빼기
          </Button>
          <Button
            size="small"
            variant="neutralWeak"
            onClick={() => setSpent((v) => v + step)}
          >
            5만원 더하기
          </Button>
        </DemoRow>
      </DemoBlock>
    </div>
  );
};
