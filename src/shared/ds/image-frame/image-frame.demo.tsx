import type { ReactNode } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Badge } from "@/shared/ds/badge";

import { CardArt } from "./card-art";
import {
  ImageFrame,
  ImageFrameFloater,
  ImageFrameIndicator,
} from "./image-frame";
import {
  ImageFrameHoldLoading,
  type ImageFrameFit,
  type ImageFrameRatio,
} from "./image-frame-variants";
import {
  BROKEN,
  CARD_TALL,
  CARD_WIDE,
  DARK,
  LOGO,
  PHOTO,
  PHOTO_TALL,
  WHITE,
} from "./image-frame-samples";

const RATIOS: { ratio: ImageFrameRatio; label: string }[] = [
  { ratio: "1:1", label: "정사각" },
  { ratio: "2:1", label: "넓은 띠" },
  { ratio: "16:9", label: "동영상" },
  { ratio: "4:3", label: "기본" },
  { ratio: "6:7", label: "조금 세로" },
  { ratio: "4:5", label: "세로" },
  { ratio: "2:3", label: "긴 세로" },
  { ratio: "card", label: "카드 1.586" },
];

// 견본 아래 이름표(데모 덧칠)
const Labeled = ({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col items-start gap-x1_5">
    {children}
    <span className="text-t2 text-fg-neutral-subtle">{caption}</span>
  </div>
);

// 폭이 정해진 칸 — 틀은 부모 폭을 채운다
const Cell = ({ width, children }: { width: number; children: ReactNode }) => (
  <div style={{ width }}>{children}</div>
);

// 흰 판 위 흰 그림이 묻히는지 보이게 — 판은 늘 페이지 바탕(bg-layer-default)이다
const FLOATERS = (
  <>
    <ImageFrameFloater placement="top-start">
      <Badge variant="solid" tone="neutral">
        단종
      </Badge>
    </ImageFrameFloater>
    <ImageFrameFloater placement="bottom-end">
      <ImageFrameIndicator label="사진 12장 중 1번째">
        1 / 12
      </ImageFrameIndicator>
    </ImageFrameFloater>
  </>
);

/** 카탈로그(/dev/ds) — 비율 여덟 · 모서리(폭으로) · 윤곽 · 맞춤 · 세 상태 · 그림 위 요소 · 카드 그림(세로 돌리기 · 카드 면) */
export const ImageFrameDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="비율 여덟 가지 — 폭 120(모서리 8), 안쪽 1px 투명 윤곽">
      <div className="flex flex-wrap items-start gap-x4">
        {RATIOS.map(({ ratio, label }) => (
          <Labeled key={ratio} caption={`${ratio} — ${label}`}>
            <Specimen spec="image-frame" combo={{ ratio }}>
              <ImageFrame
                ratio={ratio}
                width={120}
                src={ratio === "card" ? CARD_WIDE : PHOTO}
                alt=""
              />
            </Specimen>
          </Labeled>
        ))}
      </div>
    </DemoBlock>

    <DemoBlock title="모서리 — 폭으로 고른다(24 이하 4 · 48 이하 6 · 그 위 8 · 화면 폭 0)">
      <div className="flex flex-wrap items-end gap-x4">
        <Labeled caption="폭 24 → 4">
          <Specimen spec="image-frame" combo={{ ratio: "1:1", radius: "4" }}>
            <ImageFrame ratio="1:1" width={24} src={PHOTO} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="폭 40 → 6">
          <Specimen spec="image-frame" combo={{ ratio: "1:1", radius: "6" }}>
            <ImageFrame ratio="1:1" width={40} src={PHOTO} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="폭 48 → 6">
          <Specimen spec="image-frame" combo={{ ratio: "1:1", radius: "6" }}>
            <ImageFrame ratio="1:1" width={48} src={PHOTO} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="폭 56 → 8">
          <Specimen spec="image-frame" combo={{ ratio: "1:1", radius: "8" }}>
            <ImageFrame ratio="1:1" width={56} src={PHOTO} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="폭 150 → 8">
          <Specimen spec="image-frame" combo={{ radius: "8" }}>
            <ImageFrame width={150} src={PHOTO} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="부모 폭(180) → 8">
          <Cell width={180}>
            <Specimen spec="image-frame" combo={{ radius: "8" }}>
              <ImageFrame src={PHOTO} alt="" />
            </Specimen>
          </Cell>
        </Labeled>
        <Labeled caption="화면 폭 bleed → 0, 윤곽은 그대로">
          <Cell width={180}>
            <Specimen spec="image-frame" combo={{ radius: "0" }}>
              <ImageFrame bleed src={PHOTO} alt="" />
            </Specimen>
          </Cell>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="윤곽 — 흰 그림이 흰 바탕에 묻히지 않고, 어두운 그림 둘레에는 테가 생기지 않는다">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="흰 그림">
          <Specimen spec="image-frame" combo={{}}>
            <ImageFrame width={150} src={WHITE} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="어두운 그림">
          <Specimen spec="image-frame" combo={{}}>
            <ImageFrame width={150} src={DARK} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="흰 그림 · 작게 56">
          <Specimen spec="image-frame" combo={{ ratio: "1:1" }}>
            <ImageFrame ratio="1:1" width={56} src={WHITE} alt="" />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="맞춤 — cover(사진 · 카드 그림, 가운데를 남겨 자른다) · contain(로고 — 잘리지 않게, 둘레는 흰 판)">
      <div className="flex flex-wrap items-start gap-x4">
        {(["cover", "contain"] as ImageFrameFit[]).map((fit) => (
          <Labeled key={fit} caption={fit === "cover" ? "cover" : "contain"}>
            <Specimen spec="image-frame" combo={{ ratio: "1:1", fit }}>
              <ImageFrame
                ratio="1:1"
                width={120}
                fit={fit}
                src={fit === "cover" ? PHOTO_TALL : LOGO}
                alt=""
              />
            </Specimen>
          </Labeled>
        ))}
      </div>
    </DemoBlock>

    <DemoBlock title="세 상태 — 받는 중(스켈레톤, 같은 모서리) · 다 받음 · 없음 · 못 불러옴(대체 그림)">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="loading">
          <ImageFrameHoldLoading.Provider value>
            <Specimen spec="image-frame" combo={{}} state="loading">
              <ImageFrame width={150} src={PHOTO} alt="" />
            </Specimen>
          </ImageFrameHoldLoading.Provider>
        </Labeled>
        <Labeled caption="loaded">
          <Specimen spec="image-frame" combo={{}} state="loaded">
            <ImageFrame width={150} src={PHOTO} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="fallback — 그림 없음">
          <Specimen spec="image-frame" combo={{}} state="fallback">
            <ImageFrame width={150} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="fallback — 못 불러옴(alt 가 이름)">
          <Specimen spec="image-frame" combo={{}} state="fallback">
            <ImageFrame width={150} src={BROKEN} alt="제주 바다 사진" />
          </Specimen>
        </Labeled>
        <Labeled caption="loading · 40(작은 틀도 같은 모서리 6)">
          <ImageFrameHoldLoading.Provider value>
            <Specimen
              spec="image-frame"
              combo={{ ratio: "1:1", radius: "6" }}
              state="loading"
            >
              <ImageFrame ratio="1:1" width={40} src={PHOTO} alt="" />
            </Specimen>
          </ImageFrameHoldLoading.Provider>
        </Labeled>
        <Labeled caption="fallback · 40">
          <Specimen
            spec="image-frame"
            combo={{ ratio: "1:1", radius: "6" }}
            state="fallback"
          >
            <ImageFrame ratio="1:1" width={40} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="fallback · 카드 credit-card">
          <Specimen
            spec="image-frame"
            combo={{ ratio: "card" }}
            state="fallback"
          >
            <ImageFrame ratio="card" width={150} alt="" />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="그림 위 요소 — 네 모서리 · 둘까지 · 짧은 변 80 이상일 때만(왼쪽 160 에는 배지 · Indicator, 오른쪽 56 은 그리지 않는다)">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="위 시작 배지 · 아래 끝 Indicator">
          <Specimen spec="image-frame" combo={{}}>
            <ImageFrame width={160} src={PHOTO} alt="">
              {FLOATERS}
            </ImageFrame>
          </Specimen>
        </Labeled>
        <Labeled caption="흰 그림 위 Indicator">
          <Specimen spec="image-frame" combo={{}}>
            <ImageFrame width={160} src={WHITE} alt="">
              <ImageFrameFloater placement="top-end">
                <ImageFrameIndicator label="사진 9장 더 있음">
                  +9
                </ImageFrameIndicator>
              </ImageFrameFloater>
              <ImageFrameFloater placement="bottom-start">
                <Badge variant="solid" tone="critical">
                  단종
                </Badge>
              </ImageFrameFloater>
            </ImageFrame>
          </Specimen>
        </Labeled>
        <Labeled caption="56 — 요소를 그리지 않는다">
          <Specimen spec="image-frame" combo={{ ratio: "1:1" }}>
            <ImageFrame ratio="1:1" width={56} src={PHOTO} alt="">
              {FLOATERS}
            </ImageFrame>
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="카드 그림 — 세로 그림은 시계 방향으로 90° 돌려 채운다(가로 틀 · 1.586)">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="가로 그림 · 그대로">
          <Specimen spec="image-frame" combo={{ ratio: "card" }}>
            <ImageFrame ratio="card" width={150} src={CARD_WIDE} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="세로 그림 · 돌림">
          <Specimen spec="image-frame" combo={{ ratio: "card" }}>
            <ImageFrame ratio="card" width={150} src={CARD_TALL} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="세로 그림 · 목록 56">
          <Specimen spec="image-frame" combo={{ ratio: "card" }}>
            <ImageFrame ratio="card" width={56} src={CARD_TALL} alt="" />
          </Specimen>
        </Labeled>
        <Labeled caption="세로 사진을 4:3 에 — 돌리지 않는다(cover)">
          <Specimen spec="image-frame" combo={{}}>
            <ImageFrame width={150} src={CARD_TALL} alt="" />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoRow label="여러 장 · 가로 줄">
      <div className="flex gap-x2">
        {[PHOTO_TALL, PHOTO_TALL, PHOTO_TALL].map((src, i) => (
          <Specimen key={i} spec="image-frame" combo={{ ratio: "4:5" }}>
            <ImageFrame ratio="4:5" width={96} src={src} alt="" />
          </Specimen>
        ))}
      </div>
    </DemoRow>

    <CardArtDemo />
  </div>
);

