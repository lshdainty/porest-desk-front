/**
 * 증권 화면 공용 표시 조각 — **증권사와 무관한 것만** 여기 있다.
 *
 * 토스 화면 안에 있던 것을 그대로 끌어냈다(마크업·스타일 무변경). 나무 화면이 같은 모습을
 * 자체 `<div>` + inline style 로 다시 짜면 두 벌이 각자 늙는다 — 이 워크스페이스에서 사본이
 * 각자 늙어 사고가 난 전례가 있다.
 *
 * 증권사별로 다른 것(랭킹·호가·체결·시장지표·보유 조회)은 각 페이지에 남는다.
 */
import { ChevronDown, ChevronUp, Search, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { tileRadius } from "@/shared/lib";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { fmtByCurrency, trendColor } from "../lib/format";

// ---- 등락률 배지 (색 + 부호 + 아이콘 3중 병기 — A11y 1.4.1) ----------------

export function PctBadge({ pct, size = 13 }: { pct: number; size?: number }) {
  const up = pct >= 0;
  const Chevron = up ? ChevronUp : ChevronDown;
  return (
    <span
      className="num"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color: trendColor(pct),
        fontWeight: 700,
        fontSize: size,
      }}
    >
      <Chevron size={size + 2} strokeWidth={2.6} />
      {up ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

// ---- 종목 심볼 배지 — 국가별 색 (다크 자동 light swap) -----------------------

const COUNTRY_TONE: Record<string, string> = {
  KR: "var(--color-cat-blue)",
  US: "var(--color-cat-violet)",
  CN: "var(--color-cat-orange)",
  JP: "var(--color-cat-pink)",
  HK: "var(--color-cat-green)",
  VN: "var(--color-cat-indigo)",
  // 국가가 아니라 '전체 포트폴리오' 행 — 종목 뱃지들과 한눈에 구분되게 다른 색을 준다.
  ALL: "var(--color-cat-green)",
};

export function StockBadge({
  name,
  symbol,
  countryCode,
  size = 40,
}: {
  name: string;
  symbol: string;
  countryCode: string;
  size?: number;
}) {
  const tone = COUNTRY_TONE[countryCode] ?? "var(--color-cat-blue)";
  // 한글명은 첫 글자, 알파벳 심볼은 앞 2글자.
  const initial = /^[A-Za-z]/.test(symbol)
    ? symbol.slice(0, 2)
    : name.slice(0, 1);
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: tileRadius(size),
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        background: `color-mix(in oklab, ${tone} 16%, var(--bg-surface))`,
        color: `color-mix(in oklab, ${tone} 72%, var(--fg-primary))`,
      }}
    >
      {initial}
    </span>
  );
}

// ---- 종목 리스트 행 (표시 전용 — 데이터는 각 패널이 공급) ---------------------

export type RowStock = {
  symbol: string;
  name: string;
  countryCode: string;
  currency: string;
};

