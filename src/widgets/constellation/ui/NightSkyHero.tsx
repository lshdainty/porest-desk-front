import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cloud, Moon, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SKY_BG } from "../lib/sky";
import {
  constellationName,
  parseStarMap,
  type ConstellationToday,
} from "@/features/constellation";

/**
 * 밤하늘 히어로 — 오늘의 목표 별자리가 별빛만큼 점등된다.
 * 하늘 바탕은 역할 색 그라디언트(01-033 C — `SKY_BG`), 글은 흐르는 차례로 쌓아 겹치지 않고(I-11 8), 글 · 아이콘 색은
 * `fg-neutral-inverted` 하나다 — 불투명도로 흐리지 않는다. 점 · 선 · 달빛 같은 장식(aria-hidden)만 투명도를 남긴다.
 * 폰 · 원장 펼침은 안 여백 20 · 최소 168, 데스크톱 카드(`wide`)는 24 · 220.
 */
const SKY_DIM_STARS: [number, number][] = [
  [5, 18],
  [11, 72],
  [17, 30],
  [22, 84],
  [28, 12],
  [33, 52],
  [38, 88],
  [45, 8],
  [55, 90],
  [62, 10],
  [68, 86],
  [75, 20],
  [83, 78],
  [90, 14],
  [95, 52],
  [8, 48],
  [92, 82],
  [60, 30],
  [20, 58],
  [86, 44],
];

export function NightSkyHero({
  today,
  doneToday,
  wide = false,
}: {
  today: ConstellationToday;
  doneToday: number;
  /** 데스크톱 카드 — 안 여백 24 · 최소 높이 220 (폰 20 · 168) */
  wide?: boolean;
}) {
  const { t, i18n } = useTranslation("constellation");
  const map = useMemo(
    () => parseStarMap(today.constellation.starMap),
    [today.constellation.starMap],
  );
  const lit = Math.min(today.points, today.goal);
  const done = today.collected;
  const name = constellationName(today.constellation, i18n.language);
  const lineColor = done
    ? "color-mix(in srgb, var(--color-fg-neutral-inverted) 85%, transparent)"
    : "color-mix(in srgb, var(--color-fg-neutral-inverted) 50%, transparent)";

  const caption = done
    ? t("hero.captionDone")
    : doneToday > 0 || today.memoPoints > 0
      ? [
          t("hero.captionProgress", { count: doneToday }),
          today.memoPoints > 0
            ? t("hero.captionMemo", { count: today.memoPoints })
            : null,
          t("hero.captionRemain", { count: today.goal - lit }),
        ]
          .filter(Boolean)
          .join(" · ")
      : t("hero.captionEmpty");

  return (
    <div
      role="group"
      aria-label={t("hero.label", { name, lit, goal: today.goal })}
      data-slot="night-sky-hero"
      className={cn(
        "relative flex min-h-[168px] flex-col overflow-hidden rounded-r4 p-x5 text-fg-neutral-inverted",
        wide && "min-h-[220px] p-x6",
        SKY_BG,
      )}
    >
      {/* 장식 — 달빛 · 잔별 · 별자리 그림(aria-hidden, 투명도 남김) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -20,
            width: 180,
            height: 180,
            borderRadius: 999,
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-fg-neutral-inverted) 16%, transparent) 0%, transparent 65%)",
          }}
        />
        {SKY_DIM_STARS.map(([x, y], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 2.5 : 1.5,
              height: i % 3 === 0 ? 2.5 : 1.5,
              borderRadius: 999,
              background:
                "color-mix(in srgb, var(--color-fg-neutral-inverted) 32%, transparent)",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {/* 별자리 figure — 비율 유지 박스 (중앙), 글 아래 배경 층 */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            bottom: "24%",
            left: "50%",
            transform: "translateX(-50%)",
            aspectRatio: "1.45",
          }}
        >
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {map.edges.map(([a, b], i) => {
              const pa = map.pts[a];
              const pb = map.pts[b];
              if (!pa || !pb || a >= lit || b >= lit) return null;
              return (
                <line
                  key={i}
                  x1={pa[0]}
                  y1={pa[1]}
                  x2={pb[0]}
                  y2={pb[1]}
                  stroke={lineColor}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeDasharray={done ? "none" : "3 4"}
                />
              );
            })}
          </svg>
          {map.pts.map(([x, y], i) => {
            const on = i < lit;
            // 별 수 적응형 점 크기 — 실좌표 별자리(최대 27별)의 밀집 구간 겹침 방지
            const dense = map.pts.length > 15;
            const onSize = dense ? (wide ? 6 : 5) : wide ? 8 : 7;
            const offSize = dense ? 3.5 : 5;
            return (
              <span
                key={i}
                className={on ? "constellation-pop" : undefined}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  width: on ? onSize : offSize,
                  height: on ? onSize : offSize,
                  borderRadius: 999,
                  transform: "translate(-50%, -50%)",
                  background: on
                    ? "var(--color-fg-neutral-inverted)"
                    : "transparent",
                  border: on
                    ? "none"
                    : "1px solid color-mix(in srgb, var(--color-fg-neutral-inverted) 45%, transparent)",
                  boxShadow: on
                    ? `0 0 ${done ? 14 : 9}px 2px color-mix(in srgb, var(--color-fg-neutral-inverted) ${done ? 80 : 55}%, transparent)`
                    : "none",
                  transition:
                    "all var(--motion-duration-fast) var(--motion-ease-out)",
                }}
              />
            );
          })}
        </div>
      </div>
      <Moon
        aria-hidden
        className="absolute right-x4 top-x4 size-x5 text-fg-neutral-inverted"
      />

      {/* 글은 흐르는 차례로 — 오늘의 목표 → 이름 + 별빛 → (남는 높이) → 캡션 → 연속 · 보호 */}
      <p className="relative m-0 text-t3 text-fg-neutral-inverted">
        {t("hero.todayTarget")}
      </p>
      <p className="relative m-0 mt-x0_5 flex flex-wrap items-baseline gap-x-x2 pr-x6 text-t8 font-bold break-keep text-fg-neutral-inverted [overflow-wrap:break-word]">
        <span className="min-w-0">
          {done ? t("hero.collectedBang", { name }) : name}
        </span>
        <span className="whitespace-nowrap text-t4 font-bold tabular-nums">
          {t("hero.starlightCount", { lit, goal: today.goal })}
        </span>
      </p>
      <p className="relative m-0 mt-auto pt-x6 text-t3 break-keep text-fg-neutral-inverted [overflow-wrap:break-word]">
        {caption}
      </p>
      <p className="relative m-0 mt-x2 flex flex-wrap items-center gap-x-x3 gap-y-x1_5 text-t3 text-fg-neutral-inverted">
        <span className="inline-flex items-start gap-x1 font-bold">
          <span aria-hidden className="flex h-[1lh] items-center">
            <Sparkles className="size-x3_5 shrink-0" />
          </span>
          {t("hero.streak", { count: today.streak })}
        </span>
        <span className="inline-flex items-start gap-x1">
          <span aria-hidden className="flex h-[1lh] items-center">
            <Cloud className="size-x3_5 shrink-0" />
          </span>
          {t("hero.guardInfo", { count: today.guardCount })}
        </span>
      </p>
    </div>
  );
}
