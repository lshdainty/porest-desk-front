import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { oauthKeys } from '@/shared/config'
import { oauthLinkApi } from '../api/oauthLinkApi'

/** 연동 가능한 provider 목록 + 각 provider 의 연동 여부 조회 */
export const useOAuthProviders = () =>
  useQuery({
    queryKey: oauthKeys.providers(),
    queryFn: () => oauthLinkApi.getProviders(),
  })

/** 소셜 계정 연동 해제. 성공 시 provider 목록 재조회로 상태 갱신 */
export const useUnlinkOAuth = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => oauthLinkApi.unlink(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: oauthKeys.all })
    },
  })
}
