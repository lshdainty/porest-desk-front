import { cn } from "@/shared/lib/index";
import { Skeleton } from "@/shared/ui/skeleton";

interface CardSkeletonProps {
  className?: string;
  lines?: number;
}

export const CardSkeleton = ({ className, lines = 3 }: CardSkeletonProps) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-default shadow-sm p-4 space-y-3",
        className,
      )}
    >
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-1/2" : "w-full")}
        />
      ))}
    </div>
  );
};

interface ListSkeletonProps {
  className?: string;
  rows?: number;
  showAvatar?: boolean;
}

export const ListSkeleton = ({
  className,
  rows = 5,
  showAvatar = false,
}: ListSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton className="h-9 w-9 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 차트 스켈레톤 막대 높이(%) — 결정적 시퀀스.
 *
 * 예전엔 `Math.random()` 으로 뽑았는데 렌더마다 막대가 튀었다(그리고 렌더 중
 * 순수하지 않은 호출이라 React Compiler 가 이 컴포넌트 최적화를 포기한다).
 * 앱 `PChartSkeleton.barHeights` 와 같은 값이다 — 웹·앱이 같은 모양으로 뜬다.
 */
const BAR_HEIGHTS = [50, 80, 65, 95, 45, 75, 60];

interface ChartSkeletonProps {
  className?: string;
  bars?: number;
}

export const ChartSkeleton = ({ className, bars = 7 }: ChartSkeletonProps) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-default shadow-sm p-4 space-y-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: bars }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length]}%` }}
          />
        ))}
      </div>
    </div>
  );
};

interface TableSkeletonProps {
  className?: string;
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({
  className,
  rows = 5,
  columns = 4,
}: TableSkeletonProps) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-default shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex gap-4 border-b bg-surface-input/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            "flex gap-4 px-4 py-3",
            rowIdx < rows - 1 && "border-b",
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn("h-4 flex-1", colIdx === 0 && "w-1/3")}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
