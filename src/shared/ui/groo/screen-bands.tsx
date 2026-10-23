import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

type CardProps = ComponentProps<typeof Card>;

/**
 * ScreenBands — Desk 폰 구역 화면의 바탕(groo-design DESIGN Layout "화면 바탕" — 2026-10-21 I-01 결정 3).
 *
 * 홈 · 자산 · 통계 · 예산 · 카드 상세의 폰 화면은 카드 대신 구역(직계 자식)마다 화면 폭 흰 띠다.
 * 띠 사이 8 만 회색 바닥이 보이는 틈이다(SEED Divider "강함"). 시작 · 끝 틈은 없다 — 머리 바로 아래 첫 띠, 마지막 띠 아래 틈 0(I-05 74). 띠는 모서리 · 테두리 · 그림자가 없다.
 * 띠 안은 카드 안과 같은 값 — 사방 24(띠 안 위 4 · 아래 8 은 이 안에 든다). 순자산(ds Card hero)은
 * 모서리 없는 화면 폭 띠다. 한 화면에 카드와 띠를 섞지 않는다. 데스크톱(768 이상)은 이 부품을 쓰지 않고 카드다.
 *
 * `list` — 묶음 목록 띠 화면(설정 · 전체). 띠 안은 위 4 · 좌우 24 · 아래 8 이고 머리 · 줄이 제 위아래 여백을 갖는다
 * (DESIGN "띠 화면" — 앱 PScreenBand 와 같은 값).
 */
export function ScreenBands({
  children,
  className,
  list = false,
}: {
  children: ReactNode;
  className?: string;
  list?: boolean;
}) {
  return (
    <div
      className={cn("screen-bands", list && "screen-bands--list", className)}
    >
      {children}
    </div>
  );
}

/**
 * BandSurface — 폰은 구역 띠가 면이라 껍데기 없이, 데스크톱은 카드(옛 Card)로 같은 내용을 감싼다.
 * 폰 구역 화면에서 카드를 띠 안에 두지 않기 위한 것이다(I-01 결정 3 — "한 화면은 한 방식만").
 */
export function BandSurface({
  mobile,
  children,
  variant,
  style,
}: {
  mobile: boolean;
  children: ReactNode;
  variant?: CardProps["variant"];
  style?: CSSProperties;
}) {
  if (mobile) return <div>{children}</div>;
  return (
    <Card variant={variant} style={style}>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
