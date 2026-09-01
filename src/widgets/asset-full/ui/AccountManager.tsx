import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import type {
  Asset,
  AssetFormValues,
  AssetType,
  AssetUpdateFormValues,
} from "@/entities/asset";
import { AssetLogo } from "@/entities/asset";
import {
  useAssets,
  useCreateAsset,
  useDeleteAsset,
  useUpdateAsset,
} from "@/features/asset";
import { KRW } from "@/shared/lib/porest/format";
import { MaskAmount, WonUnit } from "@/shared/lib/porest/hide-amounts";
import { wonPre } from "@/shared/lib/porest/hide-amounts-core";
import { ConfirmDialog } from "@/shared/ui/porest/dialogs";
import { SwipeActions, type SwipeAction } from "@/shared/ui/swipe-actions";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  MANAGE_ROW,
  manageRowClass,
} from "@/shared/ui/porest/manage-row-tokens";
import {
  ManagerHead,
  ManagerShell,
  ManagerTabs,
} from "@/shared/ui/porest/manager-layout";
import { AssetDetailDialog } from "./AssetDetailDialog";
import {
  AssetEditDialog,
  type AssetGroup,
} from "./AssetEditDialog";

const GROUP_TYPES: Record<AssetGroup, AssetType[]> = {
  account: ["BANK_ACCOUNT", "SAVINGS", "CASH", "LOAN"],
  card: ["CREDIT_CARD", "CHECK_CARD"],
  invest: ["INVESTMENT"],
};

const groupOfAsset = (a: Asset): AssetGroup => {
  if (a.assetType === "CREDIT_CARD" || a.assetType === "CHECK_CARD") {
    return "card";
  }
  if (a.assetType === "INVESTMENT") return "invest";
  return "account";
};

type EditingState =
  { mode: "create"; group: AssetGroup } | { mode: "edit"; asset: Asset } | null;

/**
 * 모바일 행 구분선 제거 — 관리 리스트가 줄마다 선으로 잘려 보이던 걸 걷어낸다.
 *
 * `manageRowClass` 를 고치지 않는 이유: 카테고리·예산 관리가 같은 함수를 쓰는데
 * 거기까지 선이 사라진다. Tailwind `border-b-0` 을 덧붙이는 방법은 같은 속성끼리
 * 생성 순서로 이겨야 해서 클래스 나열 순서로는 보장되지 않는다 — inline 이 확실하다.
 */
const NO_DIVIDER = { borderBottom: "none" } as const;

