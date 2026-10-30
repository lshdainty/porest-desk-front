import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { fmtByCurrency, trendColor } from "@/features/stock/lib/format";
import { PanelEmpty, PctBadge } from "@/features/stock/ui/stock-row";
import type { TossOrderbook, TossTrade } from "@/features/stock/api/stockApi";
import {
  useTossOrderbook,
  useTossTrades,
} from "@/features/stock/model/useTossStocks";

/** 라이브 체결 테이프 변환 (토스 trades). dir=직전 체결가 대비 방향. */
function liveTradeFills(
  trades?: TossTrade[],
): { time: string; p: number; q: number; dir: number }[] {
  if (!trades || trades.length === 0) return [];
  return trades.slice(0, 12).map((t, i, arr) => {
    const p = Number.parseFloat(t.price);
    const prev = i + 1 < arr.length ? Number.parseFloat(arr[i + 1]!.price) : p;
    const time = /(\d{2}:\d{2}:\d{2})/.exec(t.timestamp)?.[1] ?? t.timestamp;
    return {
      time,
      p,
      q: Math.round(Number.parseFloat(t.volume)),
      dir: p >= prev ? 1 : -1,
    };
  });
}

/** 호가 헤더행 — 라벨뿐인 정적 틀이라 로딩 중에도 그대로 렌더해야 해서 스켈레톤과 공용으로 뽑았다. */
function OrderBookHead() {
  const { t } = useTranslation("stocks");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 92px 1fr",
        fontSize: 10.5,
        color: "var(--fg-tertiary)",
        fontWeight: 600,
        marginBottom: 4,
        padding: "0 2px",
      }}
    >
      <span style={{ textAlign: "right", paddingRight: 6 }}>
        {t("orderbook.bidVolume")}
      </span>
      <span />
      <span style={{ textAlign: "left", paddingLeft: 6 }}>
        {t("orderbook.askVolume")}
      </span>
    </div>
  );
}

/** 호가 중앙 현재가 띠 — 값이 orderbook 이 아니라 시세 쿼리에서 오므로 호가 로딩 중에도 실값을 그린다. */
function OrderBookMid({
  currency,
  lastPrice,
  changePct,
}: {
  currency: string;
  lastPrice: number | null;
  changePct: number;
}) {
  return (
    <div
      style={{
        borderTop: "1px dashed var(--border-subtle)",
        borderBottom: "1px dashed var(--border-subtle)",
        margin: "3px 0",
        padding: "5px 0",
        textAlign: "center",
      }}
    >
      <span
        className="num"
        style={{
          fontSize: "var(--text-label-sm)",
          fontWeight: 800,
          color: trendColor(changePct),
        }}
      >
        {lastPrice != null ? fmtByCurrency(lastPrice, currency) : "—"}
      </span>
      <span style={{ marginLeft: 6 }}>
        <PctBadge pct={changePct} size={11} />
      </span>
    </div>
  );
}

