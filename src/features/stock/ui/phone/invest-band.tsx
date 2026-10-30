import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChartPie, ChevronRight } from "lucide-react";
import { CardStat, type DeltaProps } from "@/shared/ds/card";
import { withCommaBreaks } from "@/shared/ds/i18n";
import { List, ListButtonItem, ListItem, ListTile } from "@/shared/ds/list";
import { Skeleton } from "@/shared/ds/skeleton";
import { BandFailure } from "@/shared/ui/groo/band-parts";

/*
 * 띠 ① 내 투자(I-13 7 · 8) — 지표(라벨 · 금액 · 증감) + 키-값 줄 + 포트폴리오 구성 줄.
 * 띠 안은 카드 안과 같다: 위 24 · 좌우 24 · 아래 24. 지표 아래 12 에 키-값, 키-값 줄은 제 좌우 24 를 갖는다.
 * 금액은 글로 만들어 넘긴다(원까지 · 가리기 반영) — 이 부품은 값을 모른다.
 */

export interface InvestRow {
  key: string;
  name: string;
  value: ReactNode;
}

export function InvestBand({
  label,
  amount,
  delta,
  note,
  rows,
  onOpenPortfolio,
  extraLinks,
  loading,
  failed,
  onRetry,
  emptyNote,
}: {
  label: string;
  amount: string;
  delta?: DeltaProps;
  /** 지표 아래 한 줄 설명(환율 적용 — 증감 아님) */
  note?: string;
  rows: InvestRow[];
  /** 포트폴리오 구성 페이지로 — 없으면 줄을 두지 않는다 */
  onOpenPortfolio: (() => void) | null;
  /** 포트폴리오 구성 줄 다음에 오는 줄(나무 "계좌 자세히") */
  extraLinks?: ReactNode;
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  /** 보유가 없을 때 지표 아래 글(나무) */
  emptyNote?: string;
}) {
  const { t } = useTranslation("stocks");
  return (
    <section aria-labelledby="stocks-invest-title" data-section="invest">
      <h2 id="stocks-invest-title" className="sr-only">
        {t("invest.title")}
      </h2>
      {failed ? (
        <div className="pb-x6 pt-x3">
          <BandFailure
            band
            title={t("invest.failTitle")}
            onRetry={onRetry ?? (() => {})}
          />
        </div>
      ) : (
        <div className="pb-x6 pt-x6">
          <div className="px-x6">
            {loading ? (
              <div aria-busy className="flex flex-col items-start">
                <span className="text-t3 font-medium text-fg-neutral-subtle">
                  {label}
                </span>
                <Skeleton text="t9" className="mt-x1 w-3/5" />
                <Skeleton text="t4" className="mt-x1 w-2/5" />
              </div>
            ) : (
              <CardStat label={label} value={amount} delta={delta} />
            )}
            {!loading && note && (
              <p className="m-0 mt-x1 text-t3 text-fg-neutral-subtle">{note}</p>
            )}
            {!loading && emptyNote && (
              <p className="m-0 mt-x2 text-t4 text-fg-neutral-subtle">
                {emptyNote}
              </p>
            )}
          </div>
          <List className="mt-x3" aria-label={t("invest.title")}>
            {rows.map((r) => (
              <ListItem
                key={r.key}
                title={r.name}
                className="[&_[data-slot=list-content]]:py-x2"
                suffix={
                  loading ? (
                    <Skeleton text="t5" className="w-16" />
                  ) : (
                    <span
                      data-slot="kv-value"
                      className="text-end text-t5 font-bold tabular-nums text-fg-neutral"
                    >
                      {typeof r.value === "string"
                        ? withCommaBreaks(r.value)
                        : r.value}
                    </span>
                  )
                }
              />
            ))}
            {onOpenPortfolio && <PortfolioLink onOpen={onOpenPortfolio} />}
            {extraLinks}
          </List>
        </div>
      )}
    </section>
  );
}

/** 포트폴리오 구성 줄 — 앞 아이콘 타일(회색 옅은 바탕) · 제목 · 설명 · 꺾쇠. 종목 타일이 아니다 */
function PortfolioLink({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation("stocks");
  return (
    <ListButtonItem
      prefix={
        <ListTile className="bg-bg-neutral-weak text-fg-neutral">
          <ChartPie size={20} aria-hidden />
        </ListTile>
      }
      title={t("portfolio.title")}
      detail={t("portfolio.allSub")}
      suffix={
        <ChevronRight
          size={20}
          aria-hidden
          className="text-fg-neutral-subtle"
        />
      }
      onClick={onOpen}
    />
  );
}
