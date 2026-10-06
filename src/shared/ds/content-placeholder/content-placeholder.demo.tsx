import { CreditCard, FileText, Receipt } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { ContentPlaceholder } from "./content-placeholder";

// 담는 틀 — 크기 · 비율 · 모서리는 틀이 정한다(모서리는 Image Frame 의 폭 기준 — 24 이하 4 · 48 이하 6 · 그 위 8)
const FRAMES: { label: string; className: string }[] = [
  { label: "24 × 24 → 그림 16", className: "size-6 rounded-r1" },
  { label: "40 썸네일 → 20", className: "size-10 rounded-r1_5" },
  { label: "카드 112 × 70 → 35", className: "h-[70px] w-28 rounded-r2" },
  { label: "좁고 긴 24 × 80 → 폭 24", className: "h-20 w-6 rounded-r1" },
];

const PHOTOS: { label: string; className: string }[] = [
  {
    label: "4:3 사진 360 × 270 → 135",
    className: "aspect-[4/3] w-full max-w-[360px] rounded-r2",
  },
  {
    label: "정사각 360 → 160 에서 멈춘다",
    className: "aspect-square w-full max-w-[360px] rounded-r2",
  },
];

const GLYPHS = [
  { label: "사진(기본)", icon: undefined },
  { label: "카드 그림", icon: <CreditCard /> },
  { label: "영수증 사진", icon: <Receipt /> },
  { label: "문서", icon: <FileText /> },
];

/** 카탈로그(/dev/ds) — 틀 크기마다 그림 크기(틀 높이의 50%, 16 ~ 160), 그림 종류. 모서리는 담는 틀이 자른다 */
export const ContentPlaceholderDemo = () => (
  <div className="flex flex-col gap-x6">
    <DemoBlock title="크기 — 그림은 틀 높이의 절반(16 이상 160 이하), 틀 폭이 좁으면 폭에 맞춘다">
      {FRAMES.map(({ label, className }) => (
        <DemoRow key={label} label={label}>
          <div className={`overflow-hidden ${className}`}>
            <Specimen spec="content-placeholder" combo={{}}>
              <ContentPlaceholder />
            </Specimen>
          </div>
        </DemoRow>
      ))}
      {PHOTOS.map(({ label, className }) => (
        <DemoRow key={label} label={label}>
          <div className={`overflow-hidden ${className}`}>
            <Specimen spec="content-placeholder" combo={{}}>
              <ContentPlaceholder label="거래 상세 사진" />
            </Specimen>
          </div>
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="그림 — 무엇이 없는지 말하는 선 아이콘(선 굵기 1.5, 그림이 커지면 같이 굵어진다)">
      <DemoRow label="80 × 80">
        {GLYPHS.map(({ label, icon }) => (
          <div key={label} className="size-20 overflow-hidden rounded-r2">
            <Specimen spec="content-placeholder" combo={{}}>
              <ContentPlaceholder icon={icon} label={`${label} 없음`} />
            </Specimen>
          </div>
        ))}
      </DemoRow>
    </DemoBlock>
  </div>
);
