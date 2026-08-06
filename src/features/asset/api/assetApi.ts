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
  AssetTrade,
  AssetTradeFormValues,
  AssetTradePreview,
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

  /** amount 미전달 = 남은 청구액 전액, 전달 = 그만큼만(부분 선결제) */
  payCard: async (id: number, amount?: number): Promise<BillingItem> => {
    const resp: ApiResponse<BillingItem> = await apiClient.post(
      `/v1/asset/${id}/pay`,
      undefined,
      amount != null ? { params: { amount } } : undefined,
    )
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

  /** 이체 수정 — 서버가 이자 지출·잔액 이력을 되돌렸다 다시 만든다. rowId 는 유지된다. */
  updateTransfer: async (id: number, data: AssetTransferFormValues): Promise<AssetTransfer> => {
    const resp: ApiResponse<AssetTransfer> = await apiClient.put(`/v1/asset-transfer/${id}`, data)
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

  /** 저장하기 전에 결과를 물어본다 — 저장에 쓰는 계산 경로를 그대로 탄다. */
  previewTrade: async (data: AssetTradeFormValues): Promise<AssetTradePreview> => {
    const resp: ApiResponse<AssetTradePreview> = await apiClient.post('/v1/asset-trade/preview', data)
    return resp.data
  },

  createTrade: async (data: AssetTradeFormValues): Promise<AssetTrade> => {
    const resp: ApiResponse<AssetTrade> = await apiClient.post('/v1/asset-trade', data)
    return resp.data
  },

  getTrades: async (assetRowId: number): Promise<AssetTrade[]> => {
    const resp: ApiResponse<AssetTrade[]> = await apiClient.get('/v1/asset-trades', {
      params: { assetRowId },
    })
    return resp.data
  },

  deleteTrade: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/asset-trade/${id}`)
    return resp.data
  },
}
