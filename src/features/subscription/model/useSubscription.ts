import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionKeys } from '@/shared/config'
import { subscriptionApi } from '../api/subscriptionApi'

const SECURITIES = 'SECURITIES'

/** 내 기능권한 + 토스 연결상태. 메뉴 게이트·설정의 단일 소스. */
export const useMyFeatures = () =>
  useQuery({
    queryKey: subscriptionKeys.myFeatures(),
    queryFn: () => subscriptionApi.getMyFeatures(),
    staleTime: 60_000,
  })

/** 증권 기능권한 보유 여부 (로딩 중엔 false → 게이트 기본 닫힘). */
export const useHasSecurities = (): boolean => {
  const { data } = useMyFeatures()
  return data?.features?.includes(SECURITIES) ?? false
}

export const useMySubscription = () =>
  useQuery({
    queryKey: subscriptionKeys.mySubscription(),
    queryFn: () => subscriptionApi.getMySubscription(),
    staleTime: 60_000,
  })

export const useSubscribe = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planCode: string) => subscriptionApi.subscribe(planCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

export const useCancelSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason?: string) => subscriptionApi.cancelSubscription(reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

export const useTossCredentialStatus = () =>
  useQuery({
    queryKey: subscriptionKeys.tossCredential(),
    queryFn: () => subscriptionApi.getTossCredentialStatus(),
    staleTime: 60_000,
  })

export const useRegisterTossCredential = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, clientSecret }: { clientId: string; clientSecret: string }) =>
      subscriptionApi.registerTossCredential(clientId, clientSecret),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.tossCredential() })
      qc.invalidateQueries({ queryKey: subscriptionKeys.myFeatures() })
    },
  })
}

export const useDisconnectTossCredential = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionApi.disconnectTossCredential(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.tossCredential() })
      qc.invalidateQueries({ queryKey: subscriptionKeys.myFeatures() })
    },
  })
}