export function StockRow({
  stock,
  onClick,
  sub,
  price,
  changePct,
  right,
  active,
  mobile = false,
  hideSymbol = false,
}: {
  stock: RowStock;
  onClick: () => void;
  sub?: string;
  price?: number | null;
  changePct?: number | null;
  right?: React.ReactNode;
  active?: boolean;
  mobile?: boolean;
  /**
   * 부제에서 심볼을 뺀다. **종목이 아닌 행**('전체 포트폴리오')이 쓴다 — 그 행의 심볼은
   * 선택 상태를 나르는 내부 토큰이라 화면에 나오면 안 된다.
   */
  hideSymbol?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        // 모바일은 좌우를 페이지가 쥔다(24) — 행이 더 얹으면 탭 스트립과 어긋난다.
        // 데스크톱은 Card 안이라 그대로.
        padding: mobile ? "12px 0" : "12px 14px",
        border: 0,
        cursor: "pointer",
        textAlign: "left",
        background: active ? "var(--bg-muted)" : "transparent",
        borderRadius: "var(--radius-md)",
        transition:
          "background var(--motion-duration-fast) var(--motion-ease-out)",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <StockBadge
        name={stock.name}
        symbol={stock.symbol}
        countryCode={stock.countryCode}
        size={40}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-body-sm)",
            fontWeight: 700,
            color: "var(--fg-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {stock.name}
        </div>
        <div
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {!hideSymbol && (
            <span style={{ fontWeight: 600 }}>{stock.symbol}</span>
          )}
          {sub && (
            <>
              {!hideSymbol && <span>·</span>}
              <span style={{ whiteSpace: "nowrap" }}>{sub}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 78 }}>
        {right ?? (
          <>
            <div
              className="num"
              style={{
                fontSize: "var(--text-body-sm)",
                fontWeight: 700,
                color: "var(--fg-primary)",
              }}
            >
              {price != null ? fmtByCurrency(price, stock.currency) : "—"}
            </div>
            {changePct != null && (
              <div style={{ marginTop: 1 }}>
                <PctBadge pct={changePct} size={11.5} />
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}

/**
 * 종목 리스트 래퍼 — 모바일 카드 다이어트(플랫: 행 hover 가 구분 담당) / 데스크톱 Card(padding 6).
 *
 * `fill` 은 **데스크톱 좌측 단에서 남는 세로를 목록이 먹고 그 안에서 스크롤**하게 한다.
 * 예전엔 목록이 자연 높이라 페이지가 통째로 스크롤했고, 상세가 목록보다 길면 좌측 아래가
 * 통째로 비었다. 스크롤을 Card 안쪽에 두는 이유는 테두리가 같이 밀려 올라가지 않게 하려는 것.
 */
export function ListWrap({
  mobile,
  children,
  fill,
}: {
  mobile: boolean;
  children: React.ReactNode;
  fill?: boolean;
}) {
  if (mobile) return <div>{children}</div>;
  return (
    <Card
      style={
        fill
          ? { padding: 6, flex: 1, minHeight: 0, overflowY: "auto" }
          : { padding: 6 }
      }
    >
      {children}
    </Card>
  );
}

/**
 * 검색 트리거 — 눌러서 검색 다이얼로그를 여는 읽기 전용 입력.
 *
 * 두 화면이 같은 다섯 줄을 각자 들고 있었다. 아이콘 위치(absolute · left 12 · 세로 중앙)가
 * 어긋나면 한쪽만 미묘하게 틀어지는데 그건 리뷰에서 안 보인다.
 */
export function StockSearchTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation("stocks");
  return (
    <div style={{ position: "relative" }}>
      <Search
        size={16}
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--fg-tertiary)",
          pointerEvents: "none",
        }}
      />
      <Input
        search
        readOnly
        placeholder={t("search.label")}
        className="w-full pl-9"
        style={{ cursor: "pointer" }}
        onClick={onClick}
      />
    </div>
  );
}

/** 패널 빈 상태 한 줄. 호가·체결·랭킹·관심목록이 같은 자리에 같은 모습으로 쓴다. */
export function PanelEmpty({ msg }: { msg: string }) {
  return (
    <div
      style={{
        padding: "36px 12px",
        textAlign: "center",
        color: "var(--fg-tertiary)",
        fontSize: "var(--text-label-sm)",
      }}
    >
      {msg}
    </div>
  );
}

// ---- 관심 등록 별 -----------------------------------------------------------

/**
 * 상세 헤더의 별. 관심목록은 `stock_watch` 하나뿐이라 **증권사와 무관**하다 —
 * 토스에서 누른 별이 나무에서도 별로 보인다(같은 종목 마스터를 가리킨다).
 */
export function WatchStar({
  watched,
  onToggle,
}: {
  watched: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation("stocks");
  return (
    <button
      type="button"
      onClick={onToggle}
      title={watched ? t("watch.remove") : t("watch.add")}
      aria-pressed={watched}
      style={{
        width: 38,
        height: 38,
        borderRadius: tileRadius(38),
        flexShrink: 0,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: watched
          ? "color-mix(in oklab, var(--color-cat-yellow) 18%, var(--bg-surface))"
          : "var(--bg-sunken)",
        border: "1px solid var(--border-subtle)",
        color: watched
          ? "color-mix(in oklab, var(--color-cat-yellow) 62%, var(--fg-primary))"
          : "var(--fg-tertiary)",
      }}
    >
      <Star
        size={18}
        strokeWidth={2}
        style={{ fill: watched ? "currentColor" : "none" }}
      />
    </button>
  );
}
