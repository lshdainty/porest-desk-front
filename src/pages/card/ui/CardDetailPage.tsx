import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PageHead } from "@/shared/ui/groo/page-head";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { useAsset } from "@/features/asset";
import { CardDetailWidget } from "@/widgets/card-detail";
import { useDeviceSize } from "@/shared/lib/groo/responsive";

export const CardDetailPage = () => {
  const { t } = useTranslation("card");
  const { assetRowId } = useParams<{ assetRowId: string }>();
  const navigate = useNavigate();
  // 폰 구역 화면(띠) · 데스크톱 카드 — 이 페이지는 Outlet ctx 밖 라우트라 디바이스 훅으로 판정.
  const mobile = useDeviceSize() === "mobile";

  const assetId = Number(assetRowId);
  const { data: asset, isLoading } = useAsset(assetId);

  if (!assetRowId || Number.isNaN(assetId)) {
    return (
      <div className="p-6 text-sm text-fg-critical">
        {t("cardDetail.invalidAssetId")}
      </div>
    );
  }

  return (
    // max-w-3xl 금지 — groo --spacing-3xl 이 Tailwind 스케일을 가려 48px 로 컴파일됨.
    // 폰은 구역 띠가 화면 폭이라 페이지 여백 없이(I-01 결정 3). 폰 머리에 ← 가 없어 뒤로 버튼은
    // 띠 위 바닥에 둔다 — 상단 바 ← 로 옮기는 것은 화면 이관 때.
    <div
      className={
        mobile
          ? "flex flex-col"
          : "mx-auto w-full max-w-[48rem] space-y-4 px-5 py-6 md:p-6"
      }
    >
      {!mobile && <PageHead title={asset?.assetName ?? t("cardDetail.back")} />}
      <div className={mobile ? "px-x4 pt-x2" : undefined}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("cardDetail.back")}
        </Button>
      </div>

      {isLoading && (
        <div className={mobile ? "screen-bands" : "space-y-4"}>
          {/* CardInfoHeader: 카드 이미지(h-32 w-52) + 회사명/카드명/배지 — 모바일은 셸 카드 없이 */}
          {mobile ? (
            <>
              <div className="flex flex-col gap-5 sm:flex-row">
                <SkeletonBase className="h-32 w-52 shrink-0 self-center rounded-lg sm:self-start" />
                <div className="flex-1 space-y-2">
                  <SkeletonBase className="h-4 w-1/3" />
                  <SkeletonBase className="h-7 w-2/3" />
                  <div className="flex gap-1.5">
                    <SkeletonBase className="h-5 w-12 rounded-full" />
                    <SkeletonBase className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <SkeletonBase className="h-4 w-24" />
                <SkeletonBase className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <SkeletonBase className="h-3 w-16" />
                  <SkeletonBase className="h-3 w-20" />
                </div>
              </div>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
                  <SkeletonBase className="h-32 w-52 shrink-0 self-center rounded-lg sm:self-start" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBase className="h-4 w-1/3" />
                    <SkeletonBase className="h-7 w-2/3" />
                    <div className="flex gap-1.5">
                      <SkeletonBase className="h-5 w-12 rounded-full" />
                      <SkeletonBase className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1.5 p-5">
                  <SkeletonBase className="h-4 w-24" />
                  <SkeletonBase className="h-2 w-full rounded-full" />
                  <div className="flex justify-between">
                    <SkeletonBase className="h-3 w-16" />
                    <SkeletonBase className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* 없는 카드(404)·비활성 쿼리 — 종전엔 이 자리가 비어 뒤로 버튼만 남았다(QA #4).
          사용자에게는 '삭제됐다'와 '주소가 틀렸다'가 같은 결과라 한 문구로 받는다. */}
      {!isLoading && !asset && (
        <div className="m-x4 rounded-md border bg-surface-default p-4 text-sm md:m-0 md:bg-muted/50">
          {t("cardDetail.notFound")}
        </div>
      )}

      {!isLoading && asset && !asset.cardCatalog && (
        <div className="m-x4 rounded-md border bg-surface-default p-4 text-sm md:m-0 md:bg-muted/50">
          {t("cardDetail.noCardCatalog")}
        </div>
      )}

      {!isLoading && asset?.cardCatalog && (
        <CardDetailWidget
          cardCatalogRowId={asset.cardCatalog.rowId}
          assetRowId={asset.rowId}
          mobile={mobile}
        />
      )}
    </div>
  );
};
