import { useMemo, useState } from 'react'
import { ChevronRight, Loader2, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import type { Asset, AssetFormValues, AssetType, AssetUpdateFormValues } from '@/entities/asset'
import {
  useAssets,
  useCreateAsset,
  useDeleteAsset,
  useUpdateAsset,
} from '@/features/asset'
import { KRW } from '@/shared/lib/porest/format'
import { renderIcon } from '@/shared/lib'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { MANAGE_ROW } from '@/shared/ui/porest/manage-row'
import { MANAGER_LAYOUT, ManagerHead, ManagerShell, ManagerTabs } from '@/shared/ui/porest/manager-layout'
import { AssetDetailDialog } from '@/widgets/asset-full/ui/AssetDetailDialog'
import { AssetEditDialog, type AssetGroup } from './AssetEditDialog'

const GROUP_TYPES: Record<AssetGroup, AssetType[]> = {
  account: ['BANK_ACCOUNT', 'SAVINGS', 'CASH'],
  card: ['CREDIT_CARD', 'CHECK_CARD', 'LOAN'],
  invest: ['INVESTMENT'],
}

const groupOfAsset = (a: Asset): AssetGroup => {
  if (a.assetType === 'CREDIT_CARD' || a.assetType === 'CHECK_CARD' || a.assetType === 'LOAN') {
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

  const totalInTab = useMemo(
    () => filtered.reduce((sum, a) => sum + (a.balance ?? 0), 0),
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
            actions={
              <Button onClick={() => setEditing({ mode: 'create', group: tab })}>
                <Plus size={14} strokeWidth={2.4} />
                {groupLabel(tab)} 추가
              </Button>
            }
          />
        )}

        <div style={MANAGER_LAYOUT.toolbarStyle}>
          <ManagerTabs<AssetGroup>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'account', label: '계좌·예금', count: counts.account },
              { value: 'card', label: '카드', count: counts.card },
              { value: 'invest', label: '투자', count: counts.invest },
            ]}
          />
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>
            총{' '}
            <span className="num" style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>
              {KRW(totalInTab)}원
            </span>
          </div>
        </div>

        <div className="cat-list">
          {isLoading ? (
            <div className="cat-list__empty">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--fg-tertiary)' }} />
              <div>불러오는 중…</div>
            </div>
          ) : (
            <>
              {filtered.map(asset => {
                const g = groupOfAsset(asset)
                const isCard = g === 'card'
                const amt = Math.abs(asset.balance ?? 0)
                const neg = isCard
                const accentColor = asset.color || '#6b7280'
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
                        color: '#fff',
                        fontSize: 13,
                      }}
                    >
                      {asset.icon ? renderIcon(asset.icon, iconChar, 14) : iconChar}
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
                    <div style={{ textAlign: 'right', marginRight: mobile ? 8 : 12 }}>
                      <div
                        className="num"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                          color: neg ? 'var(--berry-700)' : 'var(--fg-primary)',
                        }}
                      >
                        {neg ? '−' : ''}
                        {KRW(amt)}원
                      </div>
                      {asset.isIncludedInTotal === 'N' && (
                        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                          총액 제외
                        </div>
                      )}
                    </div>
                    {!mobile ? (
                      <div className={MANAGE_ROW.actionsClassName} onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing({ mode: 'edit', asset })}
                        >
                          <Pencil size={13} />편집
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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

        {mobile && (
          <button
            className="cat-add-fab"
            onClick={() => setEditing({ mode: 'create', group: tab })}
          >
            <Plus size={20} strokeWidth={2.4} />
            <span>{groupLabel(tab)} 추가</span>
          </button>
        )}
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
