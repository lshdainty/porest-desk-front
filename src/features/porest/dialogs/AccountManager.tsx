import { useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import type { Asset, AssetFormValues, AssetType, AssetUpdateFormValues } from '@/entities/asset'
import {
  useAssets,
  useCreateAsset,
  useDeleteAsset,
  useUpdateAsset,
} from '@/features/asset'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { getBrandColor } from '@/shared/lib/porest/bank-colors'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { MANAGE_ROW } from '@/shared/ui/porest/manage-row'
import { ManagerHead, ManagerShell, ManagerTabs } from '@/shared/ui/porest/manager-layout'
import { AssetDetailDialog } from '@/widgets/asset-full/ui/AssetDetailDialog'
import { AssetEditDialog, type AssetGroup } from './AssetEditDialog'

const GROUP_TYPES: Record<AssetGroup, AssetType[]> = {
  account: ['BANK_ACCOUNT', 'SAVINGS', 'CASH', 'LOAN'],
  card: ['CREDIT_CARD', 'CHECK_CARD'],
  invest: ['INVESTMENT'],
}

const groupOfAsset = (a: Asset): AssetGroup => {
  if (a.assetType === 'CREDIT_CARD' || a.assetType === 'CHECK_CARD') {
    return 'card'
  }
  if (a.assetType === 'INVESTMENT') return 'invest'
  return 'account'
}

const groupLabel = (g: AssetGroup) => (g === 'account' ? '계좌' : g === 'card' ? '카드' : '투자')

type EditingState =
  | { mode: 'create'; group: AssetGroup }
  | { mode: 'edit'; asset: Asset }
  | null

export function AccountManager({ mobile }: { mobile: boolean }) {
  const { data: assetsData, isLoading } = useAssets()
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()

  const assets: Asset[] = assetsData?.assets ?? []

  const [tab, setTab] = useState<AssetGroup>('account')
  const [editing, setEditing] = useState<EditingState>(null)
  const [detail, setDetail] = useState<Asset | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Asset | null>(null)

  const counts = useMemo(() => {
    const base: Record<AssetGroup, number> = { account: 0, card: 0, invest: 0 }
    for (const a of assets) base[groupOfAsset(a)] += 1
    return base
  }, [assets])

  const filtered = useMemo(
    () => assets.filter(a => GROUP_TYPES[tab].includes(a.assetType)),
    [assets, tab],
  )

  // '총액 제외'(isIncludedInTotal === 'N') 자산은 탭 합계에서 제외.
  const totalInTab = useMemo(
    () =>
      filtered
        .filter(a => a.isIncludedInTotal !== 'N')
        .reduce((sum, a) => sum + (a.balance ?? 0), 0),
    [filtered],
  )

  const handleCreate = (values: AssetFormValues) => {
    createAsset.mutate(values, {
      onSuccess: () => setEditing(null),
    })
  }

  const handleUpdate = (values: AssetUpdateFormValues) => {
    if (!editing || editing.mode !== 'edit') return
    updateAsset.mutate(
      { id: editing.asset.rowId, data: values },
      { onSuccess: () => setEditing(null) },
    )
  }

  const handleDelete = (asset: Asset) => {
    deleteAsset.mutate(asset.rowId, {
      onSuccess: () => setConfirmDelete(null),
    })
  }

  const isSubmitting = createAsset.isPending || updateAsset.isPending

  return (
    <>
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title="계좌·카드 관리"
            description="연결된 자산을 관리합니다. 계좌, 카드, 투자 상품을 추가하거나 편집할 수 있어요."
          />
        )}

        {mobile ? (
          // header 바로 아래 full-width 흰띠 underline 탭 — 컨테이너 padding(24/20) 상쇄해 full-bleed flush.
          // sticky 기준이 content box(padding-top 24 아래)라 시각 최상단 고정엔 top 도 음수(-24) 필요.
          //   top:0 이면 24px 떠 보임. margin/top 은 스크롤 padding('24px 20px')과 일치. (CategoryManager 정합)
          <div style={{ background: 'var(--bg-surface)', margin: '-24px -20px 0', position: 'sticky', top: -24, zIndex: 5 }}>
            <Tabs value={tab} onValueChange={v => setTab(v as AssetGroup)}>
              <TabsList variant="underline" className="w-full">
                <TabsTrigger variant="underline" value="account" className="flex-1">
                  계좌·예금 {counts.account}
                </TabsTrigger>
                <TabsTrigger variant="underline" value="card" className="flex-1">
                  카드 {counts.card}
                </TabsTrigger>
                <TabsTrigger variant="underline" value="invest" className="flex-1">
                  투자 {counts.invest}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ) : (
          <ManagerTabs<AssetGroup>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'account', label: '계좌·예금', count: counts.account },
              { value: 'card', label: '카드', count: counts.card },
              { value: 'invest', label: '투자', count: counts.invest },
            ]}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
            총 <MaskAmount>{KRW(totalInTab)}</MaskAmount>
            <HideUnit>원</HideUnit>
          </div>
          <Button variant="accent" size="sm" onClick={() => setEditing({ mode: 'create', group: tab })}>
            <Plus size={14} strokeWidth={2.4} />
            {groupLabel(tab)} 추가
          </Button>
        </div>

        <div className="cat-list" style={{ marginTop: -12, borderRadius: 'var(--radius-lg)' }}>
          {isLoading ? (
            <AccountManagerSkeleton mobile={mobile} />
          ) : (
            <>
              {filtered.map(asset => {
                const g = groupOfAsset(asset)
                const isCard = g === 'card'
                const balance = asset.balance ?? 0
                const amt = Math.abs(balance)
                // 카드 사용액은 음수 표기 컨벤션, 계좌는 실제 부호(대출 등 음수 잔액).
                // 0 은 부호·강조 없이 '0원' (−0원 방지).
                const neg = (isCard ? -amt : balance) < 0
                const brand = getBrandColor(asset.institution, asset.assetName)
                const accentColor = asset.color || brand?.bg || 'var(--fg-tertiary)'
                const iconChar = (asset.institution || asset.assetName || '?').charAt(0)
                return (
                  <div
                    key={asset.rowId}
                    className={MANAGE_ROW.className}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setDetail(asset)}
                  >
                    <span
                      style={{
                        ...MANAGE_ROW.iconStyle,
                        background: accentColor,
                        color: brand?.fg || 'var(--fg-on-brand)',
                        fontSize: 'var(--text-label-sm)',
                      }}
                    >
                      {iconChar}
                    </span>
                    <div style={MANAGE_ROW.textStyle}>
                      <div style={MANAGE_ROW.labelStyle}>{asset.assetName}</div>
                      <div style={MANAGE_ROW.metaStyle}>
                        {asset.institution || asset.assetType.replace('_', ' ').toLowerCase()}
                        {asset.memo && (
                          <>
                            <span className="dot-sep" />
                            {asset.memo}
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: mobile ? -8 : 12 }}>
                      <div
                        className="num"
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: 'var(--font-weight-bold)',
                          letterSpacing: '-0.012em',
                          color: neg ? 'var(--fg-expense)' : 'var(--fg-primary)',
                        }}
                      >
                        <MaskAmount mask="••••">
                          {neg ? '−' : ''}
                          {KRW(amt)}
                        </MaskAmount>
                        <HideUnit>원</HideUnit>
                      </div>
                      {asset.isIncludedInTotal === 'N' && (
                        <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                          총액 제외
                        </div>
                      )}
                    </div>
                    {!mobile ? (
                      <div className={MANAGE_ROW.actionsClassName} onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="편집"
                          onClick={() => setEditing({ mode: 'edit', asset })}
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
                    ) : (
                      <button
                        style={MANAGE_ROW.moreStyle}
                        onClick={e => {
                          e.stopPropagation()
                          setDetail(asset)
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="cat-list__empty">
                  <Wallet size={20} style={{ color: 'var(--fg-tertiary)' }} />
                  <div>등록된 {groupLabel(tab)}이 없어요.</div>
                </div>
              )}
            </>
          )}
        </div>

      </ManagerShell>

      {editing && (
        <AssetEditDialog
          item={editing.mode === 'edit' ? editing.asset : null}
          group={editing.mode === 'edit' ? groupOfAsset(editing.asset) : editing.group}
          onClose={() => setEditing(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={
            editing.mode === 'edit'
              ? () => {
                  setConfirmDelete(editing.asset)
                  setEditing(null)
                }
              : undefined
          }
          mobile={mobile}
          isSubmitting={isSubmitting}
        />
      )}

      {detail && (
        <AssetDetailDialog
          asset={detail}
          onClose={() => setDetail(null)}
          onEdit={asset => {
            setEditing({ mode: 'edit', asset })
            setDetail(null)
          }}
          mobile={mobile}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={
            groupOfAsset(confirmDelete) === 'account'
              ? '계좌 삭제'
              : groupOfAsset(confirmDelete) === 'card'
              ? '카드 삭제'
              : '투자 상품 삭제'
          }
          message={`"${confirmDelete.assetName}"을(를) 목록에서 제거합니다. 연결된 거래 내역은 유지됩니다.`}
          confirmLabel="삭제"
          danger
          loading={deleteAsset.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </>
  )
}

/** AccountManager skeleton — asset row 리스트(icon + name + meta + 금액 + actions). */
function AccountManagerSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={MANAGE_ROW.className}>
          <SkeletonBase className="h-9 w-9 rounded-md shrink-0" />
          <div style={MANAGE_ROW.textStyle}>
            <SkeletonBase className="h-4 w-32 mb-1.5" />
            <SkeletonBase className="h-3 w-20" />
          </div>
          <div style={{ textAlign: 'right', marginRight: mobile ? 8 : 12 }}>
            <SkeletonBase className="h-4 w-24 ml-auto" />
          </div>
          {!mobile ? (
            <div className="flex gap-1">
              <SkeletonBase className="h-7 w-14 rounded-md" />
              <SkeletonBase className="h-7 w-7 rounded-md" />
            </div>
          ) : (
            <SkeletonBase className="h-5 w-5 rounded-md" />
          )}
        </div>
      ))}
    </>
  )
}
