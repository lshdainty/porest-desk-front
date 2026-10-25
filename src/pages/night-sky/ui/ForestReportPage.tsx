import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ds/card";
import {
  TopNavigation,
  TopNavigationBackButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { BandFailure } from "@/shared/ui/groo/band-parts";
import {
  AnalysisSection,
  MissedSection,
  ReportSkeleton,
  ResultSection,
  StarlightSection,
  WeekPicker,
  useReportModel,
} from "@/widgets/constellation";
import { NIGHT_SKY_PATH } from "@/shared/config";
import { DesktopFrame } from "./DesktopFrame";

type OutletCtx = { mobile: boolean };

/** 관측 리포트(`/desk/todo/night-sky/report`) — 폰은 흰 면 하나, 데스크톱은 카드(I-11 3 · 15 ~ 22). 폭으로 틀만 갈린다. */
export const ForestReportPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  return mobile ? <ForestReportMobile /> : <ForestReportDesktop />;
};

/**
 * 폰 — 상단 바(← "관측 리포트") + 흰 면 하나: 주 고르기 → 날 줄 → 날짜 줄 → 관측 결과 → 별빛 모으기 → 별빛 분석 → 못다 켠 별.
 * 흰 면은 짧은 날에도 화면 아래 끝까지 닿는다(T9). 질의가 실패하면 날 줄 아래 실패 상자 하나(서버 글 없음).
 */
function ForestReportMobile() {
  const { t } = useTranslation("constellation");
  const m = useReportModel();
  return (
    <>
      <TopNavigation type="standard">
        <TopNavigationBackButton fallbackHref={NIGHT_SKY_PATH} />
        <TopNavigationTitle>{t("report.title")}</TopNavigationTitle>
      </TopNavigation>
      <div
        data-slot="forest-report-mobile"
        className="flex-1 bg-bg-layer-default pb-[calc(var(--spacing-x2)+env(safe-area-inset-bottom))]"
      >
        <WeekPicker m={m} place="band" />
        {m.failed ? (
          <div className="pb-x6 pt-x3">
            <BandFailure
              band
              title={t("report.loadFailed")}
              onRetry={m.retry}
            />
          </div>
        ) : m.loading ? (
          <ReportSkeleton place="band" />
        ) : (
          <>
            <ResultSection m={m} place="band" />
            <StarlightSection m={m} place="band" />
            <AnalysisSection m={m} place="band" />
            <MissedSection m={m} place="band" />
          </>
        )}
      </div>
    </>
  );
}

/**
 * 데스크톱 · 태블릿 — 1280 이상 2 : 1 두 칸(왼쪽 ① 주 · 날 · 결과 → ② 별빛 분석, 오른쪽 ③ 별빛 모으기 → ④ 못다 켠 별),
 * 768 ~ 1279 한 칸 720(① ③ ② ④ — 폰 차례). 칸 사이 24 · 쌓은 카드 사이 8.
 */
function ForestReportDesktop() {
  const { t } = useTranslation("constellation");
  const { t: tl } = useTranslation("layout");
  const m = useReportModel();
  const head = (
    <Card className="pt-x4">
      <WeekPicker m={m} place="card" />
      {m.failed ? (
        <div className="pt-x3">
          <BandFailure
            title={t("report.loadFailed")}
            onRetry={m.retry}
            band={false}
          />
        </div>
      ) : m.loading ? (
        <ReportSkeleton place="card" />
      ) : (
        <ResultSection m={m} place="card" />
      )}
    </Card>
  );
  const ready = !m.failed && !m.loading;
  return (
    <DesktopFrame
      slot="forest-report-desktop"
      parent={{ to: NIGHT_SKY_PATH, label: tl("nightSky") }}
      title={t("report.title")}
    >
      <div className="flex flex-col gap-x2 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-[var(--layout-gutter)]">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-x2">
          <div className="order-1 lg:order-none">{head}</div>
          {ready && (
            <Card className="order-3 lg:order-none">
              <AnalysisSection m={m} place="card" />
            </Card>
          )}
        </div>
        {ready && (
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-x2">
            <Card className="order-2 lg:order-none">
              <StarlightSection m={m} place="card" />
            </Card>
            {(m.missed.length > 0 || m.isToday) && (
              <Card body="list" className="order-4 lg:order-none">
                <MissedSection m={m} place="card" />
              </Card>
            )}
          </div>
        )}
      </div>
    </DesktopFrame>
  );
}
