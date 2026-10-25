import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Card } from "@/shared/ds/card";
import { List, ListButtonItem, ListTile } from "@/shared/ds/list";
import { cn } from "@/shared/lib/cn";
import {
  constellationName,
  type ConstellationToday,
} from "@/features/constellation";
import { SKY_BG } from "../lib/sky";
import { ConstellationSVG } from "./ConstellationSVG";

/**
 * 밤하늘 줄(I-11 5) — 1280 왼쪽 칸의 입구. ds Card `body="list"` 안 누르는 줄 하나: 앞 하늘 타일 40(별자리 선 24) ·
 * 제목 "오늘의 밤하늘 · {이름}"(수집했으면 "{이름} 수집 완료!") · 설명 "별빛 {lit}/{goal} · 연속 {n}일" · 뒤 꺾쇠. 누르면 밤하늘 화면.
 */
export function ForestStrip({
  today,
  onOpen,
}: {
  today: ConstellationToday;
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation("constellation");
  const lit = Math.min(today.points, today.goal);
  const name = constellationName(today.constellation, i18n.language);
  return (
    <Card body="list" data-slot="forest-strip">
      <List>
        <ListButtonItem
          onClick={onOpen}
          prefix={
            <ListTile
              aria-hidden
              className={cn("text-fg-neutral-inverted", SKY_BG)}
            >
              <ConstellationSVG
                starMap={today.constellation.starMap}
                size={24}
                lit={today.collected ? undefined : lit}
              />
            </ListTile>
          }
          title={
            today.collected
              ? t("strip.done", { name })
              : t("strip.title", { name })
          }
          detail={t("strip.desc", {
            lit,
            goal: today.goal,
            count: today.streak,
          })}
          suffix={<ChevronRight aria-hidden />}
        />
      </List>
    </Card>
  );
}
