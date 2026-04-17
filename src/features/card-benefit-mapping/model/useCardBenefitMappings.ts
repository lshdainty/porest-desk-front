import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cardKeys } from '@/shared/config'
import { cardBenefitMappingApi } from '../api/cardBenefitMappingApi'
import type { CardBenefitMappingUpsertValues } from '@/entities/card'

export const useCardBenefitMappings = () => {
  return useQuery({
    queryKey: cardKeys.benefitMappings(),
    queryFn: () => cardBenefitMappingApi.list(),
  })
}

export const useUpsertCardBenefitMapping = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CardBenefitMappingUpsertValues) => cardBenefitMappingApi.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.benefitMappings() })
      qc.invalidateQueries({ queryKey: [...cardKeys.all, 'available-benefits'] })
    },
  })
}

export const useDeleteCardBenefitMapping = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cardBenefitMappingApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.benefitMappings() })
      qc.invalidateQueries({ queryKey: [...cardKeys.all, 'available-benefits'] })
    },
  })
}
