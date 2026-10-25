import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Cloudy, Star, Telescope } from "lucide-react";
import { Badge } from "@/shared/ds/badge";
import { List, ListButtonItem, ListTile } from "@/shared/ds/list";
import { Skeleton } from "@/shared/ds/skeleton";
import { cn } from "@/shared/lib/cn";
import {
  constellationColorVar,
  constellationName,
  constellationWeakVar,
  type CollectionEntry,
  type ConstellationToday,
  type SkyDay,
} from "@/features/constellation";
import { SKY_BG, stageIconOf } from "../lib/sky";

/**
 * 관측 리포트 줄(I-11 9) — ds List 누르는 줄. 앞 하늘 타일 40(망원경 20) · 제목 "관측 리포트" + 오늘의 목표 배지 ·
 * 그 아래 6 에 최근 7일 주 점(지름 22 · 사이 5 · 점은 읽지 않는다) · 뒤 꺾쇠. 줄 이름 = "관측 리포트, 오늘의 목표 {이름}".
 */
export function ReportRow({
  today,
  sky,
  entries,
  onOpen,
}: {
  today: ConstellationToday;
  sky: SkyDay[];
  entries: CollectionEntry[];
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation("constellation");
  const name = constellationName(today.constellation, i18n.language);
  const days = useMemo(() => sky.slice(-7), [sky]);
  const todayISO = sky[sky.length - 1]?.date ?? "";
  const StageIcon = stageIconOf(today.points);
  const byKey = useMemo(() => {
    const map = new Map<string, CollectionEntry>();
    entries.forEach((entry) =>
      map.set(entry.constellation.constellationKey, entry),
    );
    return map;
  }, [entries]);

  return (
    <List aria-label={t("report.title")}>
      <ListButtonItem
        onClick={onOpen}
        aria-label={t("report.rowName", { name })}
        prefix={
          <ListTile
            aria-hidden
            className={cn("text-fg-neutral-inverted", SKY_BG)}
          >
            <Telescope />
          </ListTile>
        }
        title={
          <span className="inline-flex flex-wrap items-center gap-x-x1_5 gap-y-x1">
            <span>{t("report.title")}</span>
            <Badge
              variant="solid"
              tone="brand"
              prefixIcon={<Star />}
              className="max-w-full"
            >
              {name}
            </Badge>
          </span>
        }
        detail={
          <span aria-hidden className="mt-x1_5 flex gap-[5px]">
            {days.map((d) => {
              const isToday = d.date === todayISO;
              const grown = d.status === "GROWN" && d.constellationKey;
              const entry = grown ? byKey.get(d.constellationKey!) : null;
              const colorKey = entry
                ? entry.constellation.colorKey
                : (d.colorKey ?? null);
              const dot =
                "grid size-[22px] shrink-0 place-items-center rounded-full";
              if (isToday)
                return (
                  <span
                    key={d.date}
                    className={cn(
                      dot,
                      "bg-bg-brand-solid text-static-white [&>svg]:size-x3",
                    )}
                  >
                    <StageIcon />
                  </span>
                );
              if (grown && colorKey)
                return (
                  <span
                    key={d.date}
                    className={cn(dot, "[&>svg]:size-x3")}
                    style={{
                      background: constellationWeakVar(colorKey),
                      color: constellationColorVar(colorKey),
                    }}
                  >
                    <Star fill="currentColor" strokeWidth={0} />
                  </span>
                );
              if (d.status === "WITHERED")
                return (
                  <span
                    key={d.date}
                    className={cn(
                      dot,
                      "bg-bg-neutral-weak text-fg-neutral-subtle [&>svg]:size-x3",
                    )}
                  >
                    <Cloudy />
                  </span>
                );
              return (
                <span key={d.date} className={cn(dot, "bg-bg-neutral-weak")}>
                  <i className="block size-[4px] rounded-full bg-stroke-neutral-solid" />
                </span>
              );
            })}
          </span>
        }
        suffix={<ChevronRight aria-hidden />}
      />
    </List>
  );
}

/** 불러오는 동안 — 타일 40 · 두 줄(줄 값 그대로: 위아래 12 · 좌우 24 · 앞 붙이개 뒤 12) */
export function ListRowSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-x3 px-x6 py-x3">
      <Skeleton radius="12" className="size-x10 shrink-0" />
      <div className="min-w-0 flex-1">
        <Skeleton text="t5" className="w-1/2" />
        <Skeleton text="t3" className="mt-x1 w-3/4" />
      </div>
    </div>
  );
}
