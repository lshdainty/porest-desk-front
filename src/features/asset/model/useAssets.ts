import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetKeys } from '@/shared/config'
import { assetApi } from '../api/assetApi'
import type { TransferListParams } from '../api/assetApi'
import type {
  AssetFormValues,
  AssetUpdateFormValues,
  AssetTransferFormValues,
  ReorderItem,
} from '@/entities/asset'

export const useAssets = () => {
  return useQuery({
    queryKey: assetKeys.list(),
    queryFn: () => assetApi.getAssets(),
  })
}

export const useAsset = (id: number) => {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetApi.getAsset(id),
    enabled: id > 0,
  })
}

export const useAssetSummary = () => {
  return useQuery({
    queryKey: assetKeys.summary(),
    queryFn: () => assetApi.getAssetSummary(),
  })
}

export const useNetWorthTrend = (months = 12) => {
  return useQuery({
    queryKey: assetKeys.netWorthTrend(months),
    queryFn: () => assetApi.getNetWorthTrend(months),
    enabled: months > 0,
  })
}

export const useCreateAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AssetFormValues) => assetApi.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}

export const useUpdateAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssetUpdateFormValues }) =>
      assetApi.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}

export const useDeleteAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => assetApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}

export const useReorderAssets = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: ReorderItem[]) => assetApi.reorderAssets(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}

export const useAssetTransfers = (params?: TransferListParams) => {
  return useQuery({
    queryKey: assetKeys.transfers(params),
    queryFn: () => assetApi.getTransfers(params),
  })
}

export const useCreateTransfer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AssetTransferFormValues) => assetApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}

export const useDeleteTransfer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => assetApi.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}
