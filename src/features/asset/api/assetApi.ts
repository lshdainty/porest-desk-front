import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  Asset,
  AssetFormValues,
  AssetUpdateFormValues,
  AssetSummary,
  AssetTransfer,
  AssetTransferFormValues,
  ReorderItem,
} from '@/entities/asset'

export interface TransferListParams {
  startDate?: string
  endDate?: string
}

export const assetApi = {
  createAsset: async (data: AssetFormValues): Promise<Asset> => {
    const resp: ApiResponse<Asset> = await apiClient.post('/v1/asset', data)
    return resp.data
  },

  getAssets: async (): Promise<{ assets: Asset[] }> => {
    const resp: ApiResponse<{ assets: Asset[] }> = await apiClient.get('/v1/assets')
    return resp.data
  },

  getAsset: async (id: number): Promise<Asset> => {
    const resp: ApiResponse<Asset> = await apiClient.get(`/v1/asset/${id}`)
    return resp.data
  },

  updateAsset: async (id: number, data: AssetUpdateFormValues): Promise<Asset> => {
    const resp: ApiResponse<Asset> = await apiClient.put(`/v1/asset/${id}`, data)
    return resp.data
  },

  deleteAsset: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/asset/${id}`)
    return resp.data
  },

  getAssetSummary: async (): Promise<AssetSummary> => {
    const resp: ApiResponse<AssetSummary> = await apiClient.get('/v1/assets/summary')
    return resp.data
  },

  reorderAssets: async (items: ReorderItem[]): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch('/v1/assets/reorder', { items })
    return resp.data
  },

  createTransfer: async (data: AssetTransferFormValues): Promise<AssetTransfer> => {
    const resp: ApiResponse<AssetTransfer> = await apiClient.post('/v1/asset-transfer', data)
    return resp.data
  },

  getTransfers: async (params?: TransferListParams): Promise<{ transfers: AssetTransfer[] }> => {
    const resp: ApiResponse<{ transfers: AssetTransfer[] }> = await apiClient.get('/v1/asset-transfers', { params })
    return resp.data
  },

  deleteTransfer: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/asset-transfer/${id}`)
    return resp.data
  },
}
