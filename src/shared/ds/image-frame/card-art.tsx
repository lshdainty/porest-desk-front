import * as React from "react";
import { CreditCard } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { avatarInitial } from "@/shared/ds/avatar";
import {
  institutionColor,
  type InstitutionColor,
} from "@/shared/ds/institution-colors";

import { ImageFrame, type ImageFrameProps } from "./image-frame";
import {
  CARD_FACE,
  CARD_FACE_INITIAL,
  CARD_FACE_ISSUER,
  CARD_FACE_LABEL,
  CARD_FACE_NAME,
  CARD_FACE_TEXT,
} from "./image-frame-variants";

/*
 * Groo Card Art — 카드 그림. 수치 원본은 groo-design specs/components/card-art.yaml(값은 src/shared/ds/spec/card-art.json),
 * 구조는 Image Frame(image-frame.tsx) 이다. groo-design recipes/shadcn/components/ui/image-frame.tsx 의 CardArt 를 가져왔다.
 *
 *   CardArt   카드 그림 — ratio card(1.586)의 Image Frame. 그림이 없거나 실패하면 카드사(issuer)로 가른다
 *     issuer      카드사 이름 — 기관 색 · 첫 글자 · 모르는 회사 가르기
 *     name        카드 이름
 *     src         카드 그림 — 없거나 실패하면 카드 면(아는 카드사) · 대체 그림(모르는 카드사). 세로 그림은 시계 방향 90° 로 돌린다
 *     decorative  기본 true — 옆에 이름이 있을 때(그림 · 면을 숨긴다). false 면 "카드사 카드 이름" 을 읽는다(그림의 alt · 면의 이름)
 *     그 밖        width · loading · className 과 자식 ImageFrameFloater(그림 위 배지 · 둘까지)는 Image Frame 그대로
 *
 * 아는 카드사(기관 색 표에 있다 — institutionColor) — 카드 면: 기관 색 한 색(모드를 따르지 않는다) + 표의 글자색(white = static-white,
 *   dark = 라이트 fg-neutral · 다크 fg-neutral-inverted). 광택 띠 · 그라디언트가 없다. 면의 크기는 틀의 폭으로
 *   small(96 미만 — 회사 첫 글자만 가운데, 면 높이의 40% · 가장 작아도 10 · 700 · 줄 높이 1 · 로마자 대문자) ·
 *   medium(96 ~ 239 — 왼쪽 아래 회사 t2 500 한 줄 말줄임 · 카드 이름 t4 700 한 줄 말줄임 · 좌우 10 · 아래 8) ·
 *   large(240 이상 — 회사 t3 · 카드 이름 t5 두 줄까지(단어 단위) · 좌우 16 · 아래 14)
 * 모르는 카드사 — 대체 그림(credit-card). 브랜드 파랑 · 회색 면으로 회사 색인 척하지 않는다.
 * 상세에는 그림이 떠도 카드 이름을 화면에 글로 둔다(그림 아래 · 제목) — 면의 글 · alt 에만 두지 않는다. 부르는 쪽이 한다.
 */

function CardFace({
  issuer,
  name,
  institution,
}: {
  issuer: string;
  name: string;
  institution: InstitutionColor;
}) {
  return (
    <div
      data-slot="card-art-face"
      data-text={institution.text}
      className={cn(CARD_FACE, CARD_FACE_TEXT[institution.text])}
      style={{ backgroundColor: institution.color }}
    >
      <span data-slot="card-art-initial" className={CARD_FACE_INITIAL}>
        {avatarInitial(issuer)}
      </span>
      <span data-slot="card-art-label" className={CARD_FACE_LABEL}>
        <span data-slot="card-art-issuer" className={CARD_FACE_ISSUER}>
          {issuer.trim()}
        </span>
        {name.trim() !== "" && (
          <span data-slot="card-art-name" className={CARD_FACE_NAME}>
            {name.trim()}
          </span>
        )}
      </span>
    </div>
  );
}

export interface CardArtProps extends Omit<
  ImageFrameProps,
  | "src"
  | "alt"
  | "ratio"
  | "bleed"
  | "fit"
  | "fallbackIcon"
  | "fallback"
  | "srcSet"
  | "sizes"
> {
  /** 카드사 이름 — 기관 색 · 첫 글자 · 모르는 회사 가르기 */
  issuer: string;
  /** 카드 이름 */
  name: string;
  /** 카드 그림 — 없거나 실패하면 카드 면(아는 카드사) · 대체 그림(모르는 카드사) */
  src?: string | null;
  /** 기본 true — 옆에 이름이 있을 때(그림 · 면을 숨긴다). false 면 "카드사 카드 이름" 을 읽는다 */
  decorative?: boolean;
}

const CardArt = React.forwardRef<HTMLDivElement, CardArtProps>(
  ({ issuer, name, src, decorative = true, ...props }, ref) => {
    const institution = institutionColor(issuer);
    const label = [issuer.trim(), name.trim()]
      .filter((part) => part !== "")
      .join(" ");
    return (
      <ImageFrame
        ref={ref}
        data-slot="card-art"
        data-issuer={institution ? "known" : "unknown"}
        ratio="card"
        src={src}
        alt={decorative ? "" : label}
        fallbackIcon={<CreditCard />}
        fallback={
          institution ? (
            <CardFace issuer={issuer} name={name} institution={institution} />
          ) : undefined
        }
        {...props}
      />
    );
  },
);
CardArt.displayName = "CardArt";

export { CardArt };
