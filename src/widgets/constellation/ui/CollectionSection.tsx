import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { Badge } from "@/shared/ds/badge";
import { Button } from "@/shared/ds/button";
import { List, ListItem, ListTile } from "@/shared/ds/list";
import { cn } from "@/shared/lib/cn";
import {
  constellationDesc,
  constellationName,
  type CollectionEntry,
  type ConstellationCollection,
  type ConstellationToday,
} from "@/features/constellation";
import { BandFailure } from "@/shared/ui/groo/band-parts";
import { newestKeyOf } from "../lib/collection";
import { SKY_BG } from "../lib/sky";
import { ConstellationDetailDialog } from "./ConstellationDetailDialog";
import { ConstellationSVG } from "./ConstellationSVG";
import { ListRowSkeleton } from "./ReportRow";
import { HeadNote, SectionHead, type Place } from "./section-parts";

/**
 * 별자리 도감(I-11 11) — 머리 "별자리 도감" + 오른쪽 "{수집}/{전체} 수집", 설명, 87줄 모두. 줄은 ds List 보기 줄(맞춤 top · 사이 선 0):
 * 앞 타일 40(모은 별자리 = 하늘 바탕 + 점등 그림 · 못 모은 = neutral-weak + 자물쇠) · 제목 = 별자리 이름(같은 색 400) · 그 아래 2 에 배지 묶음
 * (오늘의 목표 solid brand · NEW weak warning · {n}회 weak informative · 미수집 weak neutral, 사이 4 줄바꿈) · 설명(단어 단위) ·
 * 뒤 [감상하기] / [미리보기] small neutralOutline — 줄 자체는 누르지 않는다.
 */
export function CollectionSection({
  place,
  state,
  onRetry,
  collection,
  todayKey,
  today,
}: {
  place: Place;
  state: "ready" | "loading" | "failed";
  onRetry: () => void;
  collection?: ConstellationCollection;
  todayKey: string;
  /** 오늘의 목표 별자리를 열면 하늘 카드와 같은 상세로 보인다(10-29 결정 3) */
  today?: ConstellationToday;
}) {
  const { t, i18n } = useTranslation("constellation");
  const [detail, setDetail] = useState<CollectionEntry | null>(null);
  const newestKey = newestKeyOf(collection?.entries ?? []);

  const head = (
    <SectionHead
      place={place}
      tight
      title={t("collection.title")}
      aside={
        collection ? (
          <HeadNote>
            {t("collection.progress", {
              collected: collection.collectedKinds,
              total: collection.entries.length,
            })}
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
          title={t("fail.collection")}
          onRetry={onRetry}
        />
      </section>
    );

  return (
    <section>
      {head}
      <p className="m-0 px-x6 pb-x1 text-t3 text-fg-neutral-subtle">
        {t("collection.subtitle")}
      </p>
      {state === "loading" || !collection ? (
        <div aria-busy>
          {Array.from({ length: 5 }, (_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      ) : (
        <List aria-label={t("collection.title")}>
          {collection.entries.map((entry) => {
            const key = entry.constellation.constellationKey;
            const owned = entry.collectCount > 0;
            const name = constellationName(entry.constellation, i18n.language);
            const description = owned
              ? constellationDesc(entry.constellation, i18n.language)
              : t("collection.lockedDesc", {
                  count: entry.constellation.starCount,
                });
            return (
              <ListItem
                key={key}
                align="top"
                prefix={
                  <ListTile
                    aria-hidden
                    className={cn(
                      owned
                        ? cn("text-fg-neutral-inverted", SKY_BG)
                        : "bg-bg-neutral-weak text-fg-neutral-subtle",
                    )}
                  >
                    {owned ? (
                      <ConstellationSVG
                        starMap={entry.constellation.starMap}
                        size={30}
                        lit={entry.constellation.starCount}
                        glow
                      />
                    ) : (
                      <Lock />
                    )}
                  </ListTile>
                }
                title={name}
                detail={
                  <>
                    <span className="mb-x0_5 mt-x0_5 flex flex-wrap gap-x1">
                      {key === todayKey && (
                        <Badge variant="solid" tone="brand">
                          {t("collection.todayBadge")}
                        </Badge>
                      )}
                      {key === newestKey && owned && (
                        <Badge variant="weak" tone="warning">
                          {t("collection.badgeNew")}
                        </Badge>
                      )}
                      {owned ? (
                        <Badge variant="weak" tone="informative">
                          {t("collection.timesCollected", {
                            count: entry.collectCount,
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="weak" tone="neutral">
                          {t("collection.notCollected")}
                        </Badge>
                      )}
                    </span>
                    <span className="block break-keep [overflow-wrap:break-word]">
                      {description}
                    </span>
                  </>
                }
                suffix={
                  <Button
                    type="button"
                    variant="neutralOutline"
                    size="small"
                    aria-label={t(
                      owned
                        ? "collection.viewOwnedNamed"
                        : "collection.viewLockedNamed",
                      { name },
                    )}
                    onClick={() => setDetail(entry)}
                  >
                    {owned
                      ? t("collection.viewOwned")
                      : t("collection.viewLocked")}
                  </Button>
                }
              />
            );
          })}
        </List>
      )}
      {detail && (
        <ConstellationDetailDialog
          entry={detail}
          today={today}
          onClose={() => setDetail(null)}
        />
      )}
    </section>
  );
}
