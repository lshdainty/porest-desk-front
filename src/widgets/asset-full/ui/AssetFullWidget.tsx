import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 고정: 요약 + 탭바 + 추가 버튼 */}
      <div className="shrink-0 space-y-4">
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
          {activeTab === 'assets' && (
            <button
              onClick={() => { setEditingAsset(null); setShowForm(true) }}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus size={12} />
              {t('addAsset')}
            </button>
          )}
          {activeTab === 'transfers' && (
            <button
              onClick={() => setShowTransferForm(true)}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus size={12} />
              {t('addTransfer')}
            </button>
          )}
        </div>
      </div>

      {/* 스크롤: 리스트 */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'assets' && (
          isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <AssetList assets={assets} onEdit={handleEdit} onDelete={handleDelete} />
          )
        )}

        {activeTab === 'transfers' && (
          <AssetTransferList transfers={transfers} onDelete={handleDeleteTransfer} isDeleting={deleteTransfer.isPending} />
        )}
      </div>

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

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteAsset.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAsset.isPending ? '...' : t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
