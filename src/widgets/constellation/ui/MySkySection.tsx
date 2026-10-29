import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cloudy } from "lucide-react";
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
import { BandFailure } from "@/shared/ui/groo/band-parts";
import { stageIconOf } from "../lib/sky";
import { ConstellationSVG } from "./ConstellationSVG";
import {
  HeadNote,
  SectionBody,
  SectionHead,
  type Place,
} from "./section-parts";

/**
 * 나의 밤하늘(I-11 10) — 최근 2주 관측 격자. 머리 "나의 밤하늘" + 오른쪽 "누적 n개", 설명, 7열 격자(최대 448 · 가로 6 · 세로 8).
 * 칸은 정사각 · 모서리 10 · 누르지 않는다 — 칸마다 `role="img"` 이름("10월 21일, 수집 {이름}" · "흐린 밤" · "쉰 밤" · "오늘").
 * 오늘 = brand-weak + 안쪽 2px fg-brand + 단계 아이콘 16 · 수집 = chart-{색}-weak + 별자리 선 그림 22 chart-{색} · 흐린 밤 = neutral-weak +
 * cloudy 16 — 불투명도로 흐리지 않는다 · 쉰 날 = neutral-weak + 점 4. 날 숫자 t2 · 500 · fg-neutral-subtle(오늘 700 · fg-brand).
 */
export function MySkySection({
  place,
  state,
  onRetry,
  sky,
  today,
  entries,
}: {
  place: Place;
  state: "ready" | "loading" | "failed";
  onRetry: () => void;
  sky: SkyDay[];
  today?: ConstellationToday;
  entries: CollectionEntry[];
}) {
  const { t, i18n } = useTranslation("constellation");
  const ko = i18n.language.startsWith("ko");
  const byKey = useMemo(() => {
    const map = new Map<string, CollectionEntry>();
    entries.forEach((entry) =>
      map.set(entry.constellation.constellationKey, entry),
    );
    return map;
  }, [entries]);
  const todayISO = sky[sky.length - 1]?.date ?? "";
  const StageIcon = stageIconOf(today?.points ?? 0);
  const dateName = (ds: string) =>
    new Date(`${ds}T00:00:00`).toLocaleDateString(ko ? "ko-KR" : "en-US", {
      month: "long",
      day: "numeric",
    });

  // 서버가 늘 14일을 준다 — 0일이면 구역을 그리지 않는다
  if (state === "ready" && sky.length === 0) return null;

  const head = (
    <SectionHead
      place={place}
      tight
      title={t("mySky.title")}
      aside={
        today ? (
          <HeadNote>
            {t("mySky.total", { count: today.totalCollected })}
          </HeadNote>
        ) : undefined
      }
    />
  );
  if (state === "failed")
    return (
      <section>
        {head}
        <BandFailure
          band={place === "band"}
          title={t("fail.sky")}
          onRetry={onRetry}
        />
      </section>
    );

  return (
    <section>
      {head}
      <SectionBody place={place}>
        <p className="m-0 mb-x3 text-t3 text-fg-neutral-subtle">
          {t("mySky.subtitle")}
        </p>
        <ul
          className="m-0 grid max-w-[448px] list-none grid-cols-[repeat(7,minmax(0,1fr))] gap-x-x1_5 gap-y-x2 p-0"
          aria-busy={state === "loading" || undefined}
        >
          {state === "loading"
            ? Array.from({ length: 14 }, (_, i) => (
                <li
                  key={i}
                  aria-hidden
                  className="flex flex-col items-center gap-x1"
                >
                  <Skeleton radius="12" className="aspect-square w-full" />
                  <Skeleton text="t2" className="w-1/2" />
                </li>
              ))
            : sky.map((day) => {
                const dayNum = parseInt(day.date.slice(8), 10);
                const isToday = day.date === todayISO;
                const entry = day.constellationKey
                  ? byKey.get(day.constellationKey)
                  : undefined;
                const grown = day.status === "GROWN" && entry;
                const colorKey = day.colorKey ?? entry?.constellation.colorKey;
                const label = isToday
                  ? t("mySky.cellToday", { date: dateName(day.date) })
                  : grown
                    ? t("mySky.cellCollected", {
                        date: dateName(day.date),
                        name: constellationName(
                          entry.constellation,
                          i18n.language,
                        ),
                      })
                    : day.status === "WITHERED"
                      ? t("mySky.cellCloudy", { date: dateName(day.date) })
                      : t("mySky.cellRest", { date: dateName(day.date) });
                return (
                  <li
                    key={day.date}
                    className="flex min-w-0 flex-col items-center gap-x1"
                  >
                    <span
                      role="img"
                      aria-label={label}
                      className={cn(
                        "grid aspect-square w-full place-items-center rounded-r2_5",
                        isToday
                          ? "bg-bg-brand-weak text-fg-brand shadow-[inset_0_0_0_2px_var(--color-fg-brand)]"
                          : grown
                            ? ""
                            : "bg-bg-neutral-weak text-fg-neutral-subtle",
                      )}
                      style={
                        !isToday && grown && colorKey
                          ? {
                              background: constellationWeakVar(colorKey),
                              color: constellationColorVar(colorKey),
                            }
                          : undefined
                      }
                    >
                      {isToday ? (
                        <StageIcon aria-hidden className="size-x4" />
                      ) : grown ? (
                        <ConstellationSVG
                          starMap={entry.constellation.starMap}
                          size={22}
                          linesOnly
                        />
                      ) : day.status === "WITHERED" ? (
                        <Cloudy aria-hidden className="size-x4" />
                      ) : (
                        <i className="block size-[4px] rounded-full bg-stroke-neutral-solid" />
                      )}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "text-t2 tabular-nums",
                        isToday
                          ? "font-bold text-fg-brand"
                          : "font-medium text-fg-neutral-subtle",
                      )}
                    >
                      {dayNum}
                    </span>
                  </li>
                );
              })}
        </ul>
      </SectionBody>
    </section>
  );
}
