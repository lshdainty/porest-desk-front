import { useTranslation } from "react-i18next";
import { withCommaBreaks } from "@/shared/ds/i18n";
import { List, ListItem } from "@/shared/ds/list";
import { ResultSection } from "@/shared/ds/result-section";
import { Skeleton } from "@/shared/ds/skeleton";
import { ChartPie } from "lucide-react";
import { BandFailure } from "@/shared/ui/groo/band-parts";
import { Donut } from "@/shared/ui/groo/charts";
import { MaskAmount } from "@/shared/lib/groo/hide-amounts";

/*
 * 포트폴리오 구성 본문(I-13 19) — 도넛 112 가운데(가운데 글 "{n}종목") + 아래 12 에 범례 줄.
 * 범례는 List 키-값 줄: 앞 색 칸 10(모서리 2) + 종목 이름(줄바꿈) · 값 비중 "98.95%".
 * 색은 지금 PortfolioDonut 의 차트 색 배정 그대로. 환율이 없어 비중을 못 내면 도넛 대신 Result Section empty small.
 */

const PALETTE = [
  "var(--color-chart-blue)",
  "var(--color-chart-green)",
  "var(--color-chart-violet)",
  "var(--color-chart-orange)",
  "var(--color-chart-pink)",
  "var(--color-chart-indigo)",
  "var(--color-chart-brown)",
];

export interface CompositionView {
  items: { key: string; name: string; pct: number }[];
  /** 비중을 낼 수 없는 이유(환율 없음) — 있으면 도넛 대신 이 글 */
  notice?: string;
}

const pctText = (n: number) =>
  `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export function CompositionBody({
  data,
  loading,
  failed,
  onRetry,
}: {
  data: CompositionView;
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}) {
  const { t } = useTranslation("stocks");
  if (failed)
    return (
      <div className="py-x6">
        <BandFailure
          band
          title={t("portfolio.failTitle")}
          onRetry={onRetry ?? (() => {})}
        />
      </div>
    );
  if (loading)
    return (
      <div aria-busy className="flex flex-col items-center gap-x3 px-x6 py-x6">
        <Skeleton radius="full" className="size-28" />
        <Skeleton text="t5" className="w-full" />
        <Skeleton text="t5" className="w-full" />
      </div>
    );
  if (data.notice)
    return (
      <div className="px-x6 py-x6">
        <ResultSection
          kind="empty"
          size="medium"
          as="h3"
          icon={<ChartPie aria-hidden />}
          title={data.notice}
        />
      </div>
    );
  if (data.items.length === 0)
    return (
      <div className="px-x6 py-x6">
        <ResultSection
          kind="empty"
          size="medium"
          as="h3"
          icon={<ChartPie aria-hidden />}
          title={t("holdings.empty")}
        />
      </div>
    );
  const colored = data.items.map((it, i) => ({
    ...it,
    color: PALETTE[i % PALETTE.length]!,
  }));
  return (
    <div className="pb-x6 pt-x6">
      <div className="flex justify-center px-x6">
        <Donut
          size={112}
          stroke={20}
          segments={colored.map((c) => ({ value: c.pct, color: c.color }))}
        >
          <span className="text-t4 font-bold tabular-nums text-fg-neutral">
            {t("unit.stocksCount", { count: colored.length })}
          </span>
        </Donut>
      </div>
      <List className="mt-x3" aria-label={t("portfolio.title")}>
        {colored.map((c) => (
          <ListItem
            key={c.key}
            className="[&_[data-slot=list-content]]:py-x2"
            prefix={
              <span
                aria-hidden
                className="block size-2.5 rounded-[2px]"
                style={{ background: c.color }}
              />
            }
            title={c.name}
            suffix={
              <span className="text-end text-t5 font-bold tabular-nums text-fg-neutral">
                <MaskAmount card="stocks.summary">
                  {withCommaBreaks(pctText(c.pct))}
                </MaskAmount>
              </span>
            }
          />
        ))}
      </List>
    </div>
  );
}
