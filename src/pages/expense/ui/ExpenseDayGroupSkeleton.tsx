import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";

export function ExpenseDayGroupSkeleton({ rows }: { rows: number }) {
  // 날짜 헤더 = DateGroupHeader 정합. row = ExpenseRow 정합: CategoryChip 40px(md) +
  // gap-3(12px) + title 14px / sub 12px + 우측 금액.
  // 카드 다이어트 — 데스크톱/모바일 모두 카드·divider 없이 행만 나열(실제 렌더 정합).
  const rowNodes = Array.from({ length: rows }).map((_, i) => (
    <div
      key={i}
      style={{
        padding: "12px 0 12px 2px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <SkeletonBase className="h-10 w-10 rounded-[12px] shrink-0" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <SkeletonBase className="h-3.5 w-3/4 mb-2" />
        <SkeletonBase className="h-3 w-1/3" />
      </div>
      <SkeletonBase className="h-3.5 w-20 shrink-0" />
    </div>
  ));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <SkeletonBase className="h-4 w-12" />
        <SkeletonBase className="h-4 w-5" />
        <SkeletonBase className="h-3.5 w-16 ml-auto" />
      </div>
      {rowNodes}
    </div>
  );
}