function OrderBook({
  currency,
  lastPrice,
  book,
  changePct,
}: {
  currency: string;
  lastPrice: number | null;
  book: TossOrderbook;
  changePct: number;
}) {
  const fmt = (p: number) => fmtByCurrency(p, currency);
  // asks=낮은가격순 → 상단(높은가격 위) 위해 5개 잘라 역순, bids=높은가격순 그대로.
  const asks = book.asks
    .slice(0, 5)
    .map((e) => ({
      p: Number.parseFloat(e.price),
      q: Math.round(Number.parseFloat(e.volume)),
    }))
    .reverse();
  const bids = book.bids.slice(0, 5).map((e) => ({
    p: Number.parseFloat(e.price),
    q: Math.round(Number.parseFloat(e.volume)),
  }));
  const maxQ = Math.max(1, ...asks.map((a) => a.q), ...bids.map((b) => b.q));

  const Row = ({
    p,
    q,
    type,
  }: {
    p: number;
    q: number;
    type: "ask" | "bid";
  }) => {
    const isAsk = type === "ask";
    const col = isAsk ? "var(--fg-brand)" : "var(--status-danger-fg)";
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 92px 1fr",
          alignItems: "center",
          height: 26,
        }}
      >
        {isAsk ? (
          <span />
        ) : (
          <div
            style={{
              position: "relative",
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: `${(q / maxQ) * 100}%`,
                background: "var(--color-bg-critical-weak)",
                borderRadius: 4,
              }}
            />
            <span
              className="num"
              style={{
                position: "relative",
                fontSize: "var(--text-badge)",
                color: "var(--fg-tertiary)",
                paddingRight: 6,
              }}
            >
              {q.toLocaleString()}
            </span>
          </div>
        )}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className="num"
            style={{ fontSize: 12.5, fontWeight: 700, color: col }}
          >
            {fmt(p)}
          </span>
        </div>
        {isAsk ? (
          <div
            style={{
              position: "relative",
              height: 22,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(q / maxQ) * 100}%`,
                background: "var(--color-bg-brand-weak)",
                borderRadius: 4,
              }}
            />
            <span
              className="num"
              style={{
                position: "relative",
                fontSize: "var(--text-badge)",
                color: "var(--fg-tertiary)",
                paddingLeft: 6,
              }}
            >
              {q.toLocaleString()}
            </span>
          </div>
        ) : (
          <span />
        )}
      </div>
    );
  };

  return (
    <div>
      <OrderBookHead />
      {asks.map((a, i) => (
        <Row key={`a${i}`} {...a} type="ask" />
      ))}
      <OrderBookMid
        currency={currency}
        lastPrice={lastPrice}
        changePct={changePct}
      />
      {bids.map((b, i) => (
        <Row key={`b${i}`} {...b} type="bid" />
      ))}
    </div>
  );
}

// ---- 호가 / 체결 탭 카드 (실데이터 전용 · 로딩/빈 상태) -----------------------

/** 체결 테이프 헤더행 — 정적 라벨이라 로딩에도 그대로 렌더(스켈레톤·실렌더 공용). */
function TradeTapeHead() {
  const { t } = useTranslation("stocks");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        fontSize: 10.5,
        color: "var(--fg-tertiary)",
        fontWeight: 600,
        marginBottom: 4,
        padding: "0 2px",
      }}
    >
      <span>{t("quotes.tradeTime")}</span>
      <span style={{ textAlign: "right" }}>{t("quotes.tradePrice")}</span>
      <span style={{ textAlign: "right" }}>{t("quotes.tradeVolume")}</span>
    </div>
  );
}

// 잔량 바 폭 — 실렌더는 (q/maxQ)*100% 라 행마다 다르다. 리렌더마다 흔들리지 않게 5행치 고정.
const OB_BAR_W = ["62%", "38%", "78%", "45%", "55%"];

/**
 * 호가 로딩 — OrderBook 실렌더 정합: 헤더행 + 매도 5행 + 현재가 띠 + 매수 5행.
 * 행은 Row 와 같은 grid '1fr 92px 1fr' · height 26 이고, 잔량 바는 Row 안 height 22 자리를 그대로 차지한다
 * (바 radius 4 = SkeletonBase 기본 rounded-sm).
 */
function OrderBookSkeleton({
  currency,
  lastPrice,
  changePct,
  label,
}: {
  currency: string;
  lastPrice: number | null;
  changePct: number;
  label: string;
}) {
  const row = (key: string, type: "ask" | "bid", w: string) => (
    <div
      key={key}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 92px 1fr",
        alignItems: "center",
        height: 26,
      }}
    >
      {type === "bid" ? (
        // 매수 잔량 바는 실렌더에서 right:0 기준이라 오른쪽 정렬
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SkeletonBase className="h-[22px]" style={{ width: w }} />
        </div>
      ) : (
        <span />
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <SkeletonBase className="h-3 w-14" />
      </div>
      {type === "ask" ? (
        <SkeletonBase className="h-[22px]" style={{ width: w }} />
      ) : (
        <span />
      )}
    </div>
  );
  return (
    // 문구 로딩을 스켈레톤으로 바꾸면 스크린리더에 남는 안내가 없어진다 —
    // 기존 로딩 문구를 aria-label 로 살려 둔다(skeleton.md Accessibility 절).
    <div aria-busy aria-label={label}>
      <OrderBookHead />
      {OB_BAR_W.map((w, i) => row(`a${i}`, "ask", w))}
      <OrderBookMid
        currency={currency}
        lastPrice={lastPrice}
        changePct={changePct}
      />
      {[...OB_BAR_W].reverse().map((w, i) => row(`b${i}`, "bid", w))}
    </div>
  );
}

/** 체결 로딩 — 헤더행은 실제로 그리고, liveTradeFills 가 slice(0, 12) 라 데이터 12행(height 25)만 스켈레톤. */
function TradeTapeSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label}>
      <TradeTapeHead />
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr 1fr",
            alignItems: "center",
            height: 25,
          }}
        >
          <SkeletonBase className="h-3 w-12" />
          <SkeletonBase className="h-3 w-14 ml-auto" />
          <SkeletonBase className="h-3 w-10 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function QuotesCard({
  symbol,
  currency,
  lastPrice,
  changePct,
}: {
  symbol: string;
  currency: string;
  lastPrice: number | null;
  changePct: number;
}) {
  const { t } = useTranslation("stocks");
  const [tab, setTab] = useState<"book" | "tape">("book");
  const orderbookQ = useTossOrderbook(symbol);
  const tradesQ = useTossTrades(symbol);
  const fmt = (p: number) => fmtByCurrency(p, currency);
  const book = orderbookQ.data;
  const hasBook = !!book && book.asks.length > 0 && book.bids.length > 0;
  const fills = liveTradeFills(tradesQ.data);
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "book" | "tape")}>
          <TabsList variant="pill" size="sm" style={{ width: "100%" }}>
            <TabsTrigger variant="pill" value="book" style={{ flex: 1 }}>
              {t("quotes.orderbook")}
            </TabsTrigger>
            <TabsTrigger variant="pill" value="tape" style={{ flex: 1 }}>
              {t("quotes.trades")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {tab === "book" ? (
        orderbookQ.isLoading ? (
          <OrderBookSkeleton
            currency={currency}
            lastPrice={lastPrice}
            changePct={changePct}
            label={t("quotes.orderbookLoading")}
          />
        ) : hasBook ? (
          <OrderBook
            currency={currency}
            lastPrice={lastPrice}
            book={book}
            changePct={changePct}
          />
        ) : (
          <PanelEmpty msg={t("quotes.orderbookEmpty")} />
        )
      ) : tradesQ.isLoading ? (
        <TradeTapeSkeleton label={t("quotes.tradesLoading")} />
      ) : fills.length === 0 ? (
        <PanelEmpty msg={t("quotes.tradesEmpty")} />
      ) : (
        <div>
          <TradeTapeHead />
          {fills.map((f, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 1fr",
                alignItems: "center",
                height: 25,
                fontSize: 12,
              }}
            >
              <span className="num" style={{ color: "var(--fg-tertiary)" }}>
                {f.time}
              </span>
              <span
                className="num"
                style={{
                  textAlign: "right",
                  fontWeight: 700,
                  color: trendColor(f.dir),
                }}
              >
                {fmt(f.p)}
              </span>
              <span
                className="num"
                style={{ textAlign: "right", color: "var(--fg-secondary)" }}
              >
                {f.q.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
