import type { ReactNode } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import {
  BROKEN,
  CARD_TALL,
  CARD_WIDE,
  LOGO,
} from "@/shared/ds/image-frame/image-frame-samples";
import { INSTITUTION_COLORS } from "@/shared/ds/institution-colors";

import { LogoTile } from "./logo-tile";
import type { LogoTileSize } from "./logo-tile-variants";

const SIZES: LogoTileSize[] = [32, 40, 48];

// 견본 아래 이름표(데모 덧칠)
const Labeled = ({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-x1_5">
    {children}
    <span className="text-t2 text-fg-neutral-subtle">{caption}</span>
  </div>
);

// 줄 안의 타일 — 이름 옆이라 타일은 장식이다(보조 기술에는 줄의 글이 읽힌다)
const Line = ({
  tile,
  title,
  detail,
}: {
  tile: ReactNode;
  title: string;
  detail: string;
}) => (
  <div className="flex w-[260px] items-center gap-x3">
    {tile}
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-t5 font-bold text-fg-neutral">
        {title}
      </span>
      <span className="truncate text-t3 text-fg-neutral-subtle">{detail}</span>
    </span>
  </div>
);

/** 카탈로그(/dev/ds) — 크기 셋 · 기관 색 면(글자 흰 · 짙은) · 이름 색 면 · 그림(카드 · 로고) · 늦음 · 실패 · 가장 나쁜 값 · 기관 색 78곳 */
export const LogoTileDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 32 · 40 · 48 — 모서리는 크기 × 0.3(10 · 12 · 14), 첫 글자는 크기의 40%(13 · 16 · 19)">
      <DemoRow label="기관 색 · 흰 글자">
        {SIZES.map((size) => (
          <Labeled key={size} caption={`${size} · 신한`}>
            <Specimen
              spec="logo-tile"
              combo={{ size: String(size), face: "institution" }}
            >
              <LogoTile size={size} name="신한" />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
      <DemoRow label="기관 색 · 짙은 글자">
        {SIZES.map((size) => (
          <Labeled key={size} caption={`${size} · KB국민`}>
            <Specimen
              spec="logo-tile"
              combo={{ size: String(size), face: "institution" }}
            >
              <LogoTile size={size} name="KB국민" />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
      <DemoRow label="이름 색(기관 없음)">
        {SIZES.map((size) => (
          <Labeled key={size} caption={`${size} · 비상금`}>
            <Specimen
              spec="logo-tile"
              combo={{ size: String(size), face: "name" }}
            >
              <LogoTile size={size} name="비상금" face="name" />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="면과 첫 글자 — 표를 따로 보는 이름 · 표에 없는 기관 · 로마자 대문자 · 짧은 별칭이 걸리지 않게 face=name">
      <div className="flex flex-wrap items-start gap-x4">
        <Labeled caption="NH농협카드 올원 → 든 가장 긴 이름">
          <Specimen spec="logo-tile" combo={{ face: "institution" }}>
            <LogoTile name="NH농협카드 올원" />
          </Specimen>
        </Labeled>
        <Labeled caption="IBK기업은행">
          <Specimen spec="logo-tile" combo={{ face: "institution" }}>
            <LogoTile name="IBK기업은행" />
          </Specimen>
        </Labeled>
        <Labeled caption="Upbit → U">
          <Specimen spec="logo-tile" combo={{ face: "institution" }}>
            <LogoTile name="Upbit" />
          </Specimen>
        </Labeled>
        <Labeled caption="표에 없는 기관 → 이름 색">
          <Specimen spec="logo-tile" combo={{ face: "institution" }}>
            <LogoTile name="어떤은행" />
          </Specimen>
        </Labeled>
        <Labeled caption="우리 아이 적금 · face=name">
          <Specimen spec="logo-tile" combo={{ face: "name" }}>
            <LogoTile name="우리 아이 적금" face="name" />
          </Specimen>
        </Labeled>
        <Labeled caption="하나투어 · face=name">
          <Specimen spec="logo-tile" combo={{ face: "name" }}>
            <LogoTile name="하나투어" face="name" />
          </Specimen>
        </Labeled>
        <Labeled caption="이름이 비면 글자 없이 회색">
          <Specimen spec="logo-tile" combo={{ face: "name" }}>
            <LogoTile name="" face="name" />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="그림 — 카드 그림(옅은 판 위 카드 전체, 세로는 90° 돌림) · 로고 그림(흰 판 위 contain) · 실패하면 첫 글자 그대로">
      <DemoRow label="카드 그림">
        {SIZES.map((size) => (
          <Labeled key={size} caption={`${size} · 가로`}>
            <Specimen
              spec="logo-tile"
              combo={{ size: String(size), image: "card" }}
            >
              <LogoTile
                size={size}
                name="삼성카드"
                src={CARD_WIDE}
                imageType="card"
              />
            </Specimen>
          </Labeled>
        ))}
        {SIZES.map((size) => (
          <Labeled key={size} caption={`${size} · 세로`}>
            <Specimen
              spec="logo-tile"
              combo={{ size: String(size), image: "card" }}
            >
              <LogoTile
                size={size}
                name="삼성카드"
                src={CARD_TALL}
                imageType="card"
              />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
      <DemoRow label="로고 그림">
        {SIZES.map((size) => (
          <Labeled key={size} caption={`${size} · 흰 판`}>
            <Specimen
              spec="logo-tile"
              combo={{ size: String(size), face: "name", image: "logo" }}
            >
              <LogoTile
                size={size}
                name="포레스트컴퍼니"
                face="name"
                src={LOGO}
                imageType="logo"
              />
            </Specimen>
          </Labeled>
        ))}
      </DemoRow>
      <DemoRow label="못 불러옴">
        <Labeled caption="로고 실패 → 첫 글자">
          <Specimen spec="logo-tile" combo={{ face: "name" }}>
            <LogoTile name="새회사" face="name" src={BROKEN} imageType="logo" />
          </Specimen>
        </Labeled>
        <Labeled caption="카드 실패 → 기관 색 첫 글자">
          <Specimen spec="logo-tile" combo={{ face: "institution" }}>
            <LogoTile name="현대카드" src={BROKEN} imageType="card" />
          </Specimen>
        </Labeled>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="줄 안에서 — 옆에 이름이 있으니 타일은 장식(첫 글자 · 그림을 읽지 않는다). 긴 이름은 줄이 말줄임">
      <div className="flex flex-wrap gap-x6">
        <Line
          tile={<LogoTile name="신한" />}
          title="신한 주거래 우대통장"
          detail="신한 · 입출금"
        />
        <Line
          tile={<LogoTile name="카카오뱅크" />}
          title="카카오뱅크 세이프박스"
          detail="카카오뱅크 · 예금"
        />
        <Line
          tile={<LogoTile name="삼성카드" src={CARD_TALL} imageType="card" />}
          title="삼성카드 taptap O 아주 아주 긴 카드 이름 확인용"
          detail="신용 · 삼성카드"
        />
        <Line
          tile={<LogoTile name="비상금" face="name" />}
          title="비상금"
          detail="현금"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 짙은 남색 · 노랑 타일이 표면에 묻히지 않는지(윤곽) · 아주 긴 이름도 첫 글자 하나">
      <div className="flex flex-wrap items-start gap-x4">
        {[
          "케이뱅크",
          "현대카드",
          "삼성카드",
          "카카오뱅크",
          "카카오페이증권",
        ].map((name) => (
          <Labeled key={name} caption={name}>
            <Specimen spec="logo-tile" combo={{ face: "institution" }}>
              <LogoTile name={name} />
            </Specimen>
          </Labeled>
        ))}
        <Labeled caption="아주 긴 기관 이름">
          <Specimen spec="logo-tile" combo={{ face: "name" }}>
            <LogoTile
              name="이것은아주아주아주긴기관이름이라타일안에서넘치지않아야합니다"
              face="name"
            />
          </Specimen>
        </Labeled>
        <Labeled caption="그림 글자(가족)">
          <Specimen spec="logo-tile" combo={{ face: "name" }}>
            <LogoTile name="👨‍👩‍👧 우리집" face="name" />
          </Specimen>
        </Labeled>
      </div>
    </DemoBlock>

    <DemoBlock title="기관 색 표 78곳 — 한 색 · 표의 글자색(흰 글자가 4.5:1 에 못 미치면 짙은 글자)">
      <div className="flex flex-wrap gap-x2">
        {INSTITUTION_COLORS.map((entry) => (
          <LogoTile
            key={entry.name}
            name={entry.name}
            title={entry.name}
            decorative={false}
          />
        ))}
      </div>
    </DemoBlock>
  </div>
);
