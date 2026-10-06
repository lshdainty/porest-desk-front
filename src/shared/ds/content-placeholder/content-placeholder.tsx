import * as React from "react";
import { ImageIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";

/*
 * Porest Content Placeholder — 구조는 SEED Content Placeholder(2026-10-03). 수치 원본은 porest-design
 * specs/components/content-placeholder.yaml(값은 src/shared/ds/spec/content-placeholder.json).
 * porest-design recipes/shadcn/components/ui/content-placeholder.tsx 를 첫 판으로 가져왔다(앱 적용 1A).
 * 이미지가 없거나 불러오지 못했을 때 그 자리를 채우는 대체 그림 — 옅은 면 가운데에 무엇이 없는지 말하는 선 아이콘.
 * 불러오는 동안에는 쓰지 않는다 — 같은 모서리 · 크기의 Skeleton 이다(불러오는 중과 없음을 같은 그림으로 두지 않는다).
 * 깨진 이미지 아이콘 · 대체 글 · 투명한 빈 칸 · 외부 주소의 기본 그림 대신 이것으로 바꾼다.
 *
 *   ContentPlaceholder   담는 틀(이미지 틀)을 채운다 — 크기 · 비율 · 모서리는 담는 틀이 정한다(제 모서리 · 테두리 · 그림자 없음)
 *     icon      그림 — lucide 선 아이콘, 기본 ImageIcon. 자리가 무엇인지 말할 수 있으면 그 아이콘(카드 CreditCard · 영수증 Receipt ·
 *               문서 FileText)
 *     label     대체 글 — 이미지가 뜻을 가졌으면(대체 글이 있었으면) 그 글을 자리 이름으로 남긴다(role="img" + aria-label).
 *               안 주면 장식 — 자리도 보조 기술에 숨긴다
 *
 * 모양 — 면 bg-neutral-weak(Skeleton 면과 같은 색), 그림 stroke-neutral-weak(면 위 1.14 · 다크 1.20 — 장식). 그림은 정사각으로
 *   가운데, 틀 높이의 50% 이고 16 보다 작아지지 않고 160 보다 커지지 않는다. 틀 폭이 그보다 좁으면 폭에 맞춘다 — 자리를 크기
 *   컨테이너로 두고(container-type: size) min(clamp(16px, 50cqh, 160px), 100cqw) 로 잰다(40 썸네일 20 · 360 × 270 사진 135).
 *   선 굵기는 24 격자 기준 1.5 — 그림이 커지면 같은 비율로 굵어진다(Result Section 아이콘과 같은 결). 움직임은 없다.
 * 그림 아이콘은 늘 보조 기술에 숨긴다(aria-hidden). 누르지 않는다 — 틀이 누르는 것이면 틀이 받는다.
 */

// 자리 — 틀을 채우는 크기 컨테이너, 가운데 그림
const ROOT =
  "flex size-full items-center justify-center overflow-hidden bg-bg-neutral-weak [container-type:size]";

// 그림 — 틀 높이의 50%(16 ~ 160), 틀 폭이 좁으면 폭. 선 굵기 1.5
const GLYPH =
  "flex size-[min(clamp(16px,50cqh,160px),100cqw)] shrink-0 items-center justify-center text-stroke-neutral-weak [&>svg]:size-full [&>svg]:[stroke-width:1.5]";

export interface ContentPlaceholderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** 그림 — lucide 선 아이콘, 기본 ImageIcon */
  icon?: React.ReactNode;
  /** 대체 글 — 주면 role="img" + 이름, 안 주면 보조 기술에 숨긴다 */
  label?: string;
}

const ContentPlaceholder = React.forwardRef<
  HTMLDivElement,
  ContentPlaceholderProps
>(({ icon, label, className, ...props }, ref) => {
  const named = label != null && label.trim() !== "";
  return (
    <div
      ref={ref}
      data-slot="content-placeholder"
      className={cn(ROOT, className)}
      {...(named
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="content-placeholder-glyph"
        className={GLYPH}
      >
        {icon ?? <ImageIcon />}
      </span>
    </div>
  );
});
ContentPlaceholder.displayName = "ContentPlaceholder";

export { ContentPlaceholder };
