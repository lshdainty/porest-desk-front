import type { ReactNode } from "react";
import { PageHead } from "@/shared/ui/groo/page-head";
import { ParentLink } from "@/shared/ui/groo/parent-link";

/**
 * 데스크톱 · 태블릿 하위 화면 틀(I-11 6 · 13 · 22) — 위에 "‹ {부모}"(적힌 부모로 push · 단추 ↔ 제목 줄 4), 제목 줄(PageHead h1 · 설명 없음),
 * 제목 줄 ↔ 첫 카드 24(T13). 본문 폭은 768 ~ 1279 최대 720 가운데 · 1280 이상 최대 1040(medium).
 */
export function DesktopFrame({
  slot,
  parent,
  title,
  children,
}: {
  slot: string;
  parent: { to: string; label: string };
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      data-slot={slot}
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto w-full max-w-[var(--layout-max-low)] lg:max-w-[var(--layout-max-medium)]">
        <div className="mb-x1">
          <ParentLink to={parent.to} label={parent.label} />
        </div>
        <PageHead title={title} style={{ marginBottom: "var(--spacing-x6)" }} />
        {children}
      </div>
    </div>
  );
}
