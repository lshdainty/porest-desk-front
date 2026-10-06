import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { ProgressCircle } from "./progress-circle";

const TONES = ["neutral", "brand"] as const;
const SIZES = ["24", "40"] as const;

/** 카탈로그(/dev/ds) — 크기 × 톤 × 값 없음 · 있음. staticWhite 는 어두운 면 위에 놓는다 */
export const ProgressCircleDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="크기 × 톤 — 값 없음(돈다) · 값 40% · 값 75%">
      {TONES.map((tone) => (
        <DemoRow key={tone} label={tone}>
          {SIZES.map((size) =>
            [undefined, 40, 75].map((value) => (
              <Specimen
                key={`${size}-${value}`}
                spec="progress-circle"
                combo={{
                  size,
                  tone,
                  mode: value === undefined ? "indeterminate" : "determinate",
                }}
              >
                <ProgressCircle size={size} tone={tone} value={value} />
              </Specimen>
            )),
          )}
        </DemoRow>
      ))}
    </DemoBlock>
    <DemoBlock title="staticWhite — 사진 위 딤(overlay-dim) 위에 놓는다">
      <div className="flex items-center gap-x3 rounded-r2 bg-[var(--overlay-dim-light)] p-x3 dark:bg-[var(--overlay-dim-dark)]">
        {SIZES.map((size) =>
          [undefined, 60].map((value) => (
            <Specimen
              key={`${size}-${value}`}
              spec="progress-circle"
              combo={{
                size,
                tone: "staticWhite",
                mode: value === undefined ? "indeterminate" : "determinate",
              }}
            >
              <ProgressCircle size={size} tone="staticWhite" value={value} />
            </Specimen>
          )),
        )}
      </div>
    </DemoBlock>
  </div>
);
