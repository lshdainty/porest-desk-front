import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { cardKeys } from '@/shared/config'
import { cardCatalogApi } from '../api/cardCatalogApi'
import type { CardCatalogSearchParams } from '@/entities/card'

export const useCardCatalogs = (params?: CardCatalogSearchParams) => {
  return useQuery({
    queryKey: cardKeys.catalogs(params),
    queryFn: () => cardCatalogApi.search(params),
    placeholderData: keepPreviousData,
  })
}

export const useCardCatalogDetail = (id: number | null) => {
  return useQuery({
    queryKey: cardKeys.catalogDetail(id ?? 0),
    queryFn: () => cardCatalogApi.getDetail(id!),
    enabled: id != null && id > 0,
  })
}

export const useAvailableBenefits = (cardRowId: number | null, expenseCategoryRowId: number | null) => {
  return useQuery({
    queryKey: cardKeys.availableBenefits(cardRowId ?? 0, expenseCategoryRowId ?? 0),
    queryFn: () => cardCatalogApi.getAvailableBenefits(cardRowId!, expenseCategoryRowId!),
    enabled: cardRowId != null && cardRowId > 0 && expenseCategoryRowId != null && expenseCategoryRowId > 0,
  })
}
