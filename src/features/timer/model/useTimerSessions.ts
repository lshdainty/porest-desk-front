import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timerKeys } from '@/shared/config'
import { timerApi } from '../api/timerApi'
import type { TimerSessionListParams, TimerDailyStatsParams } from '../api/timerApi'
import type { TimerSessionFormValues } from '@/entities/timer'

export const useTimerSessions = (filters?: TimerSessionListParams) => {
  return useQuery({
    queryKey: timerKeys.sessions(filters),
    queryFn: () => timerApi.getSessions(filters),
  })
}

export const useSaveTimerSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TimerSessionFormValues) => timerApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timerKeys.all })
    },
  })
}

export const useDeleteTimerSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => timerApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timerKeys.all })
    },
  })
}

export const useTimerDailyStats = (params: TimerDailyStatsParams) => {
  return useQuery({
    queryKey: timerKeys.dailyStats(params),
    queryFn: () => timerApi.getDailyStats(params),
  })
}
