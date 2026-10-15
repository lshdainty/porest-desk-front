import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { aspectRatioVariants } from "@/shared/ds/aspect-ratio";
import { avatarHue, avatarInitial } from "@/shared/ds/avatar";
import {
  imageFrameImageVariants,
  imageFrameRadius,
  imageFrameVariants,
} from "@/shared/ds/image-frame";
import { institutionColor } from "@/shared/ds/institution-colors";

import {
  HUE_BG,
  INITIAL,
  INSTITUTION_TEXT,
  LINE_HEIGHT_1,
  LOGO_IMAGE,
  LOGO_TILE_SIZES,
  PLATE,
  PLATE_BG,
  ROOT,
  type LogoTileFace,
  type LogoTileImageType,
  type LogoTileSize,
} from "./logo-tile-variants";

/*
 * Porest Logo Tile — porest 에만 있는 부품(2026-10-04 — SEED 는 가게 · 업체를 원 Avatar 로 그리고 로고 타일 규칙이 없다).
 * 수치 원본은 porest-design specs/components/logo-tile.yaml(값은 src/shared/ds/spec/logo-tile.json), 기관 색은 institution-colors.yaml
 * (src/shared/ds/institution-colors). porest-design recipes/shadcn/components/ui/logo-tile.tsx 를 첫 판으로 가져왔다.
 * 지금 제품의 자산 로고(웹 · 앱 AssetLogo)와 HR 회사 로고를 대신한다.
 *
 *   LogoTile   물건 하나(은행 · 증권 · 카드 · 코인 · 금 자산 · 회사)를 보이는 각진 타일 — 면 + 이름의 첫 글자, 그림이 있으면 오는 대로 덮는다
 *     name       필수 — 기관이 있으면 기관 이름("신한"), 없으면 자산 이름("비상금"). 첫 글자 · 기관 색 찾기 · 이름 색 · 보조 기술의 이름이 모두 이 이름이다
 *     face       "institution"(기본 — 기관 색 표에서 찾고 없으면 이름 색) · "name"(표를 보지 않고 이름 색 — 기관이 없는 자산 · 기관이 아닌 회사).
 *                사용자가 지은 자산 이름 · HR 회사 이름은 "name" 이다 — 표의 짧은 별칭("우리" · "하나")이 "우리 아이 적금" · "하나투어" 에 걸리지 않게
 *     size       32 · 40(기본 — 목록 줄, List 타일과 같다) · 48(상세 머리). 이 밖의 크기를 만들지 않는다
 *     src        그림 — 없으면 첫 글자만
 *     imageType  "logo"(기본 — 로고 그림, 흰 판 위 잘리지 않게) · "card"(카드 그림, 옅은 판 위 카드 전체)
 *     decorative 기본 true — 옆에 이름이 있을 때(타일 전체를 보조 기술에 숨긴다). false 면 role="img" + 이름
 *
 * 모양 — 정사각, 모서리 크기 × 0.3(32 → 10 radius-r2_5 · 40 → 12 radius-r3 · 48 → 14 radius-r3_5).
 * 면 — 기관 색(institution — 표의 color, 모드를 따르지 않는다) 위에 표의 글자색(white = static-white, dark = 라이트 fg-neutral ·
 *   다크 fg-neutral-inverted — 78곳 모두 4.52 이상), 또는 이름 색(name · 표에 없는 기관 — Avatar 와 같은 avatarHue:
 *   chart-{색} 라이트 700 · 다크 800-dark) 위에 fg-neutral-inverted(라이트 흰 · 다크 짙은 글자 — 4.55 ~ 7.70).
 *   저장된 자산 색(asset.color)이 아니라 표에서 찾는다.
 * 첫 글자 — Avatar 의 avatarInitial(사용자가 보는 글자 단위 첫 글자 하나, 로마자 대문자) · 700 · 줄 높이 1 · 크기의 40%(13 · 16 · 19 —
 *   글자 크기 설정을 따르지 않는 px). 아주 긴 이름도 첫 글자 하나다. 이름이 비면 글자 없이 chart-gray.
 * 그림 — 첫 글자를 먼저 그리고, 그림이 다 오면 판과 그림이 첫 글자를 덮는다(전환 없이 바로 — Avatar 와 같다, 스켈레톤을 두지 않는다).
 *   못 불러오면 첫 글자 그대로다 — 깨진 그림 · 빈 칸이 보이지 않는다. 판 안쪽 4(spacing-x1).
 *   logo — 흰 판(static-white — 두 모드 같다) 위에 잘리지 않게(contain). 다크에서도 로고의 검은 부분이 사라지지 않는다.
 *   card — 옅은 판(bg-neutral-weak) 위에 카드 비율(1.586)의 Image Frame(폭 = 크기 − 8 → 24 × 15 · 32 × 20 · 40 × 25, 모서리는
 *          그 폭으로 4 · 6 · 6, 투명 윤곽). 세로 그림(원래 폭 < 높이)은 시계 방향으로 90° 돌려 채운다 — 정사각에 잘라 넣지 않는다.
 * 윤곽 — 안쪽 1px stroke-neutral-overlay(v118, Image Frame 과 같다), 면 · 판 · 그림 위에 늘. 다크의 짙은 남색 타일 · 흰 바탕의
 *   노랑 타일 둘레를 잡는다(장식 — 이름 글이 물건을 알린다).
 * 이름 — 이름 옆 타일은 장식(aria-hidden — 첫 글자 "신" 도 그림도 읽지 않는다, "신 신한 주거래" 가 아니다). 혼자면 role="img" +
 *   aria-label(이름) 하나 — 그림이 있어도 실패해도 같은 이름. 그림의 alt 는 늘 "".
 * 누르지 않는다 — 누르는 자리는 감싼 줄 · 버튼. 막힌 줄에서도 그대로다(줄의 글이 비활성 색).
 */

