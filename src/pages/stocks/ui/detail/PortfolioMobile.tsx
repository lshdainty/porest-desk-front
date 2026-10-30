import { isHardError } from "@/features/stock/lib/query-state";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TopNavigation,
  TopNavigationBackButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { brokerPath } from "@/features/stock/lib/broker";
import { mergeNamuHoldings } from "@/features/stock/lib/holdings";
import { num } from "@/features/stock/lib/format";
import { useNamuHoldings } from "@/features/stock/model/useNamu";
import { useSecuritiesExchangeRate } from "@/features/stock/model/useSecuritiesPrices";
import {
  useTossAccounts,
  useTossExchangeRate,
  useTossHoldings,
} from "@/features/stock/model/useTossStocks";
import { CompositionBody } from "@/features/stock/ui/phone/composition";
import {
  composition,
  namuHoldingLines,
  tossHoldingLines,
} from "../../model/invest";

/** 포트폴리오 구성 페이지 — 폰(I-13 19). 상단 바 ← + "포트폴리오 구성", 띠 하나(도넛 + 범례). 비중은 원화 환산 */
export function PortfolioMobile({ broker }: { broker: "TOSS" | "NAMU" }) {
  const { t } = useTranslation("stocks");
  return (
    <>
      <TopNavigation type="standard">
        <TopNavigationBackButton fallbackHref={brokerPath(broker)} />
        <TopNavigationTitle>{t("portfolio.title")}</TopNavigationTitle>
      </TopNavigation>
      <ScreenBands>
        <div data-band="flush">
          {broker === "TOSS" ? <TossComposition /> : <NamuComposition />}
        </div>
      </ScreenBands>
    </>
  );
}

function TossComposition() {
  const { t } = useTranslation("stocks");
  const accountsQ = useTossAccounts();
  const seq = accountsQ.data?.[0]?.accountSeq ?? null;
  const holdingsQ = useTossHoldings(seq);
  const fxQ = useTossExchangeRate();
  const fx = fxQ.data ? num(fxQ.data.rate) : null;
  const data = useMemo(() => {
    const c = composition(tossHoldingLines(holdingsQ.data?.items ?? [], fx));
    return {
      items: c.items,
      notice: c.fxMissing ? t("namu.donutNeedsFx") : undefined,
    };
  }, [holdingsQ.data, fx, t]);
  return (
    <CompositionBody
      data={data}
      loading={accountsQ.isLoading || (seq != null && holdingsQ.isLoading)}
      failed={isHardError(accountsQ) || isHardError(holdingsQ)}
      onRetry={() => {
        void accountsQ.refetch();
        void holdingsQ.refetch();
      }}
    />
  );
}

function NamuComposition() {
  const { t } = useTranslation("stocks");
  const krwQ = useNamuHoldings("KRW");
  const usdQ = useNamuHoldings("USD");
  const fxQ = useSecuritiesExchangeRate();
  const view = useMemo(
    () => mergeNamuHoldings(krwQ.data, usdQ.data, fxQ.data?.rate ?? null),
    [krwQ.data, usdQ.data, fxQ.data],
  );
  const c = composition(namuHoldingLines(view));
  return (
    <CompositionBody
      data={{
        items: c.items,
        notice:
          view.fxMissing || c.fxMissing ? t("namu.donutNeedsFx") : undefined,
      }}
      loading={krwQ.isLoading || usdQ.isLoading}
      failed={isHardError(krwQ) && isHardError(usdQ)}
      onRetry={() => {
        void krwQ.refetch();
        void usdQ.refetch();
      }}
    />
  );
}
