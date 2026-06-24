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
  NetWorthTrendPoint,
  AssetBalancePoint,
  CardBilling,
  BillingItem,
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

  // 투자 자산 ↔ 토스 보유종목 연결/해제 (프로+토스 연결 사용자 전용).
  linkTossSymbol: async (id: number, accountSeq: number, symbol: string): Promise<Asset> => {
    const resp: ApiResponse<Asset> = await apiClient.put(`/v1/asset/${id}/toss-link`, { accountSeq, symbol })
    return resp.data
  },

  unlinkTossSymbol: async (id: number): Promise<Asset> => {
    const resp: ApiResponse<Asset> = await apiClient.delete(`/v1/asset/${id}/toss-link`)
    return resp.data
  },

  getAssetSummary: async (year?: number, month?: number): Promise<AssetSummary> => {
    const params = year && month ? { year, month } : undefined
    const resp: ApiResponse<AssetSummary> = await apiClient.get('/v1/assets/summary', { params })
    return resp.data
  },

  getNetWorthTrend: async (months = 12): Promise<NetWorthTrendPoint[]> => {
    const resp: ApiResponse<{ trend: NetWorthTrendPoint[] }> = await apiClient.get('/v1/assets/net-worth-trend', { params: { months } })
    return resp.data.trend
  },

  getAssetBalanceTrend: async (assetId: number, weeks: number): Promise<AssetBalancePoint[]> => {
    const resp: ApiResponse<{ trend: AssetBalancePoint[] }> = await apiClient.get(`/v1/asset/${assetId}/balance-trend`, { params: { weeks } })
    return resp.data.trend
  },

  getCardBilling: async (id: number): Promise<CardBilling> => {
    const resp: ApiResponse<CardBilling> = await apiClient.get(`/v1/asset/${id}/billing`)
    return resp.data
  },

  payCard: async (id: number): Promise<BillingItem> => {
    const resp: ApiResponse<BillingItem> = await apiClient.post(`/v1/asset/${id}/pay`)
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
