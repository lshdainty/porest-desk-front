import { useId, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ds/card";
import { ResponsivePair } from "@/shared/ds/button";
import { ListHeader } from "@/shared/ds/list";

/**
 * 데이터 내보내기 · 가져오기 화면이 같이 쓰는 구역 틀(I-05 52).
 *
 * - 데스크톱 · 태블릿(`mobile={false}`) — ds Card + CardHeader(제목 R4 t5 · 700). 카드 사이는 부르는 쪽이 8 로 쌓는다.
 * - 폰(`mobile`) — 띠 안의 묶음: 목록 제목(ListHeader `boldSolid`) + 본문. 구역 사이는 부르는 쪽이 위 24 로 둔다.
 *
 * `children` 은 `titleId` 를 받아 안의 묶음(radiogroup · fieldset)의 이름으로 잇는다.
 */
export function DataSection({
  mobile,
  title,
  description,
  children,
}: {
  mobile: boolean;
  title: string;
  /** 구역 아래 설명 — R9 칸 설명(t4 · fg-neutral-subtle) */
  description?: string;
  children: (titleId: string) => ReactNode;
}) {
  const titleId = useId();
  const desc = description ? (
    <p className="m-0 text-t4 text-fg-neutral-subtle">{description}</p>
  ) : null;
  if (mobile) {
    return (
      <section aria-labelledby={titleId} className="flex flex-col gap-x2">
        {/* 폰 구역 머리 — 화면 여백은 페이지가 쥐고 있어 머리 좌우 여백을 걷는다 */}
        <ListHeader id={titleId} variant="boldSolid" className="px-0 py-x1">
          {title}
        </ListHeader>
        {desc}
        {children(titleId)}
      </section>
    );
  }
  return (
    <Card aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle id={titleId}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {desc}
        {children(titleId)}
      </CardContent>
    </Card>
  );
}

/**
 * 화면 바닥 버튼 자리(I-05 45 · 48 · 50).
 *
 * 폰은 화면 바닥에 붙인다 — 흰 면 위 좌우 24 · 안전 영역 위, 짝은 ResponsivePair(라벨이 반 폭을 넘으면 쌓는다).
 * 데스크톱 · 태블릿은 카드 바닥 오른쪽(`end`)이다. 폰에서는 본문이 바 밑에 가리지 않게 같은 높이의 자리를 남긴다.
 */
export function ActionBar({
  mobile,
  children,
}: {
  mobile: boolean;
  children: ReactNode;
}) {
  if (mobile) {
    return (
      <>
        <div
          aria-hidden
          className="h-[calc(var(--spacing-x16)+var(--spacing-x12))]"
        />
        <div
          data-slot="data-action-bar"
          className="fixed inset-x-0 bottom-0 z-(--z-sticky) bg-bg-layer-default px-x6 pt-x3 pb-[calc(var(--spacing-x6)+env(safe-area-inset-bottom))]"
        >
          <ResponsivePair>{children}</ResponsivePair>
        </div>
      </>
    );
  }
  return (
    <div data-slot="data-action-bar" className="flex justify-end gap-x2">
      {children}
    </div>
  );
}
