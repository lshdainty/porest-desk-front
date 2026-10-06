import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { AspectRatio } from "./aspect-ratio";
import type { AspectRatioValue } from "./aspect-ratio-variants";

const RATIOS: { ratio: AspectRatioValue; label: string }[] = [
  { ratio: "1:1", label: "정사각" },
  { ratio: "2:1", label: "넓은 띠" },
  { ratio: "16:9", label: "동영상" },
  { ratio: "4:3", label: "기본" },
  { ratio: "6:7", label: "조금 세로" },
  { ratio: "4:5", label: "세로" },
  { ratio: "2:3", label: "긴 세로" },
  { ratio: "card", label: "카드 1.586" },
];

// 지도 대역(SVG) — 그림이 아닌 자리의 예. 자식 img 는 상자를 채우고 cover 로 자른다
const MAP = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#eef2ea"/><path d="M0 380 600 300M180 0 260 600M0 140 600 220" stroke="#ffffff" stroke-width="28"/><path d="M0 380 600 300M180 0 260 600M0 140 600 220" stroke="#d6dccf" stroke-width="2"/><rect x="330" y="360" width="150" height="110" rx="10" fill="#cfe3c4"/><circle cx="300" cy="270" r="22" fill="#1e7d4c"/><circle cx="300" cy="270" r="8" fill="#ffffff"/></svg>',
)}`;

// 상자 자리를 보이는 빗금 — 상자는 바탕이 없다(미리보기용 덧칠)
const HATCH =
  "block bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--color-bg-neutral-weak)_6px_12px)]";

/** 카탈로그(/dev/ds) — 비율 여덟 가지(폭 120), 자식 img(cover) */
export const AspectRatioDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="비율 여덟 가지 — 폭 120, 점선은 상자 자리(상자는 바탕 · 모서리가 없다)">
      <div className="flex flex-wrap items-start gap-x4">
        {RATIOS.map(({ ratio, label }) => (
          <div key={ratio} className="flex w-[120px] flex-col gap-x2">
            <div className="outline-1 outline-fg-neutral-subtle outline-dashed">
              <Specimen spec="aspect-ratio" combo={{ ratio }}>
                <AspectRatio ratio={ratio}>
                  <span aria-hidden className={HATCH} />
                </AspectRatio>
              </Specimen>
            </div>
            <span className="text-t2 text-fg-neutral-subtle">
              {ratio} — {label}
            </span>
          </div>
        ))}
      </div>
    </DemoBlock>
    <DemoBlock title="자식 — img · video 는 상자를 채우고 가운데를 남겨 자른다(cover)">
      <DemoRow label="1:1 지도">
        <div className="w-[200px]">
          <Specimen spec="aspect-ratio" combo={{ ratio: "1:1" }}>
            <AspectRatio ratio="1:1">
              <img src={MAP} alt="김밥천국 강남점 위치" />
            </AspectRatio>
          </Specimen>
        </div>
      </DemoRow>
      <DemoRow label="16:9 넓은 그림">
        <div className="w-[280px]">
          <Specimen spec="aspect-ratio" combo={{ ratio: "16:9" }}>
            <AspectRatio ratio="16:9">
              <img src={MAP} alt="김밥천국 강남점 위치" />
            </AspectRatio>
          </Specimen>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