export function AccountManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation("asset");
  const { t: tc } = useTranslation("common");
  const groupLabel = (g: AssetGroup) =>
    g === "account"
      ? t("group.account")
      : g === "card"
        ? t("group.card")
        : t("group.invest");
  const { data: assetsData, isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const assets: Asset[] = assetsData?.assets ?? [];

  const [tab, setTab] = useState<AssetGroup>("account");
  const [editing, setEditing] = useState<EditingState>(null);
  const [detail, setDetail] = useState<Asset | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Asset | null>(null);

  const counts = useMemo(() => {
    const base: Record<AssetGroup, number> = { account: 0, card: 0, invest: 0 };
    for (const a of assets) base[groupOfAsset(a)] += 1;
    return base;
  }, [assets]);

  const filtered = useMemo(
    () => assets.filter((a) => GROUP_TYPES[tab].includes(a.assetType)),
    [assets, tab],
  );

  // '총액 제외'(isIncludedInTotal === 'N') 자산은 탭 합계에서 제외.
  const totalInTab = useMemo(
    () =>
      filtered
        .filter((a) => a.isIncludedInTotal !== "N")
        .reduce((sum, a) => sum + (a.balance ?? 0), 0),
    [filtered],
  );

  const handleCreate = (values: AssetFormValues) => {
    createAsset.mutate(values, {
      onSuccess: () => setEditing(null),
    });
  };

  const handleUpdate = (values: AssetUpdateFormValues) => {
    if (!editing || editing.mode !== "edit") return;
    updateAsset.mutate(
      { id: editing.asset.rowId, data: values },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (asset: Asset) => {
    deleteAsset.mutate(asset.rowId, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  /**
   * 삭제 확인창 제목 — 자산 종류를 따른다. 상세와 스와이프가 **같은 함수**를 부른다:
   * spec `alert-dialog` 의 "같은 동작이면 어디서 불렀든 제목·설명이 같다".
   */
  const deleteTitleOf = (asset: Asset): string =>
    groupOfAsset(asset) === "account"
      ? t("deleteConfirm.titleAccount")
      : groupOfAsset(asset) === "card"
        ? t("deleteConfirm.titleCard")
        : t("deleteConfirm.titleInvest");

  /** 스와이프 트레이의 액션 — 의미 순서 `[수정, 삭제]` 로 넘긴다(뒤집는 건 컴포넌트가 한다). */
  const swipeActionsFor = (asset: Asset): SwipeAction[] => [
    {
      // 슬롯이 좁아 두 글자 라벨을 쓴다.
      label: tc("edit"),
      icon: <Pencil />,
      kind: "primary",
      // 상세를 닫고 수정으로 — 상세 footer 의 수정과 같은 목적지.
      onSelect: () => {
        setDetail(null);
        setEditing({ mode: "edit", asset });
      },
    },
    {
      label: tc("delete"),
      icon: <Trash2 />,
      kind: "destructive",
      // 제목도 본문도 아래 ConfirmDialog 와 같다 — 같은 삭제인데 문구가 갈리면
      // 어느 경로로 들어왔는지에 따라 다른 말이 나온다.
      confirm: {
        title: deleteTitleOf(asset),
        message: t("deleteConfirm.messageDetail", { name: asset.assetName }),
        loading: deleteAsset.isPending,
      },
      onSelect: () => deleteAsset.mutateAsync(asset.rowId),
    },
  ];

  const isSubmitting = createAsset.isPending || updateAsset.isPending;

  return (
    <>
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title={t("manager.title")}
            description={t("manager.description")}
          />
        )}

        {mobile ? (
          // header 바로 아래 full-width 흰띠 underline 탭 — 컨테이너 padding(24/20) 상쇄해 full-bleed flush.
          // sticky 기준이 content box(padding-top 24 아래)라 시각 최상단 고정엔 top 도 음수(-24) 필요.
          //   top:0 이면 24px 떠 보임. margin/top 은 스크롤 padding('24px 20px')과 일치. (CategoryManager 정합)
          <div
            style={{
              background: "var(--bg-surface)",
              margin: "-24px -20px 0",
              position: "sticky",
              top: -24,
              zIndex: 5,
            }}
          >
            <Tabs value={tab} onValueChange={(v) => setTab(v as AssetGroup)}>
              <TabsList variant="underline" className="w-full">
                <TabsTrigger
                  variant="underline"
                  value="account"
                  className="flex-1"
                >
                  {t("tab.accountDeposit")} {counts.account}
                </TabsTrigger>
                <TabsTrigger
                  variant="underline"
                  value="card"
                  className="flex-1"
                >
                  {t("group.card")} {counts.card}
                </TabsTrigger>
                <TabsTrigger
                  variant="underline"
                  value="invest"
                  className="flex-1"
                >
                  {t("group.invest")} {counts.invest}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : (
          <ManagerTabs<AssetGroup>
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "account",
                label: t("tab.accountDeposit"),
                count: counts.account,
              },
              { value: "card", label: t("group.card"), count: counts.card },
              {
                value: "invest",
                label: t("group.invest"),
                count: counts.invest,
              },
            ]}
          />
        )}

        {/* 총금액 label + list = 항상 한 div 묶음(사용자 결정). 사이 간격은 모바일 0(플랫 리스트라
            밀착) / 데스크톱 8 — 아래가 카드라 라벨이 붙으면 답답함. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: mobile ? 0 : 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-caption)",
                color: "var(--fg-tertiary)",
              }}
            >
              {t("manager.totalPrefix")}{" "}
              <MaskAmount card="asset.manage">
                {wonPre()}
                {KRW(totalInTab)}
              </MaskAmount>
              <WonUnit card="asset.manage" />
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setEditing({ mode: "create", group: tab })}
            >
              <Plus size={14} strokeWidth={2.4} />
              {t("addToGroup", { group: groupLabel(tab) })}
            </Button>
          </div>

          {/* 카드 다이어트 — 모바일은 카드(.cat-list) 벗기고 플랫 리스트(앱·카테고리 관리 정합). */}
          <div
            className={mobile ? undefined : "cat-list"}
            style={
              mobile
                ? { display: "flex", flexDirection: "column", marginTop: -8 }
                : { borderRadius: "var(--radius-lg)" }
            }
          >
            {isLoading ? (
              <AccountManagerSkeleton mobile={mobile} />
            ) : (
              <>
                {filtered.map((asset) => {
                  const g = groupOfAsset(asset);
                  const isCard = g === "card";
                  const balance = asset.balance ?? 0;
                  const amt = Math.abs(balance);
                  // 카드 사용액은 음수 표기 컨벤션, 계좌는 실제 부호(대출 등 음수 잔액).
                  // 0 은 부호·강조 없이 '0원' (−0원 방지).
                  const neg = (isCard ? -amt : balance) < 0;
                  return (
                    // 밀면 수정·삭제가 바로 나온다. 탭은 그대로 상세로 — 스와이프는
                    // 지름길이지 유일한 경로가 아니다(spec swipe-actions.md · WCAG 2.1.1).
                    // 데스크톱은 행에 인라인 편집·삭제 아이콘이 있어 통과시킨다.
                    <SwipeActions
                      key={asset.rowId}
                      rowId={`asset-${asset.rowId}`}
                      // 탭마다 갈라 둔다 — 탭을 바꿔도 이전 탭에서 열어 둔 행이 남아
                      // 있으면 엉뚱한 자산이 열린 것처럼 보인다.
                      groupTag={`asset-${tab}-list`}
                      rowLabel={asset.assetName}
                      enabled={mobile}
                      actions={swipeActionsFor(asset)}
                    >
                      <div
                        className={manageRowClass(mobile)}
                        style={{
                          cursor: "pointer",
                          ...(mobile ? NO_DIVIDER : null),
                        }}
                        onClick={() => setDetail(asset)}
                      >
                        {/* 카드 정식 이미지 → 없으면 회사 primary 색 모노그램. AssetLogo 단일 표현. */}
                        <AssetLogo
                          asset={asset}
                          size={36}
                          style={{
                            borderRadius: MANAGE_ROW.iconStyle.borderRadius,
                            fontSize: "var(--text-label-sm)",
                          }}
                        />
                        <div style={MANAGE_ROW.textStyle}>
                          <div style={MANAGE_ROW.labelStyle}>
                            {asset.assetName}
                          </div>
                          <div style={MANAGE_ROW.metaStyle}>
                            {asset.institution ||
                              asset.assetType.replace("_", " ").toLowerCase()}
                            {asset.memo && (
                              <>
                                <span className="dot-sep" />
                                {asset.memo}
                              </>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            marginRight: mobile ? 0 : 12,
                          }}
                        >
                          <div
                            className="num"
                            style={{
                              fontSize: "var(--text-body-sm)",
                              fontWeight: "var(--font-weight-bold)",
                              letterSpacing: "-0.012em",
                              color: "var(--fg-primary)",
                            }}
                          >
                            <MaskAmount card="asset.manage" mask="••••">
                              {neg ? "−" : ""}
                              {wonPre()}
                              {KRW(amt)}
                            </MaskAmount>
                            <WonUnit card="asset.manage" />
                          </div>
                          {asset.isIncludedInTotal === "N" && (
                            <div
                              style={{
                                fontSize: "var(--text-badge)",
                                color: "var(--fg-tertiary)",
                                marginTop: 2,
                              }}
                            >
                              {t("excludedFromTotal")}
                            </div>
                          )}
                        </div>
                        {!mobile && (
                          <div
                            className={MANAGE_ROW.actionsClassName}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              title={t("editAction")}
                              onClick={() =>
                                setEditing({ mode: "edit", asset })
                              }
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={MANAGE_ROW.delClassName}
                              onClick={() => setConfirmDelete(asset)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </SwipeActions>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="cat-list__empty">
                    <Wallet size={20} style={{ color: "var(--fg-tertiary)" }} />
                    <div>{t("noneInGroup", { group: groupLabel(tab) })}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ManagerShell>

      {editing && (
        <AssetEditDialog
          item={editing.mode === "edit" ? editing.asset : null}
          group={
            editing.mode === "edit"
              ? groupOfAsset(editing.asset)
              : editing.group
          }
          onClose={() => setEditing(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          mobile={mobile}
          isSubmitting={isSubmitting}
        />
      )}

      {detail && (
        <AssetDetailDialog
          asset={detail}
          onClose={() => setDetail(null)}
          onEdit={(asset) => {
            setEditing({ mode: "edit", asset });
            setDetail(null);
          }}
          onDelete={(asset) => {
            setConfirmDelete(asset);
            setDetail(null);
          }}
          mobile={mobile}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={deleteTitleOf(confirmDelete)}
          message={t("deleteConfirm.messageDetail", {
            name: confirmDelete.assetName,
          })}
          confirmLabel={t("deleteConfirm.confirm")}
          danger
          loading={deleteAsset.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </>
  );
}

/** AccountManager skeleton — asset row 리스트(icon + name + meta + 금액 + actions). */
function AccountManagerSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={manageRowClass(mobile)}
          style={mobile ? NO_DIVIDER : undefined}
        >
          <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
          <div style={MANAGE_ROW.textStyle}>
            <SkeletonBase className="h-4 w-32 mb-1.5" />
            <SkeletonBase className="h-3 w-20" />
          </div>
          <div style={{ textAlign: "right", marginRight: mobile ? 0 : 12 }}>
            <SkeletonBase className="h-4 w-24 ml-auto" />
          </div>
          {!mobile && (
            <div className="flex gap-1">
              <SkeletonBase className="h-7 w-14 rounded-md" />
              <SkeletonBase className="h-7 w-7 rounded-md" />
            </div>
          )}
        </div>
      ))}
    </>
  );
}
