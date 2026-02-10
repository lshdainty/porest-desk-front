import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/shared/hooks'
import {
  useAssets,
  useAssetSummary,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAssetTransfers,
  useCreateTransfer,
  useDeleteTransfer,
} from '@/features/asset'
import type { Asset, AssetFormValues, AssetUpdateFormValues, AssetTransferFormValues } from '@/entities/asset'
import { AssetList } from './AssetList'
import { AssetForm } from './AssetForm'
import { AssetSummaryCard } from './AssetSummaryCard'
import { AssetTransferList } from './AssetTransferList'
import { AssetTransferForm } from './AssetTransferForm'

type TabType = 'assets' | 'transfers'

export const AssetFullWidget = () => {
  const { t } = useTranslation('asset')
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState<TabType>('assets')
  const [showForm, setShowForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const { data: assetsData, isLoading } = useAssets()
  const { data: summary } = useAssetSummary()
  const { data: transfersData } = useAssetTransfers()
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()
  const createTransfer = useCreateTransfer()
  const deleteTransfer = useDeleteTransfer()

  const assets = assetsData?.assets ?? []
  const transfers = transfersData?.transfers ?? []

  const handleCreate = useCallback((data: AssetFormValues) => {
    createAsset.mutate(data, {
      onSuccess: () => setShowForm(false),
    })
  }, [createAsset])

  const handleUpdate = useCallback((data: AssetUpdateFormValues) => {
    if (!editingAsset) return
    updateAsset.mutate({ id: editingAsset.rowId, data }, {
      onSuccess: () => {
        setEditingAsset(null)
        setShowForm(false)
      },
    })
  }, [editingAsset, updateAsset])

  const handleEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setShowDeleteConfirm(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm) {
      deleteAsset.mutate(showDeleteConfirm, {
        onSuccess: () => setShowDeleteConfirm(null),
      })
    }
  }, [showDeleteConfirm, deleteAsset])

  const handleCreateTransfer = useCallback((data: AssetTransferFormValues) => {
    createTransfer.mutate(data, {
      onSuccess: () => setShowTransferForm(false),
    })
  }, [createTransfer])

  const handleDeleteTransfer = useCallback((id: number) => {
    deleteTransfer.mutate(id)
  }, [deleteTransfer])

  return (
    <div className="space-y-4">
      {summary && <AssetSummaryCard summary={summary} />}

      <div className="flex items-center gap-2 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'assets' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('assets')}
        >
          {t('assets')}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'transfers' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('transfers')}
        >
          {t('transfers')}
        </button>
      </div>

      {activeTab === 'assets' && (
        <>
          <div className="flex justify-end">
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => { setEditingAsset(null); setShowForm(true) }}
            >
              {t('addAsset')}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">{t('loading')}</div>
          ) : (
            <AssetList assets={assets} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </>
      )}

      {activeTab === 'transfers' && (
        <>
          <div className="flex justify-end">
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowTransferForm(true)}
            >
              {t('addTransfer')}
            </button>
          </div>
          <AssetTransferList transfers={transfers} onDelete={handleDeleteTransfer} />
        </>
      )}

      {showForm && (
        <AssetForm
          asset={editingAsset}
          onSubmit={editingAsset ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingAsset(null) }}
          isLoading={createAsset.isPending || updateAsset.isPending}
        />
      )}

      {showTransferForm && (
        <AssetTransferForm
          assets={assets}
          onSubmit={handleCreateTransfer}
          onClose={() => setShowTransferForm(false)}
          isLoading={createTransfer.isPending}
        />
      )}

      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{t('deleteConfirm.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('deleteConfirm.message')}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md px-4 py-2 text-sm hover:bg-muted"
                onClick={() => setShowDeleteConfirm(null)}
              >
                {t('deleteConfirm.cancel')}
              </button>
              <button
                className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDelete}
              >
                {t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
