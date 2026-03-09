import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { holidayKeys } from '@/shared/config'
import { holidayApi } from '../api/holidayApi'
import type { HolidayFormValues } from '../api/holidayApi'

/**
 * 캘린더 뷰에서 공휴일 데이터를 조회하는 훅
 * holiday 캘린더 소스가 enabled일 때만 쿼리를 실행하여 성능 최적화
 */
export const useCalendarHolidays = (
  startDate: string,
  endDate: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: holidayKeys.list({ startDate, endDate }),
    queryFn: () => holidayApi.getHolidays(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
  })
}

export const useCreateHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: HolidayFormValues) => holidayApi.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HolidayFormValues }) =>
      holidayApi.updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => holidayApi.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}