/** 카드 그림(CardArt) — 카드 면 크기 셋 · 모르는 카드사 · 긴 이름 · 그림 위 배지 */
const CardArtDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="카드 면 — 그림이 없는 아는 카드사(작게 56 — 첫 글자 · 가운데 160 — 회사 + 카드 이름 · 크게 282 — 한 단계 크게)">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="small · 56 (신한카드)">
          <Specimen spec="card-art" combo={{ size: "small" }}>
            <CardArt width={56} issuer="신한카드" name="Deep Dream" />
          </Specimen>
        </Labeled>
        <Labeled caption="small · 44 (KB국민카드)">
          <Specimen spec="card-art" combo={{ size: "small" }}>
            <CardArt width={44} issuer="KB국민카드" name="노리2" />
          </Specimen>
        </Labeled>
        <Labeled caption="medium · 160 (NH농협카드)">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt width={160} issuer="NH농협카드" name="올원 카드" />
          </Specimen>
        </Labeled>
        <Labeled caption="medium · 96 (삼성카드)">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt width={96} issuer="삼성카드" name="taptap O" />
          </Specimen>
        </Labeled>
        <Labeled caption="large · 282 (현대카드)">
          <Specimen spec="card-art" combo={{ size: "large" }}>
            <CardArt width={282} issuer="현대카드" name="the Purple" />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 아주 긴 이름(한 줄 말줄임 · 두 줄까지) · 모르는 카드사(대체 그림) · 그림 못 불러옴 → 카드 면">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="medium · 긴 회사 · 긴 카드 이름">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt
              width={160}
              issuer="NH농협카드 아주아주아주 긴 카드사 이름 확인용"
              name="이름이 아주아주 길어서 한 줄로 안 들어가는 카드 이름 확인용"
            />
          </Specimen>
        </Labeled>
        <Labeled caption="large · 두 줄까지">
          <Specimen spec="card-art" combo={{ size: "large" }}>
            <CardArt
              width={282}
              issuer="KB국민카드"
              name="이름이 아주아주 길어서 두 줄로도 안 들어가는 카드 이름 확인용 카드 이름 확인용 카드 이름"
            />
          </Specimen>
        </Labeled>
        <Labeled caption="모르는 카드사 · 대체 그림">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt width={160} issuer="어떤카드사" name="이름 모르는 카드" />
          </Specimen>
        </Labeled>
        <Labeled caption="그림 못 불러옴 → 카드 면">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt
              width={160}
              issuer="롯데카드"
              name="LOCA 365"
              src={BROKEN}
            />
          </Specimen>
        </Labeled>
        <Labeled caption="혼자 있는 카드(decorative=false) — 이름을 읽는다">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt
              width={160}
              issuer="우리카드"
              name="카드의정석"
              decorative={false}
            />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="그림이 있는 카드 — 가로 · 세로(돌림) · 그림 위 단종 배지 · 흰 카드">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="가로 그림">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt
              width={160}
              issuer="삼성카드"
              name="PORTRAIT TEST"
              src={CARD_WIDE}
            />
          </Specimen>
        </Labeled>
        <Labeled caption="세로 그림 · 돌림 + 단종 배지">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt
              width={160}
              issuer="삼성카드"
              name="세로 카드"
              src={CARD_TALL}
            >
              <ImageFrameFloater placement="top-start">
                <Badge variant="solid" tone="neutral">
                  단종
                </Badge>
              </ImageFrameFloater>
            </CardArt>
          </Specimen>
        </Labeled>
        <Labeled caption="흰 카드 · 윤곽">
          <Specimen spec="card-art" combo={{ size: "medium" }}>
            <CardArt width={160} issuer="신한카드" name="SELECT" src={WHITE} />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>
  </div>
);
