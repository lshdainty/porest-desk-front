import type { ReactNode } from "react";
import { CardHeader, CardTitle } from "@/shared/ds/card";
import { cn } from "@/shared/lib/cn";

/*
 * 밤하늘 · 관측 리포트 구역 머리 · 본문 틀(I-11 7 · 10 · 11 · 16 ~ 20) — 폰은 흰 띠 · 흰 면(band), 데스크톱은 ds Card(card)로 같은 내용을 그린다.
 * 띠 · 면 안: 머리 위 `top`(띠 24 · 리포트 흰 면 안 구역 20) · 좌우 24 · 머리 ↔ 본문 4(`gap` — 머리 글 바로 아래 설명이 올 때) 또는 8, 본문 아래 `bottom`(글 · 숫자 24 · 이어지는 구역 16).
 * 카드 안은 ds Card 머리(위 24 · 좌우 24 · 아래 8)와 본문 24 그대로다.
 */
export type Place = "band" | "card";

export function SectionHead({
  place,
  title,
  aside,
  top = "6",
  tight = false,
}: {
  place: Place;
  title: ReactNode;
  aside?: ReactNode;
  /** 띠 · 면 안 머리 위 — 24(띠 위) · 20(리포트 흰 면 안, 앞 구역 끝 16 과 합쳐 36) */
  top?: "5" | "6";
  /** 머리 아래 4(바로 설명 · 목록이 이어질 때), 아니면 8 */
  tight?: boolean;
}) {
  if (place === "card")
    return (
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {aside}
      </CardHeader>
    );
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x2 px-x6",
        top === "5" ? "pt-x5" : "pt-x6",
        tight ? "pb-x1" : "pb-x2",
      )}
    >
      <CardTitle>{title}</CardTitle>
      {aside}
    </div>
  );
}

/** 오른쪽 보조 글 — t4 · fg-neutral-subtle · 고정폭 */
export function HeadNote({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 text-t4 tabular-nums text-fg-neutral-subtle">
      {children}
    </span>
  );
}

/** 띠 · 면 안 본문 상자 — 좌우 24 · 위 `top` · 아래 `bottom`. 카드 안은 카드 본문이 24 를 가져 그대로 둔다 */
export function SectionBody({
  place,
  bottom = "6",
  top = "0",
  children,
}: {
  place: Place;
  bottom?: "4" | "6";
  top?: "0" | "1";
  children: ReactNode;
}) {
  if (place === "card") return <>{children}</>;
  return (
    <div
      className={cn(
        "px-x6",
        bottom === "4" ? "pb-x4" : "pb-x6",
        top === "1" && "pt-x1",
      )}
    >
      {children}
    </div>
  );
}