type ImageStatus = "loading" | "loaded" | "error";
type TileImageState = { src?: string; status: ImageStatus; portrait: boolean };

const loadingState = (src: string | undefined): TileImageState => ({
  src,
  status: "loading",
  portrait: false,
});

// 그림 상태 — src 가 바뀌면 다시 loading. 붙기 전에 이미 끝난 그림은 붙자마자 complete 로 읽는다(크기가 없는 SVG 는 decode 로 가른다).
// 다 받으면 원래 크기로 세로 그림인지 정한다(카드 그림을 돌린다). 붙을 때 부르는 함수(attach)는 처음 만든 것을 계속 쓴다 — Avatar 와 같다
function useTileImage(src: string | undefined) {
  const [state, setState] = React.useState<TileImageState>(() =>
    loadingState(src),
  );
  const current = state.src === src ? state : loadingState(src);
  const settle = (shown: string | undefined, img: HTMLImageElement) =>
    setState({
      src: shown,
      status: "loaded",
      portrait: img.naturalWidth < img.naturalHeight,
    });
  const fail = (shown: string | undefined) =>
    setState({ src: shown, status: "error", portrait: false });
  const [attach] = React.useState(() => (img: HTMLImageElement | null) => {
    if (!img?.complete) return;
    const shown = img.getAttribute("src") ?? undefined;
    if (img.naturalWidth > 0) settle(shown, img);
    else
      img.decode().then(
        () => settle(shown, img),
        () => fail(shown),
      );
  });
  return {
    ...current,
    attach,
    loaded: (img: HTMLImageElement) => settle(src, img),
    failed: () => fail(src),
  };
}

export interface LogoTileProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** 이름(필수) — 기관 이름, 없으면 자산 이름. 첫 글자 · 기관 색 · 이름 색 · 보조 기술의 이름 */
  name: string;
  /** "institution"(기본 — 기관 색 표, 없으면 이름 색) · "name"(표를 보지 않고 이름 색) */
  face?: LogoTileFace;
  /** 32 · 40(기본) · 48 */
  size?: LogoTileSize;
  /** 그림 — 없으면(undefined · null · "") 첫 글자만 */
  src?: string | null;
  /** 그림의 종류 — "logo"(기본, 흰 판 · contain) · "card"(옅은 판 · 카드 전체) */
  imageType?: LogoTileImageType;
  /** 기본 true — 옆에 이름이 있을 때(보조 기술에 숨긴다). false 면 role="img" + 이름 */
  decorative?: boolean;
}

const LogoTile = React.forwardRef<HTMLSpanElement, LogoTileProps>(
  (
    {
      name,
      face = "institution",
      size = 40,
      src,
      imageType = "logo",
      decorative = true,
      className,
      ...props
    },
    ref,
  ) => {
    const shown = name.trim();
    const institution = face === "institution" ? institutionColor(shown) : null;
    const source = src != null && src !== "" ? src : undefined;
    const { status, portrait, attach, loaded, failed } = useTileImage(source);
    const covered = source != null && status === "loaded";
    const hidden = decorative || shown === "";
    const box = LOGO_TILE_SIZES[size];
    return (
      <span
        ref={ref}
        data-slot="logo-tile"
        data-face={institution ? "institution" : "name"}
        data-image={source ? imageType : "none"}
        data-status={source ? status : "none"}
        role={hidden ? undefined : "img"}
        aria-label={hidden ? undefined : shown}
        aria-hidden={hidden || undefined}
        className={cn(ROOT, box.box, className)}
        {...props}
      >
        {!covered && (
          <span
            aria-hidden="true"
            data-slot="logo-tile-initial"
            className={cn(
              INITIAL,
              institution
                ? INSTITUTION_TEXT[institution.text]
                : cn(HUE_BG[avatarHue(shown)], "text-fg-neutral-inverted"),
              box.initial,
              LINE_HEIGHT_1,
            )}
            style={
              institution ? { backgroundColor: institution.color } : undefined
            }
          >
            {avatarInitial(shown)}
          </span>
        )}
        {source && status !== "error" && (
          <span
            data-slot="logo-tile-plate"
            className={cn(PLATE, PLATE_BG[imageType], !covered && "invisible")}
          >
            {imageType === "card" ? (
              <span
                data-slot="logo-tile-card"
                className={cn(
                  imageFrameVariants({ radius: imageFrameRadius(box.card) }),
                  aspectRatioVariants({ ratio: "card" }),
                  "shrink-0",
                )}
                style={{ width: box.card }}
              >
                <img
                  key={source}
                  ref={attach}
                  data-slot="logo-tile-card-image"
                  src={source}
                  alt=""
                  className={imageFrameImageVariants({
                    rotate: covered && portrait,
                  })}
                  onLoad={(e) => loaded(e.currentTarget)}
                  onError={failed}
                />
              </span>
            ) : (
              <img
                key={source}
                ref={attach}
                data-slot="logo-tile-image"
                src={source}
                alt=""
                className={LOGO_IMAGE}
                onLoad={(e) => loaded(e.currentTarget)}
                onError={failed}
              />
            )}
          </span>
        )}
      </span>
    );
  },
);
LogoTile.displayName = "LogoTile";

export { LogoTile };
