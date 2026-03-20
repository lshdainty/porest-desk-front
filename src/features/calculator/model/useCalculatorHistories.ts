import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calculatorKeys } from '@/shared/config'
import { calculatorApi } from '../api/calculatorApi'

export const useCalculatorHistories = () => {
  return useQuery({
    queryKey: calculatorKeys.histories(),
    queryFn: () => calculatorApi.getHistories(),
  })
}

export const useSaveCalculatorHistory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { expression: string; result: string }) =>
      calculatorApi.saveHistory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.all })
    },
  })
}

export const useDeleteAllCalculatorHistories = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => calculatorApi.deleteAllHistories(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.all })
    },
  })
}
