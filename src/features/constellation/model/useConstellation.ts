import { useQuery } from '@tanstack/react-query'
import { constellationKeys } from '@/shared/config'
import { constellationApi } from '../api/constellationApi'

export const useConstellationToday = () => {
  return useQuery({
    queryKey: constellationKeys.today(),
    queryFn: () => constellationApi.getToday(),
  })
}

export const useConstellationSky = (days = 14) => {
  return useQuery({
    queryKey: constellationKeys.sky(days),
    queryFn: () => constellationApi.getSky(days),
    select: data => data.days,
  })
}

export const useConstellationCollection = () => {
  return useQuery({
    queryKey: constellationKeys.collection(),
    queryFn: () => constellationApi.getCollection(),
  })
}
