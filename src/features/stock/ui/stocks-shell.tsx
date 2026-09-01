/**
 * 증권 화면 골격 — **두 증권사가 같은 껍데기를 쓴다.**
 *
 * 예전엔 토스·나무가 데스크톱 2단 그리드·모바일 스택·상세 시트를 각자 복제해 들고 있었다.
 * 골격이 같은데 사본이 둘이면 한쪽만 고쳐지고 서로 조용히 어긋난다 — 이 워크스페이스에서
 * 사본이 각자 늙어 사고가 난 전례가 있다. 그래서 배치는 여기 하나만 둔다.
 *
 * ## 3층 — 요약 스트립 / 상태 줄 / 본문 2단
 *
 * ```
 * ┌ 스트립 (전폭 타일)                                   ┐
 * ├ 상태 줄 (장 상태 · 출처)                              ┤
 * ├ 목록 352px ┆ 상세 (남는 폭 전부)                      ┤
 * └ 각자 안에서 스크롤                                     ┘
 * ```
 *
 * ## 왜 viewport 에 고정하나
 *
 * 예전 그리드는 `alignItems:'start'` 에 페이지가 자연 높이였다. 그래서 **두 단의 높이가
 * 각자 놀았다** — 종목을 고르면 상세가 1,600px 로 늘고 목록은 800px 에서 끝나 좌측 아래
 * 절반이 비고, 아무것도 안 고르면 반대로 우측이 안내문 한 줄만 남았다. 게다가 화면 전체가
 * 통짜로 스크롤해 목록을 내리면 상세가 같이 올라갔다.
 *
 * 이제 페이지가 `flex-1 min-h-0` 으로 뷰포트를 채우고(`AppLayout` 의 스크롤 래퍼가
 * `flex-col` 이라 가능하다 — `ExpensePage` 가 쓰는 것과 같은 패턴), **두 pane 이 각자
 * 안에서 스크롤한다.** 어느 쪽도 상대방 때문에 늘어나지 않으므로 빈 여백이 안 생긴다.
 *
 * 모바일은 그대로 스택 + 상세 시트다 — 좁은 화면에서 2단을 접을 자리가 없다.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/card";
import { ModalShell } from "@/shared/ui/porest/dialogs";
import { MobileBackHeader } from "@/shared/ui/porest/mobile-back-header";

/** 좌측 단 고정 폭. 종목명 + 평가금액 + 등락률이 줄바꿈 없이 들어가는 최소치다. */
const LIST_COL_WIDTH = 352;

export interface StocksShellProps {
  mobile: boolean;
  /** 셸이 끼워 넣는 증권사 탭(모바일 전용). 연결이 하나뿐이면 없다. */
  header?: ReactNode;
  /** 1층 — 요약 타일 줄. */
  strip: ReactNode;
  /** 2층 — 장 상태·출처 한 줄. */
  statusLine?: ReactNode;
  /** 3층 좌 — 검색·세그먼트·목록. {@link ListPanel} 로 감싸 넘긴다. */
  list: ReactNode;
  /** 3층 우 — 종목 상세 또는 포트폴리오 개요. */
  detail: ReactNode;
  /** 모바일에서 상세 시트를 띄울지. 데스크톱은 항상 우측에 그린다. */
  detailOpen?: boolean;
  onCloseDetail?: () => void;
  dialogs?: ReactNode;
}

export function StocksShell({
  mobile,
  header,
  strip,
  statusLine,
  list,
  detail,
  detailOpen,
  onCloseDetail,
  dialogs,
}: StocksShellProps) {
  const { t } = useTranslation("stocks");

  // ---- 모바일: 풀스크린(← 헤더) + 스택 + 상세 시트 ----
  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t("nav.title")} />
        <div
          style={{
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {header}
          {strip}
          {statusLine}
          {list}
          {detailOpen && (
            <ModalShell
              title={t("detail.sheetTitle")}
              onClose={() => onCloseDetail?.()}
              mobile
              mobileMinHeight="88dvh"
            >
              {detail}
            </ModalShell>
          )}
          {dialogs}
        </div>
      </>
    );
  }

  // ---- 데스크톱/태블릿: viewport fit 2단 ----
  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ padding: 24, gap: 12 }}
    >
      {header}
      {strip}
      {statusLine}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${LIST_COL_WIDTH}px minmax(0, 1fr)`,
          // 행을 못 박아 둔다. 지금은 자식들이 `min-height: 0` 을 들고 있어 기본 `auto` 행으로도
          // 안 넘치지만(실측 확인), 자식 하나가 그걸 잃는 순간 `auto` 행이 콘텐츠만큼 늘어나
          // 화면 전체가 통짜로 스크롤하는 예전 상태로 조용히 되돌아간다. 그 회귀는 눈으로만
          // 보이고 테스트에 안 걸려서, 여기서 막아 둔다.
          gridTemplateRows: "minmax(0, 1fr)",
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        {list}
        {detail}
      </div>
      {dialogs}
    </div>
  );
}

/**
 * 좌측 목록 단. 검색·세그먼트는 고정이고 **목록만 안에서 스크롤한다.**
 *
 * 스크롤을 목록에만 주는 이유 — 검색창과 탭이 같이 밀려 올라가면 종목을 찾다가 검색으로
 * 돌아오려고 다시 위로 스크롤해야 한다. 자주 쓰는 조작을 늘 같은 자리에 둔다.
 */
export function ListPanel({
  mobile,
  search,
  segments,
  filter,
  children,
}: {
  mobile: boolean;
  search: ReactNode;
  segments: ReactNode;
  /** 시장 필터 칩(나무 전용 — 국내/해외 축이 여기로 내려왔다). */
  filter?: ReactNode;
  children: ReactNode;
}) {
  // 모바일은 페이지가 통째로 스크롤한다 — 목록에 따로 스크롤을 주면 스크롤이 겹친다.
  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {search}
        {segments}
        {filter}
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 11,
        minHeight: 0,
      }}
    >
      {search}
      {segments}
      {filter}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 우측 상세 단. 데스크톱은 카드 안에서 스크롤하고, 모바일은 시트 본문이라 껍데기가 없다.
 */
export function DetailPane({
  mobile,
  children,
}: {
  mobile: boolean;
  children: ReactNode;
}) {
  if (mobile) return <>{children}</>;
  return (
    <Card style={{ padding: 24, minHeight: 0, overflowY: "auto" }}>
      {children}
    </Card>
  );
}
