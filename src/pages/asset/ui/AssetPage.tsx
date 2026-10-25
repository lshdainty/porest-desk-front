import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ds/button";
import { Card } from "@/shared/ds/card";
import { ProgressCircle } from "@/shared/ds/progress-circle";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { PageHead } from "@/shared/ui/groo/page-head";
import { useHideAmounts } from "@/shared/lib/groo/hide-amounts-core";
import { useOpenHideAmountsSettings } from "@/shared/lib/groo/hide-amounts-nav";
import { AssetDetailDialog } from "@/widgets/asset-full/ui/AssetDetailDialog";
import { editAssetPath, type Asset } from "@/entities/asset";
import { useAssetGroups, type OutletCtx } from "./asset-model";
import {
  AssetEmpty,
  CompositionSection,
  GroupSection,
  SavingGoalsSection,
  SummarySection,
  UpcomingBillsSection,
} from "./asset-parts";

export const AssetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  return mobile ? <AssetMobile /> : <AssetDesktop />;
};

/** 자산 상세 대화상자 — 줄을 누르면 연다(상세 페이지로 바꾸는 것은 I-17 17-3). 수정은 그 자산의 폼 주소로 간다(D9) */
function useDetail(mobile: boolean) {
  const navigate = useNavigate();
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const dialog = detailAsset && (
    <AssetDetailDialog
      asset={detailAsset}
      mobile={mobile}
      onClose={() => setDetailAsset(null)}
      // 그 자산의 수정 폼으로 바로 간다(D9) — 목록에서 다시 찾아 연필을 누르지 않게.
      // 폼은 설정의 관리 화면 한 곳에 있고, 여기선 주소로 어느 자산인지만 넘긴다.
      onEdit={(a) => {
        navigate(editAssetPath(a.rowId));
        setDetailAsset(null);
      }}
    />
  );
  return { open: setDetailAsset, dialog };
}

const isEmptyOf = (g: ReturnType<typeof useAssetGroups>) =>
  !g.isLoading &&
  !g.assetsFailed &&
  g.accounts.length === 0 &&
  g.cards.length === 0 &&
  g.investments.length === 0 &&
  g.loans.length === 0;

/**
 * 데스크톱 자산(768 이상) — 카드, 격자 minmax(0,1.4fr) minmax(0,1fr), 칸 사이 24 · 쌓은 카드 사이 8.
 * 768 ~ 1279 는 한 칸 720 가운데(순자산 → 구성 → 다가오는 청구 → 묶음 → 저축 목표), 1280 이상 두 칸 최대 1040(Q4 4B).
 */
