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
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { AssetList } from './AssetList'
import { AssetForm } from './AssetForm'
import { AssetSummaryCard } from './AssetSummaryCard'
import { AssetTransferList } from './AssetTransferList'
import { AssetTransferForm } from './AssetTransferForm'
import { AssetDetailDialog } from './AssetDetailDialog'

type TabType = 'assets' | 'transfers'

export const AssetFullWidget = () => {
  const { t } = useTranslation('asset')

  const [activeTab, setActiveTab] = useState<TabType>('assets')
  const [showForm, setShowForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const isMobile = useIsMobile()

  const { data: assetsData, isLoading } = useAssets()
  const { data: summary, isLoading: isSummaryLoading } = useAssetSummary()
  const { data: transfersData, isLoading: isTransfersLoading } = useAssetTransfers()
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
        {isSummaryLoading ? (
          <AssetSummaryCardSkeleton />
        ) : (
          summary && <AssetSummaryCard summary={summary} assets={assets} />
        )}

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
            <Button
              variant="ghost"
              size="xs"
              onClick={() => { setEditingAsset(null); setShowForm(true) }}
              className="ml-auto gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus size={12} />
              {t('addAsset')}
            </Button>
          )}
          {activeTab === 'transfers' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowTransferForm(true)}
              className="ml-auto gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus size={12} />
              {t('addTransfer')}
            </Button>
          )}
        </div>
      </div>

      {/* 스크롤: 리스트 */}
      <ScrollArea className="mt-4 min-h-0 flex-1">
        {activeTab === 'assets' && (
          isLoading ? (
            <AssetRowsSkeleton />
          ) : (
            <AssetList
              assets={assets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRowClick={(asset) => setDetailAsset(asset)}
            />
          )
        )}

        {activeTab === 'transfers' && (
          isTransfersLoading ? (
            <AssetRowsSkeleton />
          ) : (
            <AssetTransferList transfers={transfers} onDelete={handleDeleteTransfer} isDeleting={deleteTransfer.isPending} />
          )
        )}
      </ScrollArea>

      {detailAsset && (
        <AssetDetailDialog
          asset={detailAsset}
          mobile={isMobile}
          onClose={() => setDetailAsset(null)}
          onEdit={(asset) => {
            setDetailAsset(null)
            setEditingAsset(asset)
            setShowForm(true)
          }}
        />
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
              loading={deleteAsset.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** AssetSummaryCard skeleton — Hero 카드 + 도넛+타입 breakdown grid 자리. */
function AssetSummaryCardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBase className="h-28 w-full rounded-2xl" />
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex w-full justify-center md:w-1/2">
            <SkeletonBase className="aspect-square h-[140px] w-[140px] rounded-full" />
          </div>
          <div className="w-full md:w-1/2">
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                  <SkeletonBase className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <SkeletonBase className="h-3 w-12" />
                    <SkeletonBase className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 자산/이체 리스트 행 skeleton — 아이콘 + 이름/메타 + 금액 행 × 5. */
function AssetRowsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
          <SkeletonBase className="h-9 w-9 shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBase className="h-4 w-32" />
            <SkeletonBase className="h-3 w-20" />
          </div>
          <SkeletonBase className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
