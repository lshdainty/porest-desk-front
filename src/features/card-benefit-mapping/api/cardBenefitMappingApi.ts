import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  CardBenefitCategoryMapping,
  CardBenefitMappingUpsertValues,
} from '@/entities/card'

export const cardBenefitMappingApi = {
  list: async (): Promise<{ mappings: CardBenefitCategoryMapping[] }> => {
    const resp: ApiResponse<{ mappings: CardBenefitCategoryMapping[] }> = await apiClient.get('/v1/card-benefit-mappings')
    return resp.data
  },

  upsert: async (data: CardBenefitMappingUpsertValues): Promise<CardBenefitCategoryMapping> => {
    const resp: ApiResponse<CardBenefitCategoryMapping> = await apiClient.post('/v1/card-benefit-mappings', data)
    return resp.data
  },

  delete: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/card-benefit-mappings/${id}`)
    return resp.data
  },
}