function AssetDesktop() {
  const { t } = useTranslation("asset");
  const hidden = useHideAmounts();
  const g = useAssetGroups();
  const detail = useDetail(false);
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다.
  const handleHideToggle = useOpenHideAmountsSettings("asset");
  const isEmpty = isEmptyOf(g);
  const open = detail.open;

  return (
    <div
      data-slot="asset-desktop"
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto w-full max-w-[var(--layout-max-low)] lg:max-w-[var(--layout-max-medium)]">
        <span role="status" className="sr-only">
          {g.isFetching ? t("refreshing") : ""}
        </span>
        <PageHead
          title={
            <span className="inline-flex items-center gap-x3">
              {t("assets")}
              {/* 새로 고침 중 — 버튼이 아니라 섹션 새로 고침이다(뒤를 계속 써도 된다): 제목 옆 원 24.
                  제목(h1)의 이름에 들어가지 않게 장식으로 숨기고, 진행 알림은 아래 role="status" 한 곳에서 한다 */}
              {g.isFetching && (
                <span aria-hidden className="inline-flex">
                  <ProgressCircle size="24" />
                </span>
              )}
            </span>
          }
          description={t("subtitle")}
          actions={
            <>
              <Button
                type="button"
                variant="neutralOutline"
                size="small"
                aria-label={t("hideAmountsSettings")}
                onClick={handleHideToggle}
              >
                {hidden ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                {t("hideAmount")}
              </Button>
              <Button
                type="button"
                variant="neutralOutline"
                size="small"
                onClick={g.refetch}
              >
                <RefreshCw aria-hidden />
                {t("refresh")}
              </Button>
            </>
          }
        />
        {isEmpty ? (
          <Card>
            <AssetEmpty size="medium" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-x2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-[var(--layout-gutter)]">
            <div className="flex min-w-0 flex-col gap-x2">
              <Card>
                <SummarySection g={g} place="card" />
              </Card>
              <Card>
                <CompositionSection g={g} />
              </Card>
              <Card body="list">
                <UpcomingBillsSection />
              </Card>
            </div>
            <div className="flex min-w-0 flex-col gap-x2">
              <Card body="list">
                <GroupSection
                  place="card"
                  g={g}
                  card="asset.accounts"
                  title={t("accountDepositTitle")}
                  assets={g.accounts}
                  total={g.accountsTotal}
                  onOpenDetail={open}
                />
              </Card>
              {g.investments.length > 0 && (
                <Card body="list">
                  <GroupSection
                    place="card"
                    g={g}
                    card="asset.investments"
                    title={t("group.invest")}
                    assets={g.investments}
                    total={g.investmentsTotal}
                    onOpenDetail={open}
                    investValMap={g.investValMap}
                  />
                </Card>
              )}
              <Card body="list">
                <GroupSection
                  place="card"
                  g={g}
                  card="asset.cards"
                  title={t("group.card")}
                  assets={g.cards}
                  total={g.cardsTotal}
                  negativeTotal
                  onOpenDetail={open}
                />
              </Card>
              {g.loans.length > 0 && (
                <Card body="list">
                  <GroupSection
                    place="card"
                    g={g}
                    card="asset.loans"
                    title={t("assetType.loan")}
                    assets={g.loans}
                    total={g.loansTotal}
                    negativeTotal
                    onOpenDetail={open}
                  />
                </Card>
              )}
              <Card body="list">
                <SavingGoalsSection place="card" />
              </Card>
            </div>
          </div>
        )}
      </div>
      {detail.dialog}
    </div>
  );
}

/**
 * 폰 자산 — 띠: 순자산 요약 → 입출금 → 투자(있으면) → 카드 → 대출(있으면) → 저축 목표. 띠 사이 8 만 틈이다(I-05 74).
 * 앱 `asset_screen.dart` 와 같은 구조 · 같은 값이다(짝 1).
 */
function AssetMobile() {
  const g = useAssetGroups();
  const { t } = useTranslation("asset");
  const detail = useDetail(true);
  const open = detail.open;

  if (isEmptyOf(g)) {
    return (
      <ScreenBands>
        <div data-band="flush" data-section="empty">
          <div className="px-x6 py-x6">
            <AssetEmpty size="large" />
          </div>
        </div>
      </ScreenBands>
    );
  }
  return (
    // 폰 구역 화면 — 순자산 요약 · 자산 묶음마다 화면 폭 흰 띠(I-01 결정 3)
    <ScreenBands>
      <div data-band="flush" data-section="summary">
        <SummarySection g={g} place="band" />
      </div>
      {/* 목록 질의 하나가 실패하면 상자는 요약 띠에 하나뿐이다 — 묶음 띠는 두지 않는다(08-1 0307ba35 와 같은 규칙, 데스크톱은 카드마다) */}
      {!g.assetsFailed && (
        <>
          <div data-band="flush" data-section="accounts">
            <GroupSection
              place="band"
              g={g}
              card="asset.accounts"
              title={t("accountDepositTitle")}
              assets={g.accounts}
              total={g.accountsTotal}
              onOpenDetail={open}
            />
          </div>
          {g.investments.length > 0 && (
            <div data-band="flush" data-section="investments">
              <GroupSection
                place="band"
                g={g}
                card="asset.investments"
                title={t("group.invest")}
                assets={g.investments}
                total={g.investmentsTotal}
                onOpenDetail={open}
                investValMap={g.investValMap}
              />
            </div>
          )}
          <div data-band="flush" data-section="cards">
            <GroupSection
              place="band"
              g={g}
              card="asset.cards"
              title={t("group.card")}
              assets={g.cards}
              total={g.cardsTotal}
              negativeTotal
              onOpenDetail={open}
            />
          </div>
          {g.loans.length > 0 && (
            <div data-band="flush" data-section="loans">
              <GroupSection
                place="band"
                g={g}
                card="asset.loans"
                title={t("assetType.loan")}
                assets={g.loans}
                total={g.loansTotal}
                negativeTotal
                onOpenDetail={open}
              />
            </div>
          )}
        </>
      )}
      <div data-band="flush" data-section="goals">
        <SavingGoalsSection place="band" />
      </div>
      {detail.dialog}
    </ScreenBands>
  );
}

export default AssetPage;
