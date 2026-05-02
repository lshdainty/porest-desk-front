import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  CardCatalogSummary,
  CardCatalogDetail,
  CardCatalogSearchParams,
  CardBenefit,
  PageResponse,
} from '@/entities/card'

export const cardCatalogApi = {
  search: async (params?: CardCatalogSearchParams): Promise<PageResponse<CardCatalogSummary>> => {
    const resp: ApiResponse<PageResponse<CardCatalogSummary>> = await apiClient.get('/v1/card-catalogs', { params })
    return resp.data
  },

  getDetail: async (id: number): Promise<CardCatalogDetail> => {
    const resp: ApiResponse<CardCatalogDetail> = await apiClient.get(`/v1/card-catalogs/${id}`)
    return resp.data
  },

  getAvailableBenefits: async (cardRowId: number, expenseCategoryRowId: number): Promise<CardBenefit[]> => {
    const resp: ApiResponse<CardBenefit[]> = await apiClient.get(
      `/v1/card-catalogs/${cardRowId}/available-benefits`,
      { params: { expenseCategoryRowId } }
    )
    return resp.data
  },
}
